/**
 * PrintHub — Seed production data (real business settings, no placeholders)
 * Run: npx tsx prisma/scripts/seed-production.ts
 * Run AFTER clean-test-data.ts and only against your production DB when ready.
 */

import path from "node:path";
import { config } from "dotenv";

const root = path.resolve(__dirname, "../..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import { assertPrinthubDatabase } from "@/lib/db-guard";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function seedProduction() {
  await assertPrinthubDatabase(prisma);

  console.log("🌱 Seeding PrintHub production data...\n");

  const adminHash = await bcrypt.hash("ChangeMe2026!", 12);
  await prisma.user.upsert({
    where: { email: "admin@printhub.africa" },
    update: { passwordHash: adminHash },
    create: {
      name: "PrintHub Admin",
      email: "admin@printhub.africa",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("✓ Admin account ready: admin@printhub.africa");
  console.log("  ⚠ CHANGE THE PASSWORD IMMEDIATELY AFTER FIRST LOGIN\n");

  await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {
      businessName: "PrintHub",
      tradingName: "PrintHub (An Ezana Group Company)",
      tagline: "Professional Printing in Nairobi. Large Format, 3D Printing, Custom Branding.",
      primaryEmail: "hello@printhub.africa",
      supportEmail: "hello@printhub.africa",
      financeEmail: "finance@printhub.africa",
      primaryPhone: "+254 727 410 320",
      whatsapp: "254727410320",
      address1: "",
      address2: "",
      city: "Nairobi",
      county: "Nairobi County",
      country: "Kenya",
      hoursWeekdays: "Monday – Friday: 8:00am – 6:00pm",
      hoursSaturday: "Saturday: 9:00am – 3:00pm",
      hoursSunday: "Sunday: Closed",
      hoursHolidays: "Public holidays: Closed",
      googleMapsUrl: "",
      website: "https://printhub.africa",
      socialFacebook: "https://facebook.com/printhub.africa",
      socialInstagram: "https://instagram.com/printhub.africa",
      invoicePrefix: "PHUB",
      vatOnInvoices: true,
    },
    create: {
      id: "default",
      businessName: "PrintHub",
      primaryEmail: "hello@printhub.africa",
      supportEmail: "hello@printhub.africa",
      financeEmail: "finance@printhub.africa",
      primaryPhone: "+254 727 410 320",
      whatsapp: "254727410320",
      city: "Nairobi",
      county: "Nairobi County",
      country: "Kenya",
      hoursWeekdays: "Monday – Friday: 8:00am – 6:00pm",
      hoursSaturday: "Saturday: 9:00am – 3:00pm",
      hoursSunday: "Sunday: Closed",
      vatOnInvoices: true,
      invoicePrefix: "PHUB",
    },
  });
  console.log("✓ Business settings seeded\n");

  const departments = [
    { name: "Management", colour: "#0A0A0A", sortOrder: 1 },
    { name: "Production", colour: "#CC3D00", sortOrder: 2 },
    { name: "Design", colour: "#7C3AED", sortOrder: 3 },
    { name: "Sales", colour: "#059669", sortOrder: 4 },
    { name: "Delivery", colour: "#2563EB", sortOrder: 5 },
    { name: "Finance", colour: "#D97706", sortOrder: 6 },
    { name: "Customer Support", colour: "#DB2777", sortOrder: 7 },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: { ...dept, description: null },
    }).catch(() => {});
  }
  console.log("✓ Departments seeded\n");

  const zones = [
    { name: "Nairobi", counties: "Nairobi", feeKes: 200, minDays: 1, maxDays: 1, sortOrder: 1 },
    { name: "Central", counties: "Kiambu,Murang'a,Nyeri,Kirinyaga,Nyandarua", feeKes: 400, minDays: 2, maxDays: 2, sortOrder: 2 },
    { name: "Coast", counties: "Mombasa,Kilifi,Kwale,Taita Taveta", feeKes: 600, minDays: 3, maxDays: 4, sortOrder: 3 },
    { name: "Western", counties: "Kisumu,Kakamega,Vihiga,Bungoma,Busia", feeKes: 600, minDays: 3, maxDays: 4, sortOrder: 4 },
    { name: "Rift Valley", counties: "Nakuru,Uasin Gishu,Kericho,Nandi", feeKes: 500, minDays: 2, maxDays: 3, sortOrder: 5 },
    { name: "Eastern", counties: "Machakos,Makueni,Kitui,Embu,Meru", feeKes: 550, minDays: 2, maxDays: 3, sortOrder: 6 },
    { name: "North Eastern", counties: "Garissa,Wajir,Mandera,Marsabit,Isiolo", feeKes: 800, minDays: 5, maxDays: 7, sortOrder: 7 },
    { name: "Pickup", counties: "Nairobi", feeKes: 0, minDays: 0, maxDays: 0, sortOrder: 8 },
  ];
  for (const zone of zones) {
    const existing = await prisma.deliveryZone.findFirst({ where: { name: zone.name } });
    if (existing) {
      await prisma.deliveryZone.update({
        where: { id: existing.id },
        data: { feeKes: zone.feeKes, minDays: zone.minDays, maxDays: zone.maxDays, counties: zone.counties },
      });
    } else {
      await prisma.deliveryZone.create({
        data: { ...zone, isActive: true },
      });
    }
  }
  console.log("✓ Delivery zones seeded\n");

  console.log("ℹ Run legal pages seed separately if needed:");
  console.log("  npx tsx prisma/seeds/legal-pages.ts\n");

  console.log("✅ Production seed complete.\n");
  console.log("🔔 CHECKLIST — fill in these in Admin → Settings → Business:");
  console.log("   □ address1, address2 (physical address)");
  console.log("   □ googleMapsUrl (embed or share URL)");
  console.log("   □ KRA PIN / VAT (in invoice footer or settings if applicable)");
  console.log("   □ Upload logo in Settings → Business Profile");
  console.log("   □ Change admin password immediately after first login");
}

seedProduction()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
