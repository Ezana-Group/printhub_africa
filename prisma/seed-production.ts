/**
 * Production seed: clean slate — creates ONLY the super admin user.
 * Use this after deploying to production so you can log in and start adding real data.
 *
 * Usage:
 *   SUPER_ADMIN_EMAIL=admin@printhub.africa SUPER_ADMIN_PASSWORD="YourSecurePassword" npx tsx prisma/seed-production.ts
 * Optional: SUPER_ADMIN_NAME="PrintHub Super Admin"
 *
 * Requires: DATABASE_URL, SUPER_ADMIN_PASSWORD (SUPER_ADMIN_EMAIL defaults to admin@printhub.africa).
 */

import path from "node:path";
import { config } from "dotenv";

const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env or .env.local.");
  process.exit(1);
}

const email = (process.env.SUPER_ADMIN_EMAIL ?? "admin@printhub.africa").trim();
const rawPassword = process.env.SUPER_ADMIN_PASSWORD;
const name = (process.env.SUPER_ADMIN_NAME ?? "PrintHub Super Admin").trim();

if (!rawPassword || rawPassword.length < 8) {
  console.error("SUPER_ADMIN_PASSWORD must be set and at least 8 characters.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
    create: {
      email,
      name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log("Production seed done. Super admin:", admin.email);
  console.log("Log in at /login with this email and your password.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
