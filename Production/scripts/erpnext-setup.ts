/**
 * ERPNext one-time setup for PrintHub.
 * Run after first ERPNext startup: npm run erpnext:setup
 *
 * Configures: API keys, Company, Chart of Accounts, Taxes, Items, Item Groups,
 * Warehouse, Customer Group, Payroll (Kenya), Leave Types, Asset Category.
 */

import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";

const BASE = process.env.ERPNEXT_URL ?? "http://localhost:8080";
const SITE = "printhub.localhost";

type ApiResponse = { message?: string; [k: string]: unknown };

function getAuthHeader(apiKey: string, apiSecret: string): Record<string, string> {
  return { Authorization: `token ${apiKey}:${apiSecret}` };
}

function envPath(): string {
  const root = path.resolve(__dirname, "..");
  const candidates = [path.join(root, ".env"), path.join(root, ".env.local")];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(root, ".env");
}

function updateEnv(apiKey: string, apiSecret: string): void {
  const p = envPath();
  let content = fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
  const lines = content.split("\n");
  const keyLine = lines.findIndex((l) => /^\s*ERPNEXT_API_KEY\s*=/.test(l));
  const secretLine = lines.findIndex((l) => /^\s*ERPNEXT_API_SECRET\s*=/.test(l));

  const newKey = `ERPNEXT_API_KEY=${apiKey}`;
  const newSecret = `ERPNEXT_API_SECRET=${apiSecret}`;

  if (keyLine >= 0) lines[keyLine] = newKey;
  else lines.push(newKey);
  if (secretLine >= 0) lines[secretLine] = newSecret;
  else lines.push(newSecret);

  if (!content.endsWith("\n") && lines.length) lines.push("");
  fs.writeFileSync(p, lines.join("\n"));
}

/**
 * Generate API keys via bench execute in the backend container.
 * This works reliably in Docker where the API generate_keys often has permission issues.
 */
function generateKeysViaBench(): { api_key: string; api_secret: string } {
  if (!/^[a-z0-9_.-]+$/.test(SITE)) {
    throw new Error(`Invalid SITE value: ${SITE}. Only alphanumeric, underscore, period, hyphen allowed.`);
  }
  const composeFile = path.resolve(__dirname, "..", "docker-compose.erpnext.yml");
  const args = ["compose", "-f", composeFile, "exec", "-T", "backend", "bench", "--site", SITE, "execute", "frappe.core.doctype.user.user.generate_keys", "--args", '["Administrator"]'];
  const result = child_process.spawnSync("docker", args, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024,
  });
  if (result.error) {
    throw new Error("Failed to spawn docker: " + (result.error.message ?? String(result.error)) + (result.stderr ? " " + String(result.stderr).slice(0, 200) : ""));
  }
  const out = (result.stdout ?? "").trim();
  if (result.status !== 0) {
    throw new Error("bench execute failed: " + (result.stderr ?? out).slice(0, 200));
  }
  const data = JSON.parse(out) as { api_key?: string; api_secret?: string };
  if (data.api_key && data.api_secret) return { api_key: data.api_key, api_secret: data.api_secret };
  throw new Error("bench execute did not return api_key/api_secret: " + out.slice(0, 200));
}

async function api(
  method: string,
  path: string,
  body: unknown,
  auth: { apiKey: string; apiSecret: string }
): Promise<unknown> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...getAuthHeader(auth.apiKey, auth.apiSecret),
      "Content-Type": "application/json",
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function get(
  path: string,
  auth: { apiKey: string; apiSecret: string }
): Promise<unknown> {
  return api("GET", path, undefined as unknown, auth);
}

async function post(
  path: string,
  body: object,
  auth: { apiKey: string; apiSecret: string }
): Promise<unknown> {
  return api("POST", path, body, auth);
}

async function patch(
  path: string,
  body: object,
  auth: { apiKey: string; apiSecret: string }
): Promise<unknown> {
  return api("PATCH", path, body, auth);
}

async function ensureResource(
  auth: { apiKey: string; apiSecret: string },
  doctype: string,
  name: string,
  payload: object,
  createPath = "/api/resource/" + doctype
): Promise<void> {
  try {
    await get(`/api/resource/${doctype}/${encodeURIComponent(name)}`, auth);
    await patch(`/api/resource/${doctype}/${encodeURIComponent(name)}`, payload, auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("404") || msg.includes("Does not exist")) {
      await post(createPath, { ...payload, name: name.includes(" ") ? undefined : name } as object, auth);
    } else {
      throw e;
    }
  }
}

async function main(): Promise<void> {
  console.log("ERPNext PrintHub setup\n");

  // ━━━ STEP 1: Generate API Key (via bench in Docker) ━━━
  console.log("Step 1: Generating API key...");
  const { api_key: apiKey, api_secret: apiSecret } = generateKeysViaBench();
  updateEnv(apiKey, apiSecret);
  console.log("✅ API credentials saved to .env\n");

  const auth = { apiKey, apiSecret };

  // ━━━ STEP 2a: Warehouse Types (required by Company creation in some ERPNext versions) ━━━
  console.log("Step 2: Warehouse Types & Company...");
  for (const name of ["Transit", "Stores"]) {
    try {
      await post("/api/resource/Warehouse Type", { name }, auth);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Warehouse Type:", msg.slice(0, 80));
    }
  }

  // ━━━ STEP 2b: Company (create only if missing) ━━━
  let companyExists = false;
  try {
    await get("/api/resource/Company/PrintHub", auth);
    companyExists = true;
  } catch {
    // Company does not exist
  }
  if (!companyExists) {
    await post("/api/resource/Company", {
      name: "PrintHub",
      company_name: "PrintHub",
      abbr: "PH",
      default_currency: "KES",
      country: "Kenya",
      email: "admin@printhub.africa",
      website: "printhub.africa",
    }, auth);
  }
  console.log("✅ Company PrintHub configured\n");

  // ━━━ STEP 3: Chart of Accounts (create accounts if missing) ━━━
  console.log("Step 3: Chart of Accounts...");
  const accounts: Array<{ name: string; parent: string; root_type: string; account_type?: string; company: string }> = [
    { name: "Large Format Printing Revenue - PH", parent: "Sales - PH", root_type: "Income", company: "PrintHub" },
    { name: "3D Printing Revenue - PH", parent: "Sales - PH", root_type: "Income", company: "PrintHub" },
    { name: "Design Services Revenue - PH", parent: "Sales - PH", root_type: "Income", company: "PrintHub" },
    { name: "Rent Expense - PH", parent: "Expenses - PH", root_type: "Expense", company: "PrintHub" },
    { name: "Utilities Expense - PH", parent: "Expenses - PH", root_type: "Expense", company: "PrintHub" },
    { name: "Insurance Expense - PH", parent: "Expenses - PH", root_type: "Expense", company: "PrintHub" },
    { name: "Filament & Consumables - PH", parent: "Cost of Goods Sold - PH", root_type: "Expense", company: "PrintHub" },
    { name: "Machine Depreciation - PH", parent: "Expenses - PH", root_type: "Expense", company: "PrintHub" },
    { name: "Staff Salaries - PH", parent: "Expenses - PH", root_type: "Expense", company: "PrintHub" },
    { name: "M-Pesa - PH", parent: "Current Assets - PH", root_type: "Asset", account_type: "Bank", company: "PrintHub" },
    { name: "Cash - PH", parent: "Current Assets - PH", root_type: "Asset", account_type: "Cash", company: "PrintHub" },
  ];
  for (const acc of accounts) {
    try {
      await post("/api/resource/Account", {
        account_name: acc.name.replace(" - PH", ""),
        parent_account: acc.parent,
        root_type: acc.root_type,
        account_type: acc.account_type ?? (acc.root_type === "Income" ? "Income Account" : "Expense Account"),
        company: acc.company,
      }, auth);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Account skip:", msg.slice(0, 80));
    }
  }
  console.log("✅ Accounts configured\n");

  // ━━━ STEP 4: Tax template ━━━
  console.log("Step 4: Sales tax template...");
  try {
    await post("/api/resource/Sales Taxes and Charges Template", {
      title: "Kenya VAT 16%",
      company: "PrintHub",
      is_default: 1,
      taxes: [{ charge_type: "On Net Total", account_head: "VAT 16% - PH", description: "VAT @ 16%", rate: 16 }],
    }, auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Tax template:", msg.slice(0, 80));
  }
  console.log("✅ Kenya VAT 16% template\n");

  // ━━━ STEP 5: Item groups (before Items; Items reference item_group) ━━━
  console.log("Step 5: Item groups...");
  const groups = ["3D Printing Consumables", "Large Format Materials", "Printing Equipment", "Services"];
  for (const g of groups) {
    try {
      await post("/api/resource/Item Group", {
        item_group_name: g,
        parent_item_group: "All Item Groups",
      }, auth);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Item group:", msg.slice(0, 80));
    }
  }
  console.log("✅ Item groups\n");

  // ━━━ STEP 6: Service items ━━━
  console.log("Step 6: Service items...");
  const items: Array<{ item_code: string; item_name: string; description?: string }> = [
    { item_code: "SRV-LARGE-FORMAT", item_name: "Large Format Printing Service", description: "Large format printing — banners, posters, signage" },
    { item_code: "SRV-3D-PRINT", item_name: "3D Printing Service", description: "3D printing service — prototypes and parts" },
    { item_code: "SRV-DESIGN-PRINT", item_name: "Design & Print Service", description: "Full design and print service" },
  ];
  for (const it of items) {
    try {
      await post("/api/resource/Item", {
        item_code: it.item_code,
        item_name: it.item_name,
        item_group: "Services",
        is_stock_item: 0,
        include_item_in_manufacturing: 0,
        description: it.description ?? "",
      }, auth);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Item:", msg.slice(0, 80));
    }
  }
  console.log("✅ Service items created\n");

  // ━━━ STEP 7: Warehouse ━━━
  console.log("Step 7: Warehouse...");
  try {
    await post("/api/resource/Warehouse", {
      warehouse_name: "PrintHub Store",
      company: "PrintHub",
      warehouse_type: "Stores",
      is_group: 0,
    }, auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Warehouse:", msg.slice(0, 80));
  }
  console.log("✅ PrintHub Store warehouse\n");

  // ━━━ STEP 8: Territory (required for Customer) & Customer group ━━━
  console.log("Step 8: Territory & Customer group...");
  try {
    await post("/api/resource/Territory", { territory_name: "Kenya", parent_territory: "All Territories" }, auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Territory:", msg.slice(0, 80));
  }
  try {
    await post("/api/resource/Customer Group", {
      customer_group_name: "PrintHub Customers",
      parent_customer_group: "All Customer Groups",
    }, auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Customer group:", msg.slice(0, 80));
  }
  console.log("✅ PrintHub Customers\n");

  // ━━━ STEP 9: Payroll (Salary Components + Structure) ━━━
  console.log("Step 9: Payroll (Kenya)...");
  const components: Array<{ name: string; type: string; abbr: string; formula?: string; amount?: number }> = [
    { name: "Basic Salary", type: "Earning", abbr: "BS" },
    { name: "Housing Allowance", type: "Earning", abbr: "HA" },
    { name: "Transport Allowance", type: "Earning", abbr: "TA" },
    { name: "PAYE", type: "Deduction", abbr: "PAYE", formula: "base_taxable_earnings * 0.25" },
    { name: "NHIF", type: "Deduction", abbr: "NHIF", formula: "min(1700, gross * 0.025)" },
    { name: "NSSF Tier I", type: "Deduction", abbr: "NSSF1", amount: 360 },
    { name: "NSSF Tier II", type: "Deduction", abbr: "NSSF2", formula: "((gross - 6000) * 0.06) if gross > 6000 else 0" },
    { name: "Housing Levy", type: "Deduction", abbr: "HL", formula: "gross * 0.015" },
  ];
  for (const c of components) {
    try {
      await post("/api/resource/Salary Component", {
        salary_component: c.name,
        type: c.type,
        abbr: c.abbr,
        ...(c.formula && { formula: c.formula }),
        ...(c.amount != null && { amount: c.amount }),
      }, auth);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Salary component:", msg.slice(0, 80));
    }
  }
  try {
    await post("/api/resource/Salary Structure", {
      name: "PrintHub Default",
      company: "PrintHub",
      is_active: 1,
      payroll_frequency: "Monthly",
      earnings: [
        { salary_component: "Basic Salary", abbr: "BS" },
        { salary_component: "Housing Allowance", abbr: "HA" },
        { salary_component: "Transport Allowance", abbr: "TA" },
      ],
      deductions: [
        { salary_component: "PAYE", abbr: "PAYE" },
        { salary_component: "NHIF", abbr: "NHIF" },
        { salary_component: "NSSF Tier I", abbr: "NSSF1" },
        { salary_component: "NSSF Tier II", abbr: "NSSF2" },
        { salary_component: "Housing Levy", abbr: "HL" },
      ],
    }, auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Salary structure:", msg.slice(0, 80));
  }
  console.log("✅ Payroll structure\n");

  // ━━━ STEP 10: Leave types ━━━
  console.log("Step 10: Leave types...");
  const leaveTypes: Array<{ name: string; max_days_allowed: number; is_earned_leave?: number; is_carry_forward?: number }> = [
    { name: "Annual Leave", max_days_allowed: 21, is_earned_leave: 1 },
    { name: "Sick Leave", max_days_allowed: 14, is_carry_forward: 0 },
    { name: "Maternity Leave", max_days_allowed: 90 },
    { name: "Paternity Leave", max_days_allowed: 14 },
    { name: "Compassionate Leave", max_days_allowed: 3 },
    { name: "Study Leave", max_days_allowed: 5 },
  ];
  for (const lt of leaveTypes) {
    try {
      await post("/api/resource/Leave Type", lt, auth);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Leave type:", msg.slice(0, 80));
    }
  }
  console.log("✅ Leave types\n");

  // ━━━ STEP 11: Asset category ━━━
  console.log("Step 11: Asset category...");
  try {
    await post("/api/resource/Asset Category", {
      asset_category_name: "Printing Equipment",
      enable_cwip_accounting: 0,
      accounts: [{
        company_name: "PrintHub",
        fixed_asset_account: "Fixed Assets - PH",
        accumulated_depreciation_account: "Accumulated Depreciation - PH",
        depreciation_expense_account: "Depreciation - PH",
      }],
      finance_books: [{
        depreciation_method: "Straight Line",
        total_number_of_depreciations: 60,
        frequency_of_depreciation: 1,
        salvage_value_percentage: 10,
      }],
    }, auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("duplicate") && !msg.includes("already exists")) console.warn("  Asset category:", msg.slice(0, 80));
  }
  console.log("✅ Asset category\n");

  // ━━━ STEP 12: Verify (non-fatal) ━━━
  console.log("Step 12: Verification...");
  try {
    await get("/api/resource/Company/PrintHub", auth);
    console.log("  Company: OK");
  } catch (e) {
    console.warn("  Company: not found");
  }
  try {
    await get("/api/resource/Item/SRV-LARGE-FORMAT", auth);
    console.log("  Service item: OK");
  } catch (e) {
    console.warn("  Service item SRV-LARGE-FORMAT: not found (create in ERPNext UI if needed)");
  }
  try {
    const wh = (await get("/api/resource/Warehouse?filters=%5B%5B%22company%22%2C%22%3D%22%2C%22PrintHub%22%5D%5D", auth)) as { data?: unknown[] };
    if (wh.data?.length) console.log("  Warehouse: OK");
    else console.warn("  Warehouse: none for PrintHub");
  } catch (e) {
    console.warn("  Warehouse: check failed");
  }
  console.log("✅ Verification done\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ ERPNext setup complete for PrintHub!");
  console.log("   Company: PrintHub (KES)");
  console.log("   Accounts: configured");
  console.log("   Tax template: VAT 16% Kenya");
  console.log("   Service items: 3 created");
  console.log("   Warehouse: PrintHub Store");
  console.log("   Payroll: Kenya structure configured");
  console.log("   Leave types: 6 created");
  console.log("");
  console.log("Next step: npm run erpnext:migrate");
  console.log("  (migrates existing PrintHub data to ERPNext)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
