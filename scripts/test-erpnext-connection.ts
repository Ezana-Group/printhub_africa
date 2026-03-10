/**
 * Test ERPNext connection and PrintHub configuration.
 * Run: npm run erpnext:test
 */

import "dotenv/config";

const BASE = process.env.ERPNEXT_URL ?? "http://localhost:8080";
const API_KEY = process.env.ERPNEXT_API_KEY ?? "";
const API_SECRET = process.env.ERPNEXT_API_SECRET ?? "";

function authHeader(): Record<string, string> {
  if (!API_KEY || !API_SECRET) throw new Error("ERPNEXT_API_KEY and ERPNEXT_API_SECRET must be set in .env");
  return { Authorization: `token ${API_KEY}:${API_SECRET}` };
}

async function erpGet(doctype: string, name: string): Promise<unknown> {
  const res = await fetch(
    `${BASE}/api/resource/${doctype}/${encodeURIComponent(name)}`,
    { headers: authHeader() }
  );
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function erpList(
  doctype: string,
  opts: { filters?: string } = {}
): Promise<{ data?: unknown[] }> {
  const q = new URLSearchParams();
  if (opts.filters) q.set("filters", opts.filters);
  const url = `${BASE}/api/resource/${doctype}${opts.filters ? "?filters=" + encodeURIComponent(opts.filters) : ""}`;
  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function erpCreate(doctype: string, data: object): Promise<unknown> {
  const res = await fetch(`${BASE}/api/resource/${doctype}`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function erpDelete(doctype: string, name: string): Promise<void> {
  const res = await fetch(`${BASE}/api/resource/${doctype}/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
}

async function testConnection(): Promise<void> {
  console.log("Testing ERPNext connection...\n");

  const tests: Array<{ name: string; optional?: boolean; run: () => Promise<unknown> }> = [
    { name: "ERPNext is reachable", run: () => fetch(`${BASE}/api/method/ping`).then((r) => (r.ok ? undefined : Promise.reject(new Error(String(r.status))))) },
    {
      name: "API authentication works",
      run: async () => {
        const r = await fetch(`${BASE}/api/method/frappe.auth.get_logged_user`, { headers: authHeader() });
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      },
    },
    { name: "Company exists", run: () => erpGet("Company", "PrintHub") },
    { name: "Service items exist", optional: true, run: () => erpGet("Item", "SRV-LARGE-FORMAT") },
    { name: "Warehouse exists", run: () => erpList("Warehouse", { filters: '[["company","=","PrintHub"]]' }) },
    { name: "VAT tax template exists", run: () => erpList("Sales Taxes and Charges Template", { filters: '[["title","=","Kenya VAT 16%"]]' }) },
    {
      name: "Can create test customer",
      optional: true,
      run: () =>
        erpCreate("Customer", {
          customer_name: "Test Customer DELETE ME",
          customer_group: "PrintHub Customers",
          territory: "Kenya",
        }),
    },
  ];

  let passed = 0;
  let failed = 0;
  let optionalFailed = 0;

  for (const { name, optional, run } of tests) {
    try {
      await run();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      if (optional) {
        console.log(`  ⚠️ ${name} (optional)`);
        console.log(`     ${error instanceof Error ? error.message : String(error)}`.slice(0, 120) + "...");
        optionalFailed++;
      } else {
        console.log(`  ❌ ${name}`);
        console.log(`     Error: ${error instanceof Error ? error.message : String(error)}`);
        failed++;
      }
    }
  }

  // Clean up test customer
  try {
    const customers = (await erpList("Customer", {
      filters: '[["customer_name","=","Test Customer DELETE ME"]]',
    })) as { data?: Array<{ name: string }> };
    if (customers.data?.length) {
      await erpDelete("Customer", customers.data[0].name);
    }
  } catch {
    // ignore
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Results: ${passed} passed, ${failed} failed${optionalFailed ? `, ${optionalFailed} optional skipped` : ""}`);

  if (failed === 0) {
    console.log("✅ ERPNext is ready for PrintHub integration.");
    if (optionalFailed > 0) {
      console.log("   Create Service items and Customer Group in ERPNext UI if you need them.");
    }
  } else {
    console.log("❌ Core tests failed. Run: npm run erpnext:setup");
  }
}

testConnection().catch((err) => {
  console.error(err);
  process.exit(1);
});
