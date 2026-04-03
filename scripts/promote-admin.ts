import path from "node:path";
import { config } from "dotenv";

// Load environment variables BEFORE any other imports to ensure they are available for initialization
const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const adminEmail = "admin@printhub.africa";
  const newPassword = "AlphaTango26"; // User confirmed this works
  const hashed = await bcrypt.hash(newPassword, 12);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Ensure it is in your .env file.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`🚀 Attempting to promote ${adminEmail} to SUPER_ADMIN...`);

  try {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: UserRole.SUPER_ADMIN,
        passwordHash: hashed,
        status: "ACTIVE",
        emailVerified: new Date(),
      },
      create: {
        email: adminEmail,
        name: "PrintHub Super Admin",
        passwordHash: hashed,
        role: UserRole.SUPER_ADMIN,
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Success! ${user.email} is now a SUPER_ADMIN.`);
    console.log(`🔑 Password is set to the provided one.`);
  } catch (error) {
    console.error("❌ Promotion failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
