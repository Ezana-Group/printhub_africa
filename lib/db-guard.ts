/**
 * Database guard: ensures seed/clean scripts only run against the PrintHub database.
 * Prevents accidentally seeding or cleaning another project's DB when you have multiple
 * similar projects. Requires PRINTHUB_SEED_ALLOW=1 and DatabaseGuard.project = printhub_africa.
 */

import type { PrismaClient } from "@prisma/client";

export const PRINTHUB_PROJECT_ID = "printhub_africa";

const ENV_ALLOW = "PRINTHUB_SEED_ALLOW";

/**
 * Throws if the current environment is not allowed to run seed/clean (missing PRINTHUB_SEED_ALLOW=1),
 * or if the connected database is not the PrintHub database (DatabaseGuard row missing or wrong project).
 * Call this at the start of seed.ts and clean-test-data.ts.
 */
export async function assertPrinthubDatabase(prisma: PrismaClient): Promise<void> {
  const allow = process.env[ENV_ALLOW];
  if (allow !== "1" && allow !== "true") {
    throw new Error(
      `Database protection: set ${ENV_ALLOW}=1 in your .env or .env.local to confirm this is the PrintHub database and you want to run seed/clean. This prevents accidentally seeding another project's DB.`
    );
  }

  const row = await prisma.databaseGuard.findUnique({
    where: { id: "default" },
    select: { project: true },
  }).catch(() => null);

  if (!row || row.project !== PRINTHUB_PROJECT_ID) {
    throw new Error(
      `Database protection: the connected database is not the PrintHub database (missing or wrong DatabaseGuard). ` +
        `Seed/clean only run against a DB that has been migrated with PrintHub (so it has project="${PRINTHUB_PROJECT_ID}"). ` +
        `Check DATABASE_URL and ensure you are not pointing at another project's database.`
    );
  }
}
