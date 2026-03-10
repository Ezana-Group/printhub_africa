/**
 * Migrate existing PrintHub data (customers, staff, consumables) to ERPNext.
 * Run: npm run erpnext:migrate
 * Safe to run multiple times (creates or updates).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.ERPNEXT_URL ?? "http://localhost:8080";
const API_KEY = process.env.ERPNEXT_API_KEY ?? "";
const API_SECRET = process.env.ERPNEXT_API_SECRET ?? "";

const prisma = new PrismaClient();

function authHeader(): Record<string, string> {
  if (!API_KEY || !API_SECRET) throw new Error("ERPNEXT_API_KEY and ERPNEXT_API_SECRET must be set in .env");
  return { Authorization: `token ${API_KEY}:${API_SECRET}` };
}

async function erpList(doctype: string, filters: string): Promise<{ data?: Array<{ name: string }> }> {
  const res = await fetch(
    `${BASE}/api/resource/${doctype}?filters=${encodeURIComponent(filters)}`,
    { headers: authHeader() }
  );
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function erpCreate(doctype: string, data: object): Promise<{ data?: { name: string } }> {
  const res = await fetch(`${BASE}/api/resource/${doctype}`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function erpPatch(doctype: string, name: string, data: object): Promise<unknown> {
  const res = await fetch(`${BASE}/api/resource/${doctype}/${encodeURIComponent(name)}`, {
    method: "PATCH",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function main(): Promise<void> {
  console.log("PrintHub → ERPNext migration\n");

  // ━━━ Customers (User with role CUSTOMER) → ERPNext Customer ━━━
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, email: true, phone: true },
  });
  console.log(`Customers to sync: ${customers.length}`);
  let created = 0;
  let updated = 0;
  for (const u of customers) {
    const customerName = u.name || u.email;
    try {
      const existing = await erpList("Customer", `[["customer_name","=","${customerName.replace(/"/g, '\\"')}"]]`);
      const payload = {
        customer_name: customerName,
        customer_group: "PrintHub Customers",
        territory: "Kenya",
        customer_type: "Company",
        email_id: u.email,
        mobile_no: u.phone ?? undefined,
      };
      if (existing.data?.length) {
        await erpPatch("Customer", existing.data[0].name, payload);
        updated++;
      } else {
        await erpCreate("Customer", payload);
        created++;
      }
    } catch (e) {
      console.warn(`  Skip customer ${customerName}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`  ✅ Customers: ${created} created, ${updated} updated\n`);

  // ━━━ Staff (Staff + User) → ERPNext Employee ━━━
  const staffList = await prisma.staff.findMany({
    include: { user: { select: { name: true, email: true } } },
  });
  console.log(`Staff to sync: ${staffList.length}`);
  for (const s of staffList) {
    try {
      const existing = await erpList("Employee", `[["user_id","=","${s.user.email}"]]`);
      const payload = {
        employee_name: s.user.name || s.user.email,
        company: "PrintHub",
        department: s.department ?? undefined,
        designation: s.position ?? undefined,
        user_id: s.user.email,
      };
      if (existing.data?.length) {
        await erpPatch("Employee", existing.data[0].name, payload);
      } else {
        await erpCreate("Employee", payload);
      }
    } catch (e) {
      console.warn(`  Skip staff ${s.user.email}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`  ✅ Staff synced\n`);

  // ━━━ 3D Consumables (filaments) → ERPNext Item ━━━
  const consumables = await prisma.threeDConsumable.findMany({
    where: { kind: "FILAMENT" },
  });
  console.log(`Filaments to sync: ${consumables.length}`);
  for (const c of consumables) {
    const itemCode = `FIL-${c.name.toUpperCase().replace(/\s+/g, "-").slice(0, 20)}`;
    try {
      const existing = await erpList("Item", `[["item_code","=","${itemCode}"]]`);
      const payload = {
        item_code: itemCode,
        item_name: c.name,
        item_group: "3D Printing Consumables",
        is_stock_item: 1,
        description: c.specification ?? undefined,
        standard_rate: c.costPerKgKes ?? 0,
        valuation_rate: c.costPerKgKes ?? 0,
        stock_uom: "Kg",
      };
      if (existing.data?.length) {
        await erpPatch("Item", existing.data[0].name, payload);
      } else {
        await erpCreate("Item", payload);
      }
    } catch (e) {
      console.warn(`  Skip filament ${c.name}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`  ✅ Filaments synced\n`);

  console.log("Migration complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
