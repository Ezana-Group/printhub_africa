/**
 * Create or promote a user to SUPER_ADMIN.
 * Usage:
 *   EMAIL=you@company.com PASSWORD=YourSecurePass npx tsx scripts/create-super-admin.ts
 * Or with optional name:
 *   EMAIL=you@company.com PASSWORD=YourSecurePass NAME="Your Name" npx tsx scripts/create-super-admin.ts
 *
 * Requires DATABASE_URL in .env or .env.local.
 */

import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const email = process.env.EMAIL?.trim();
const rawPassword = process.env.PASSWORD;
const name = process.env.NAME?.trim();

if (!email || !rawPassword) {
  console.error("Usage: EMAIL=user@example.com PASSWORD=secret [NAME=\"Display Name\"] npx tsx scripts/create-super-admin.ts");
  process.exit(1);
}

if (rawPassword.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const password: string = rawPassword;
const safeEmail: string = email;
const displayName: string = name ?? "Super Admin";

async function main() {
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: safeEmail },
    update: {
      role: UserRole.SUPER_ADMIN,
      passwordHash,
      ...(name != null && name !== "" && { name: displayName }),
      emailVerified: new Date(),
    },
    create: {
      email: safeEmail,
      name: displayName,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log("Super admin ready:", user.email);
  console.log("Log in at /login with this email and the password you set.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
