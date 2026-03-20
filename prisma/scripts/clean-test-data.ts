/**
 * Clean test/dummy data and keep only super admin. Then seed: business costs, legal pages, FAQs, email templates.
 * Run: npx tsx prisma/scripts/clean-test-data.ts
 * Uses DATABASE_URL from .env or .env.local.
 */

import path from "node:path";
import { config } from "dotenv";
import { execSync } from "node:child_process";

const root = path.resolve(__dirname, "../..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
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

const SUPER_ADMIN_EMAIL = "admin@printhub.africa";

async function getSuperAdminId(): Promise<string> {
  const admin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true },
  });
  if (!admin) {
    throw new Error(
      `Super admin user "${SUPER_ADMIN_EMAIL}" not found. Create it first (e.g. run db:seed once or seed-production).`
    );
  }
  return admin.id;
}

async function clean() {
  const adminId = await getSuperAdminId();
  console.log("Keeping super admin:", SUPER_ADMIN_EMAIL);

  // ---- Delete in dependency order (children before parents) ----

  // Order-related (children first)
  await prisma.orderItem.deleteMany();
  await prisma.orderTimeline.deleteMany();
  await prisma.orderTrackingEvent.deleteMany();
  await prisma.shippingAddress.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.order.deleteMany();

  // Quote-related
  await prisma.quoteCancellation.deleteMany();
  await prisma.quotePdf.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.printQuote.deleteMany();

  // Cart, wishlist, coupons
  await prisma.cart.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();

  // Product-related
  await prisma.productionQueue.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Support
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();

  // Careers (test job listings)
  await prisma.jobApplication.deleteMany();
  await prisma.jobListing.deleteMany();

  // Newsletter, verification tokens
  await prisma.newsletter.deleteMany();
  await prisma.verificationToken.deleteMany();

  // Corporate
  await prisma.corporateInvite.deleteMany();
  await prisma.corporateNote.deleteMany();
  await prisma.corporateTeamMember.deleteMany();
  await prisma.corporateBrandAsset.deleteMany();
  await prisma.corporatePO.deleteMany();
  await prisma.corporateInvoice.deleteMany();
  await prisma.corporateApplication.deleteMany();
  await prisma.bulkQuote.deleteMany();
  await prisma.corporateAccount.deleteMany();

  // Delivery, inventory, etc.
  await prisma.delivery.deleteMany();
  await prisma.shopInventoryMovement.deleteMany();
  await prisma.shopPurchaseOrderLine.deleteMany();
  await prisma.shopPurchaseOrder.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.threeDConsumableMovement.deleteMany();
  await prisma.maintenancePartUsed.deleteMany();
  await prisma.maintenanceLog.deleteMany();

  // Uploads, catalogue
  await prisma.catalogueItemPhoto.deleteMany();
  await prisma.catalogueItemMaterial.deleteMany();
  await prisma.catalogueItem.deleteMany();
  await prisma.catalogueDesigner.deleteMany();
  await prisma.category.deleteMany();
  await prisma.uploadedFile.deleteMany();

  // Notifications, loyalty, referral, addresses (for non-admin we delete all then re-create nothing)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.savedAddress.deleteMany();
  await prisma.savedMpesaNumber.deleteMany();
  await prisma.savedCard.deleteMany();
  await prisma.mpesaTransaction.deleteMany();
  await prisma.userNotificationPrefs.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.address.deleteMany();

  // Staff (delete all; super admin may have Staff record – we keep user only)
  await prisma.staff.deleteMany();

  // Sessions and accounts (delete all; super admin will need to log in again)
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();

  // Remove all users except super admin
  await prisma.user.deleteMany({
    where: { id: { not: adminId } },
  });

  // Clear content we will re-seed
  await prisma.legalPageHistory.deleteMany();
  await prisma.legalPage.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.faqCategory.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.lFBusinessSettings.deleteMany();
  // Optionally reset LF printer defaults so calculator has baseline (create if missing later)
  // prisma.lFPrinterSettings.deleteMany(); // uncomment to reset printer defaults too

  // Reset invoice/quote PDF counters so numbers start clean
  await prisma.counter.updateMany({ where: { id: { in: ["invoice", "quote_pdf"] } }, data: { value: 0 } }).catch(() => {});

  console.log("Clean complete. Only super admin user remains.");
}

async function seedBusinessCosts() {
  // LF business settings (Finance → Business costs)
  const existing = await prisma.lFBusinessSettings.findFirst();
  if (!existing) {
    await prisma.lFBusinessSettings.create({
      data: {
        labourRateKesPerHour: 200,
        finishingTimeEyeletStd: 0.1,
        finishingTimeEyeletHeavy: 0.2,
        finishingTimeHemAll4: 0.25,
        finishingTimeHemTop2: 0.15,
        finishingTimePole: 0.2,
        finishingTimeRope: 0.1,
        monthlyRentKes: 35_000,
        monthlyUtilitiesKes: 8_000,
        monthlyInsuranceKes: 4_000,
        monthlyOtherKes: 3_000,
        workingDaysPerMonth: 26,
        workingHoursPerDay: 8,
        wastageBufferPercent: 3,
        substrateWasteFactor: 1.05,
        rigidSheetWasteFactor: 1.1,
        defaultProfitMarginPct: 40,
        vatRatePct: 16,
        minOrderValueKes: 500,
      },
    });
    console.log("  ✓ Business costs (LF) seeded");
  } else {
    console.log("  ✓ Business costs already present (skipped create)");
  }

  // Default LF printer (so calculator has a baseline)
  const defaultPrinter = await prisma.lFPrinterSettings.findFirst({ where: { isDefault: true } });
  if (!defaultPrinter) {
    await prisma.lFPrinterSettings.create({
      data: {
        name: "Roland VG3-540",
        model: "VG3-540",
        isActive: true,
        isDefault: true,
        maxPrintWidthM: 1.52,
        printSpeedSqmPerHour: 15,
        printSpeedHighQualSqmHr: 8,
        setupTimeHours: 0.25,
        purchasePriceKes: 1_200_000,
        lifespanHours: 20_000,
        annualMaintenanceKes: 120_000,
        powerWatts: 600,
        electricityRateKesKwh: 24,
        inkChannelSettings: {
          C: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
          M: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
          Y: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
          K: { bottleMl: 220, costKes: 2200, sqmPerBottle: 15 },
        },
      },
    });
    console.log("  ✓ Default LF printer settings seeded");
  }
}

async function seedFaqs() {
  const faqCategories = [
    { name: "Ordering & Quotes", slug: "ordering", icon: "ShoppingCart", sortOrder: 1 },
    { name: "Payments", slug: "payments", icon: "CreditCard", sortOrder: 2 },
    { name: "Files & Designs", slug: "files", icon: "FileUp", sortOrder: 3 },
    { name: "Production", slug: "production", icon: "Printer", sortOrder: 4 },
    { name: "Delivery", slug: "delivery", icon: "Truck", sortOrder: 5 },
    { name: "Returns & Refunds", slug: "refunds", icon: "RotateCcw", sortOrder: 6 },
    { name: "3D Printing", slug: "3d", icon: "Box", sortOrder: 7 },
    { name: "Large Format", slug: "lf", icon: "Maximize", sortOrder: 8 },
    { name: "Corporate Accounts", slug: "corporate", icon: "Building2", sortOrder: 9 },
  ];
  for (const cat of faqCategories) {
    await prisma.faqCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
  }
  const orderingCat = await prisma.faqCategory.findUnique({ where: { slug: "ordering" } });
  const paymentsCat = await prisma.faqCategory.findUnique({ where: { slug: "payments" } });
  const filesCat = await prisma.faqCategory.findUnique({ where: { slug: "files" } });
  const deliveryCat = await prisma.faqCategory.findUnique({ where: { slug: "delivery" } });
  const refundsCat = await prisma.faqCategory.findUnique({ where: { slug: "refunds" } });
  const threeDCat = await prisma.faqCategory.findUnique({ where: { slug: "3d" } });
  const lfCat = await prisma.faqCategory.findUnique({ where: { slug: "lf" } });
  const corporateCat = await prisma.faqCategory.findUnique({ where: { slug: "corporate" } });

  const faqs: { categoryId: string; question: string; answer: string; isPopular: boolean; sortOrder: number }[] = [];
  if (orderingCat) {
    faqs.push(
      { categoryId: orderingCat.id, question: "How do I get a quote for large format printing?", answer: '<p>You can get an instant estimate using our <a href="/quote">online quote calculator</a>. Select your material, enter dimensions, quantity and finishing options — you\'ll see a price range immediately. For complex or large jobs, upload your file and our team will confirm the final price within 2 business hours.</p>', isPopular: true, sortOrder: 1 },
      { categoryId: orderingCat.id, question: "How long does it take to get my order?", answer: "<p>Standard turnaround is <strong>2–5 business days</strong> from file approval and payment. Express 24-hour service is available for most items at an additional charge.</p><p>Delivery adds 1–2 days for Nairobi, 2–5 days for other counties.</p>", isPopular: true, sortOrder: 2 },
      { categoryId: orderingCat.id, question: "Can I order in small quantities?", answer: "<p>Yes — our minimum order value is KES 500. There is no minimum quantity for custom prints. We print from 1 piece upwards, though larger quantities reduce your cost per unit.</p>", isPopular: false, sortOrder: 3 },
      { categoryId: orderingCat.id, question: "Do you offer design services?", answer: "<p>Yes. Our design team can create or adapt artwork for your print job. Design fees start from KES 1,500 and are quoted based on complexity. Contact us with your brief for a design quote.</p>", isPopular: false, sortOrder: 4 },
    );
  }
  if (paymentsCat) {
    faqs.push(
      { categoryId: paymentsCat.id, question: "How do I pay?", answer: "<p>We accept:</p><ul><li><strong>M-Pesa</strong> — our Paybill number is shown at checkout</li><li><strong>Visa / Mastercard</strong> — via Pesapal (secure online payment)</li><li><strong>Bank transfer</strong> — for orders above KES 10,000</li></ul><p>Payment is required before production begins.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: paymentsCat.id, question: "Do you offer credit or payment plans?", answer: '<p>Corporate clients with approved accounts can access NET-30 payment terms. <a href="/account/settings/corporate">Apply for a corporate account</a> — approval takes 2 business days.</p><p>We do not currently offer payment plans for individual customers.</p>', isPopular: false, sortOrder: 2 },
      { categoryId: paymentsCat.id, question: "Will I get a VAT invoice?", answer: "<p>Yes. A VAT invoice (16% Kenya VAT) is generated automatically for every order and sent to your email. You can also download invoices from your account at any time. Corporate clients requiring invoices with KRA PIN should ensure their PIN is added to their account profile.</p>", isPopular: false, sortOrder: 3 },
    );
  }
  if (filesCat) {
    faqs.push(
      { categoryId: filesCat.id, question: "What file formats do you accept?", answer: "<p><strong>For large format printing:</strong> AI, PDF (print-ready), PSD, PNG or JPG at 300dpi minimum. Vector files (AI, PDF) are preferred for sharp results.</p><p><strong>For 3D printing:</strong> STL, OBJ, FBX, STEP, 3MF.</p><p>Maximum file size: 500MB per file.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: filesCat.id, question: "My file has low resolution — can you still print it?", answer: "<p>We can print low-resolution files but quality may be affected — particularly for close-up viewing. We review all files before printing and will contact you if we have concerns. For large format prints viewed from a distance, lower resolution is often acceptable.</p>", isPopular: false, sortOrder: 2 },
      { categoryId: filesCat.id, question: "How do I set up my file for printing?", answer: "<p>For best results:</p><ul><li>Set document to actual print size (or scale 1:10 for very large prints)</li><li>Use CMYK colour mode (not RGB)</li><li>Add 3mm bleed on all sides</li><li>Keep text and important elements 5mm from the edge</li><li>Embed or outline all fonts</li><li>Export as print-ready PDF (PDF/X-4 preferred)</li></ul><p>We'll review your file and let you know if anything needs adjustment.</p>", isPopular: false, sortOrder: 3 },
    );
  }
  if (deliveryCat) {
    faqs.push(
      { categoryId: deliveryCat.id, question: "Do you deliver to my county?", answer: "<p>Yes — we deliver to all 47 counties in Kenya. Delivery fees and estimated times vary by location and are calculated at checkout.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: deliveryCat.id, question: "Can I collect my order?", answer: "<p>Yes. Click & Collect is free from our Nairobi location. Select \"Collection\" at checkout. We'll SMS and email you when your order is ready. Collection is available Mon–Fri 8am–6pm, Saturday 9am–3pm.</p>", isPopular: false, sortOrder: 2 },
      { categoryId: deliveryCat.id, question: "How do I track my order?", answer: '<p>Once your order is shipped, you\'ll receive an SMS and email with a tracking link. You can also track at any time at <a href="/track">printhub.africa/track</a> using your order number.</p>', isPopular: true, sortOrder: 3 },
    );
  }
  if (refundsCat) {
    faqs.push(
      { categoryId: refundsCat.id, question: "What if my order is wrong or damaged?", answer: "<p>Contact us within <strong>48 hours of delivery</strong> at support@printhub.africa with photos of the issue and your order number. We'll assess and either reprint or refund — typically resolved within 5 business days.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: refundsCat.id, question: "Can I cancel my order?", answer: "<p>You can cancel before production starts for a full refund (less payment processing fees). Once production has started, a 50% refund applies. Once complete, we cannot cancel. Contact us immediately at support@printhub.africa if you need to cancel.</p>", isPopular: false, sortOrder: 2 },
    );
  }
  if (threeDCat) {
    faqs.push(
      { categoryId: threeDCat.id, question: "What materials can you 3D print in?", answer: "<p>We currently offer: PLA+, PETG, ABS, TPU (flexible), and Standard Resin. Each has different properties — PLA+ is great for general use, PETG is more durable, ABS is heat-resistant, TPU is flexible. Contact us if you need a specific material not listed.</p>", isPopular: true, sortOrder: 1 },
      { categoryId: threeDCat.id, question: "How do I know how much my 3D print will cost?", answer: '<p>Use our <a href="/quote">3D print quote calculator</a>. Enter your estimated weight (grams) and print time (hours) for an instant estimate. Upload your STL file and we\'ll calculate weight and time automatically. Final price is confirmed after our team reviews your file.</p>', isPopular: true, sortOrder: 2 },
      { categoryId: threeDCat.id, question: "What is the maximum build size?", answer: "<p>Our FDM printer (Bambu Lab X1C) has a build volume of 256×256×256mm. For larger objects, we can print in sections and assemble. Contact us to discuss large prints.</p>", isPopular: false, sortOrder: 3 },
    );
  }
  if (lfCat) {
    faqs.push(
      { categoryId: lfCat.id, question: "What is the maximum width you can print?", answer: "<p>Our large format printer handles up to 1.52 metres wide. Length is virtually unlimited (roll-fed). For widths above 1.52m, we can print in panels and join seamlessly.</p>", isPopular: false, sortOrder: 1 },
      { categoryId: lfCat.id, question: "Do you do vehicle wraps?", answer: "<p>Yes. We print full and partial vehicle wraps using premium cast vinyl. Bring your vehicle to our Nairobi location for installation. Contact us for a vehicle wrap quote — we'll need photos and your vehicle make/model.</p>", isPopular: true, sortOrder: 2 },
    );
  }
  if (corporateCat) {
    faqs.push(
      { categoryId: corporateCat.id, question: "How do I apply for a corporate account?", answer: '<p>Go to <a href="/account/settings/corporate">Account → Corporate Account</a> and submit your company details and KRA PIN. We review applications within 2 business days. Approved accounts get NET-30 payment terms.</p>', isPopular: true, sortOrder: 1 },
    );
  }

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({
      where: { categoryId: faq.categoryId, question: faq.question },
    });
    if (!existing) {
      await prisma.faq.create({
        data: { ...faq, isActive: true },
      });
    }
  }
  console.log("  ✓ FAQ categories and FAQs seeded");
}

async function main() {
  await assertPrinthubDatabase(prisma);

  console.log("Clean test data (keep super admin only), then seed business costs, legal, FAQs, email templates...\n");

  await clean();

  console.log("\nSeeding...");
  await seedBusinessCosts();
  await seedFaqs();

  // Legal pages and email templates run as separate scripts (they use their own Prisma and legal-content)
  console.log("  Running legal-pages seed...");
  execSync("npx tsx prisma/seeds/legal-pages.ts", { cwd: root, stdio: "inherit" });
  console.log("  Running email-templates seed...");
  execSync("npx tsx prisma/seeds/email-templates.ts", { cwd: root, stdio: "inherit" });

  console.log("\n✅ Done. Super admin retained; business costs, legal pages, FAQs, and email templates seeded.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
