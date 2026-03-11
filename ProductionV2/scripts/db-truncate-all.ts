/**
 * Truncate all tables in the public schema (wipe data, keep schema).
 * Use for production only with explicit DATABASE_URL. Backup first.
 *
 * Run: DATABASE_URL="postgresql://..." npx tsx scripts/db-truncate-all.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Set it to the target database (e.g. production).");
  process.exit(1);
}

// Use raw SQL via Prisma's $executeRawUnsafe to run TRUNCATE
async function main() {
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  // Get all table names in public schema (PostgreSQL), except Prisma's migration table
  const tables = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations' ORDER BY tablename`
  );
  const tableList = tables.map((t) => `"${t.tablename}"`).join(", ");
  if (!tableList) {
    console.log("No tables found in public schema. Nothing to truncate.");
    await prisma.$disconnect();
    return;
  }

  console.log("Truncating tables:", tables.map((t) => t.tablename).join(", "));
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
  console.log("Done. All data in public schema has been removed.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
