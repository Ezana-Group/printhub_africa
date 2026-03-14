/**
 * PrintHub — Clean all test/dummy data before production launch
 * Run: npx tsx prisma/scripts/clean-test-data.ts
 * ⚠ ONLY RUN ONCE — BEFORE LAUNCH — IRREVERSIBLE
 *
 * Requires: DATABASE_URL in .env or .env.local (use production DB only when ready)
 */

import path from "node:path";
import { config } from "dotenv";

const root = path.resolve(__dirname, "../..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or .env.local.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

const TEST_EMAILS = [
  "test@test.com",
  "customer@test.com",
  "testcustomer@gmail.com",
  "corporate@printhub.africa",
  "moses@test.com",
];

async function cleanTestData() {
  console.log("🧹 Cleaning test data from PrintHub database...");
  console.log("⚠  This is irreversible. Are you on the PRODUCTION database?");
  console.log("   DATABASE_URL starts with:", process.env.DATABASE_URL?.substring(0, 50) + "...");
  console.log("");
  console.log("   Abort with Ctrl+C in the next 5 seconds if this is the wrong database.");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("Proceeding...\n");

  // Delete in dependency order (FKs without cascade)

  const deletedInvoices = await prisma.invoice.deleteMany({});
  console.log(`✓ Deleted ${deletedInvoices.count} invoices`);

  const deletedMpesaTx = await prisma.mpesaTransaction.deleteMany({});
  console.log(`✓ Deleted ${deletedMpesaTx.count} M-Pesa transactions`);

  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`✓ Deleted ${deletedPayments.count} payments`);

  const deletedRefunds = await prisma.refund.deleteMany({});
  console.log(`✓ Deleted ${deletedRefunds.count} refunds`);

  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${deletedOrders.count} orders`);

  const deletedQuoteRecords = await prisma.quote.deleteMany({});
  console.log(`✓ Deleted ${deletedQuoteRecords.count} quote records (Get a Quote)`);

  const deletedQuotes = await prisma.printQuote.deleteMany({});
  console.log(`✓ Deleted ${deletedQuotes.count} print quotes`);

  const deletedFiles = await prisma.uploadedFile.deleteMany({});
  console.log(`✓ Deleted ${deletedFiles.count} uploaded files`);

  // Corporate: delete in dependency order (CorporateAccount references User via primaryUserId)
  const deletedCorpInvoices = await prisma.corporateInvoice.deleteMany({});
  console.log(`✓ Deleted ${deletedCorpInvoices.count} corporate invoices`);
  const deletedCorpPOs = await prisma.corporatePO.deleteMany({});
  console.log(`✓ Deleted ${deletedCorpPOs.count} corporate POs`);
  const deletedBulkQuotes = await prisma.bulkQuote.deleteMany({});
  console.log(`✓ Deleted ${deletedBulkQuotes.count} bulk quotes`);
  const deletedCorpInvites = await prisma.corporateInvite.deleteMany({});
  console.log(`✓ Deleted ${deletedCorpInvites.count} corporate invites`);
  const deletedCorpApps = await prisma.corporateApplication.deleteMany({});
  console.log(`✓ Deleted ${deletedCorpApps.count} corporate applications`);
  const deletedCorpAccounts = await prisma.corporateAccount.deleteMany({});
  console.log(`✓ Deleted ${deletedCorpAccounts.count} corporate accounts`);

  const deletedCustomers = await prisma.user.deleteMany({
    where: {
      role: "CUSTOMER",
      email: { in: TEST_EMAILS },
    },
  });
  console.log(`✓ Deleted ${deletedCustomers.count} test customer accounts`);

  const deletedTickets = await prisma.supportTicket.deleteMany({}).catch(() => ({ count: 0 }));
  console.log(`✓ Deleted ${deletedTickets.count} support tickets`);

  const deletedReviews = await prisma.productReview.deleteMany({}).catch(() => ({ count: 0 }));
  console.log(`✓ Deleted ${deletedReviews.count} product reviews`);

  const deletedCatalogue = await prisma.catalogueItem.deleteMany({
    where: {
      OR: [
        { name: { contains: "Test", mode: "insensitive" } },
        { name: { contains: "Sample", mode: "insensitive" } },
        { name: { contains: "Dummy", mode: "insensitive" } },
      ],
    },
  });
  console.log(`✓ Deleted ${deletedCatalogue.count} test catalogue items`);

  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [
        { name: { contains: "Test", mode: "insensitive" } },
        { name: { contains: "Sample", mode: "insensitive" } },
        { name: { contains: "Dummy", mode: "insensitive" } },
        { name: { contains: "Lorem", mode: "insensitive" } },
      ],
    },
  });
  console.log(`✓ Deleted ${deletedProducts.count} test products`);

  await prisma.counter.upsert({
    where: { id: "invoice" },
    update: { value: 0, updatedAt: new Date() },
    create: { id: "invoice", value: 0, updatedAt: new Date() },
  }).catch(() => {});
  console.log("✓ Invoice counter reset to 0");

  await prisma.counter.upsert({
    where: { id: "quote_pdf" },
    update: { value: 0, updatedAt: new Date() },
    create: { id: "quote_pdf", value: 0, updatedAt: new Date() },
  }).catch(() => {});
  console.log("✓ Quote PDF counter reset to 0");

  console.log("");
  console.log("✅ Test data cleaned. Database is ready for production.");
  console.log("   Next step: run npx tsx prisma/scripts/seed-production.ts");
}

cleanTestData()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
