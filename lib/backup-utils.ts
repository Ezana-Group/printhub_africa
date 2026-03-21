import { spawn } from "node:child_process";
import { prisma } from "./prisma";
import AdmZip from "adm-zip";
import { listAllObjects, putObjectBuffer, PRIVATE_BUCKET } from "./r2";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export type BackupManifest = {
  timestamp: string;
  appVersion: string;
  nodeVersion: string;
  createdBy: { userId: string; email: string };
  databaseName: string;
  components: string[];
};

export async function createFullBackup(userId: string, email: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `printhub-backup-${new Date().toISOString().split("T")[0]}-${new Date().getHours()}${new Date().getMinutes()}.zip`;
  const zip = new AdmZip();

  // 1. Database Dump
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  
  const dumpBuffer = await new Promise<Buffer>((resolve, reject) => {
    const pgDump = spawn("pg_dump", [dbUrl]);
    const chunks: Buffer[] = [];
    pgDump.stdout.on("data", (chunk) => chunks.push(chunk));
    pgDump.on("error", reject);
    pgDump.on("close", (code) => {
      if (code !== 0) reject(new Error(`pg_dump failed with code ${code}`));
      else resolve(Buffer.concat(chunks));
    });
  });
  zip.addFile("database-dump.sql", dumpBuffer);

  // 2. Env Keys
  const envKeys = Object.keys(process.env);
  zip.addFile("env-keys.json", Buffer.from(JSON.stringify(envKeys, null, 2)));

  // 3. Manifest
  const packageJson = JSON.parse(await fs.readFile(path.join(process.cwd(), "package.json"), "utf-8"));
  const manifest: BackupManifest = {
    timestamp: new Date().toISOString(),
    appVersion: packageJson.version,
    nodeVersion: process.version,
    createdBy: { userId, email },
    databaseName: dbUrl.split("/").pop()?.split("?")[0] || "unknown",
    components: ["database", "env-keys", "r2-manifest"],
  };
  zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2)));

  // 4. R2 Manifest
  const r2Objects = await listAllObjects("private");
  const r2Manifest = r2Objects.map(obj => ({
    key: obj.Key,
    size: obj.Size,
    lastModified: obj.LastModified,
  }));
  zip.addFile("r2-manifest.json", Buffer.from(JSON.stringify(r2Manifest, null, 2)));

  const zipBuffer = zip.toBuffer();
  const r2Key = `backups/${filename}`;
  
  await putObjectBuffer({
    bucket: "private",
    key: r2Key,
    body: zipBuffer,
    contentType: "application/zip",
  });

  return {
    filename,
    r2Key,
    sizeBytes: BigInt(zipBuffer.length),
  };
}

export async function restoreDatabase(zipBuffer: Buffer, onProgress: (step: string, status: "in_progress" | "done" | "failed") => void) {
  const zip = new AdmZip(zipBuffer);
  const manifestEntry = zip.getEntry("manifest.json");
  const dumpEntry = zip.getEntry("database-dump.sql");

  if (!manifestEntry || !dumpEntry) {
    throw new Error("Invalid backup: missing manifest or database dump");
  }

  onProgress("Validating backup", "in_progress");
  const manifest = JSON.parse(manifestEntry.getData().toString("utf-8")) as BackupManifest;
  // Version compatibility check (warning only in UI if needed, here we just proceed)
  onProgress("Validating backup", "done");

  onProgress("Restoring database", "in_progress");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  // Write dump to a temp file because psql might be easier with a file or piped stdin
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "printhub-restore-"));
  const dumpPath = path.join(tempDir, "dump.sql");
  await fs.writeFile(dumpPath, dumpEntry.getData());

  await new Promise<void>((resolve, reject) => {
    // psql -d <url> -f <file>
    const psql = spawn("psql", [dbUrl, "-f", dumpPath]);
    psql.on("error", reject);
    psql.on("close", (code) => {
      if (code !== 0) reject(new Error(`psql failed with code ${code}`));
      else resolve();
    });
  });
  
  await fs.rm(tempDir, { recursive: true, force: true });
  onProgress("Restoring database", "done");

  onProgress("Complete — restarting", "done");
  return manifest;
}
