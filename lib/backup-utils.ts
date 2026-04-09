import { spawn } from "node:child_process";
import AdmZip from "adm-zip";
import { listAllObjects, putObjectBuffer, getObjectBuffer, PRIVATE_BUCKET, PUBLIC_BUCKET } from "./r2";
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
  const filename = `printhub-full-backup-${new Date().toISOString().split("T")[0]}-${new Date().getHours()}${new Date().getMinutes()}.zip`;
  const zip = new AdmZip();

  // 1. Database Dump
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  
  const dumpBuffer = await new Promise<Buffer>((resolve, reject) => {
    const pgDump = spawn("pg_dump", [dbUrl]);
    const chunks: Buffer[] = [];
    pgDump.stdout.on("data", (chunk) => chunks.push(chunk));
    pgDump.stdout.on("error", (err) => console.error("pg_dump stdout error:", err));
    pgDump.on("error", reject);
    pgDump.on("close", (code) => {
      if (code !== 0) reject(new Error(`pg_dump failed with code ${code}`));
      else resolve(Buffer.concat(chunks));
    });
  });
  zip.addFile("db/dump.sql", dumpBuffer);

  // 2. R2 Files (Full Backup)
  console.log("Backing up R2 files...");
  const buckets: ("private" | "public")[] = ["private", "public"];
  for (const b of buckets) {
    const objects = await listAllObjects(b);
    for (const obj of objects) {
      if (!obj.Key) continue;
      // Skip existing backups to avoid recursion
      if (obj.Key.startsWith("backups/")) continue;
      
      const buffer = await getObjectBuffer(b, obj.Key);
      if (buffer) {
        zip.addFile(`files/${b}/${obj.Key}`, buffer);
      }
    }
  }

  // 3. Env Keys (Non-sensitive placeholders)
  const envKeys = Object.keys(process.env).filter(k => !k.includes("SECRET") && !k.includes("KEY") && !k.includes("TOKEN"));
  zip.addFile("env-manifest.json", Buffer.from(JSON.stringify(envKeys, null, 2)));

  // 4. Manifest
  const pkgPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(await fs.readFile(pkgPath, "utf-8").catch(() => '{"version":"0.0.0"}'));
  const manifest: BackupManifest = {
    timestamp: new Date().toISOString(),
    appVersion: packageJson.version,
    nodeVersion: process.version,
    createdBy: { userId, email },
    databaseName: dbUrl.split("/").pop()?.split("?")[0] || "unknown",
    components: ["database", "r2-files", "env-manifest"],
  };
  zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2)));

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

export async function restoreFullSystem(zipBuffer: Buffer, onProgress: (step: string, status: "in_progress" | "done" | "failed") => void) {
  const zip = new AdmZip(zipBuffer);
  const manifestEntry = zip.getEntry("manifest.json");
  const dumpEntry = zip.getEntry("db/dump.sql");

  if (!manifestEntry || !dumpEntry) {
    throw new Error("Invalid backup: missing manifest or database dump");
  }

  onProgress("Validating backup package", "in_progress");
  const manifest = JSON.parse(manifestEntry.getData().toString("utf-8")) as BackupManifest;
  onProgress("Validating backup package", "done");

  // 1. Database Restore
  onProgress("Restoring database (Postgres)", "in_progress");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "printhub-restore-"));
  const dumpPath = path.join(tempDir, "dump.sql");
  await fs.writeFile(dumpPath, dumpEntry.getData());

  await new Promise<void>((resolve, reject) => {
    // Note: We use -c to drop existing objects before restore if the dump was created with -c, 
    // or just pipe it. pg_dump by default doesn't include drop.
    const psql = spawn("psql", [dbUrl, "-f", dumpPath]);
    psql.on("error", reject);
    psql.on("close", (code) => {
      if (code !== 0) reject(new Error(`psql failed with code ${code}`));
      else resolve();
    });
  });
  await fs.rm(tempDir, { recursive: true, force: true });
  onProgress("Restoring database (Postgres)", "done");

  // 2. R2 Files Restore
  onProgress("Restoring R2 files", "in_progress");
  const zipEntries = zip.getEntries();
  for (const entry of zipEntries) {
    if (entry.entryName.startsWith("files/")) {
      const parts = entry.entryName.split("/");
      const bucketLabel = parts[1] as "private" | "public";
      const key = parts.slice(2).join("/");
      
      if (key && !entry.isDirectory) {
        await putObjectBuffer({
          bucket: bucketLabel,
          key,
          body: entry.getData(),
          contentType: "application/octet-stream", // Fallback, could be improved with mime lookup
        });
      }
    }
  }
  onProgress("Restoring R2 files", "done");

  onProgress("System Restoration Complete", "done");
  return manifest;
}
