#!/usr/bin/env node
/**
 * Pushes all local workflow JSON files to a running n8n instance via REST API.
 * Matches by workflow name: updates existing, creates new ones.
 *
 * Usage:
 *   N8N_API_KEY=<key> node scripts/push-workflows-to-n8n.mjs
 *   N8N_API_KEY=<key> N8N_DRY_RUN=1 node scripts/push-workflows-to-n8n.mjs
 *
 * Get your API key: n8n UI → Settings → n8n API → Create an API Key
 */

import https from "https";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const N8N_BASE_URL = process.env.N8N_BASE_URL || "https://n8n.printhub.africa";
const N8N_API_KEY = process.env.N8N_API_KEY;
const DRY_RUN = process.env.N8N_DRY_RUN === "1";
const WORKFLOWS_DIR = path.join(__dirname, "../n8n/workflows");

if (!N8N_API_KEY) {
  console.error("ERROR: Set N8N_API_KEY environment variable.");
  console.error("  n8n UI → Settings → n8n API → Create an API Key, then:");
  console.error("  N8N_API_KEY=<key> node scripts/push-workflows-to-n8n.mjs");
  process.exit(1);
}

if (DRY_RUN) console.log("DRY RUN — no changes will be made.\n");

function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, N8N_BASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function fetchAllWorkflows() {
  let all = [];
  let cursor = null;
  do {
    const qs = cursor ? `?limit=100&cursor=${cursor}` : "?limit=100";
    const res = await apiRequest("GET", `/api/v1/workflows${qs}`);
    if (res.status !== 200) {
      console.error("Failed to fetch workflows:", res.status, res.body);
      process.exit(1);
    }
    all = all.concat(res.body.data || []);
    cursor = res.body.nextCursor || null;
  } while (cursor);
  return all;
}

async function main() {
  console.log(`Target: ${N8N_BASE_URL}\n`);

  // 1. Fetch all existing workflows
  const existingWorkflows = await fetchAllWorkflows();
  // Only index non-archived workflows for matching.
  // Archived workflows (deletedAt != null or isArchived) cannot be PUT — skip them
  // so the script falls through to CREATE a fresh copy instead.
  const existingByName = {};
  let archivedCount = 0;
  for (const wf of existingWorkflows) {
    const isArchived = wf.isArchived || wf.deletedAt != null;
    if (isArchived) { archivedCount++; continue; }
    // Prefer the most recently updated non-archived workflow if duplicates exist
    if (!existingByName[wf.name] || (wf.updatedAt > existingByName[wf.name].updatedAt)) {
      existingByName[wf.name] = wf;
    }
  }
  console.log(`Workflows on n8n: ${existingWorkflows.length} (${archivedCount} archived, ${Object.keys(existingByName).length} active/inactive)`);

  // 2. Resolve Global Error Handler ID
  const errorHandler = existingWorkflows.find(
    (w) => w.name && w.name.toLowerCase().includes("error handler")
  );
  const errorWorkflowId = errorHandler ? String(errorHandler.id) : null;
  console.log(
    errorWorkflowId
      ? `Global Error Handler ID: ${errorWorkflowId}\n`
      : "WARNING: Global Error Handler not found — errorWorkflow placeholders unchanged.\n"
  );

  // 3. Find all local workflow files (subdirectories only, skip root-level bundles)
  const files = execSync(`find "${WORKFLOWS_DIR}" -mindepth 2 -name "*.json"`)
    .toString().trim().split("\n").filter(Boolean).sort();
  console.log(`Local workflow files: ${files.length}\n`);

  let created = 0, updated = 0, failed = 0;

  for (const file of files) {
    const filename = path.basename(file);

    // Skip the global error handler — update it separately to avoid ID collision
    if (filename.toLowerCase().includes("global-error-handler")) {
      console.log(`  SKIP   ${filename} (manage error handler separately)`);
      continue;
    }

    let rawContent = fs.readFileSync(file, "utf8");

    // Substitute error workflow ID placeholder
    if (errorWorkflowId) {
      rawContent = rawContent.replace(/\{\{GLOBAL_ERROR_HANDLER_ID\}\}/g, errorWorkflowId);
    }

    let workflow;
    try {
      workflow = JSON.parse(rawContent);
    } catch (err) {
      console.log(`  ERROR  ${filename}: invalid JSON — ${err.message}`);
      failed++;
      continue;
    }

    const workflowName = workflow.name;
    const existing = existingByName[workflowName];
    const action = existing ? "UPDATE" : "CREATE";

    if (DRY_RUN) {
      console.log(`  ${action.padEnd(6)} [DRY] ${workflowName}`);
      continue;
    }

    if (existing) {
      const wasActive = existing.active === true;

      // Deactivate first — n8n rejects PUT on active workflows if they have
      // credential issues or if the "active" field is treated as read-only.
      if (wasActive) {
        await apiRequest("POST", `/api/v1/workflows/${existing.id}/deactivate`);
      }

      const payload = {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
      };
      let res = await apiRequest("PUT", `/api/v1/workflows/${existing.id}`, payload);

      // Final fallback: strip settings if still rejected
      if (res.status === 400 && typeof res.body?.message === "string" && res.body.message.includes("active")) {
        res = await apiRequest("PUT", `/api/v1/workflows/${existing.id}`, {
          name: workflow.name,
          nodes: workflow.nodes,
          connections: workflow.connections,
        });
      }

      if (res.status === 200) {
        // Re-activate if it was running before
        if (wasActive) {
          const reactivate = await apiRequest("POST", `/api/v1/workflows/${existing.id}/activate`);
          if (reactivate.status === 200) {
            console.log(`  UPDATE ✓ ${workflowName} (kept active)`);
          } else {
            // Credential not set up yet — leave deactivated, user activates after setup
            console.log(`  UPDATE ✓ ${workflowName} (deactivated — configure credentials to re-activate)`);
          }
        } else {
          console.log(`  UPDATE ✓ ${workflowName}`);
        }
        updated++;
      } else {
        // Restore active state if update failed
        if (wasActive) await apiRequest("POST", `/api/v1/workflows/${existing.id}/activate`).catch(() => {});
        console.log(`  ERROR  ${workflowName}: HTTP ${res.status}`, JSON.stringify(res.body).slice(0, 150));
        failed++;
      }
    } else {
      const res = await apiRequest("POST", "/api/v1/workflows", {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
        active: false,
      });
      if (res.status === 200 || res.status === 201) {
        console.log(`  CREATE ✓ ${workflowName}`);
        created++;
      } else {
        console.log(`  ERROR  ${workflowName}: HTTP ${res.status}`, JSON.stringify(res.body).slice(0, 150));
        failed++;
      }
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
