/**
 * One-time backfill: set closedBy = 'CUSTOMER' on quotes that were
 * withdrawn or declined by the customer before the closedBy field existed.
 *
 * Run after deploying the add_quote_closed_by migration:
 *   npx tsx scripts/backfill-quote-closed-by.ts
 *
 * Requires DATABASE_URL in .env or .env.local.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env or .env.local.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const CUSTOMER_CLOSED_PHRASES = [
  "withdrawn by customer",
  "declined by customer",
  "customer declined",
  "customer withdrew",
];

async function backfill() {
  const quotes = await prisma.quote.findMany({
    where: {
      status: { in: ["rejected", "cancelled"] },
      closedBy: null,
    },
    select: { id: true, rejectionReason: true, cancelledAt: true, cancelledBy: true, cancellationReason: true },
  });

  let backfilled = 0;

  for (const quote of quotes) {
    const reason = (quote.rejectionReason ?? quote.cancellationReason ?? "").toLowerCase();
    const isCustomerClose =
      quote.cancelledBy === "customer" ||
      CUSTOMER_CLOSED_PHRASES.some((phrase) => reason.includes(phrase));

    if (isCustomerClose) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          closedBy: "CUSTOMER",
          closedAt: quote.cancelledAt ?? new Date(),
          closedReason: quote.rejectionReason ?? "Closed by customer",
        },
      });
      backfilled++;
    }
  }

  console.log(`Backfilled ${backfilled} customer-closed quotes (of ${quotes.length} rejected/cancelled without closedBy).`);
}

backfill()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
