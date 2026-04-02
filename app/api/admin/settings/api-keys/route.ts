import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const apiKeySchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.string()).min(1),
  expiry: z.enum(["30 days", "90 days", "1 year", "Never"]),
});

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const keys = await prisma.apiKey.findMany({
    where: { revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN"); // Only super admin can generate keys
  if (auth instanceof NextResponse) return auth;

  const json = await req.json().catch(() => ({}));
  const body = apiKeySchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid body", details: body.error.flatten() }, { status: 400 });
  }

  // Generate a random key
  const prefix = "ph_live_";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const plaintextKey = `${prefix}${randomBytes}`;
  
  // Hash the key for storage
  const keyHash = crypto.createHash("sha256").update(plaintextKey).digest("hex");

  let expiresAt: Date | null = null;
  if (body.data.expiry === "30 days") {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else if (body.data.expiry === "90 days") {
    expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  } else if (body.data.expiry === "1 year") {
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  const apiKey = await prisma.apiKey.create({
    data: {
      name: body.data.name,
      keyHash,
      keyPrefix: prefix,
      permissions: body.data.permissions,
      expiresAt,
      createdBy: auth.userId,
    },
  });

  await writeAudit({
    userId: auth.userId,
    action: "API_KEY_GENERATED",
    entity: "API_KEY",
    entityId: apiKey.id,
    after: { name: body.data.name, permissions: body.data.permissions, expiresAt },
    request: req,
  });

  return NextResponse.json({
    id: apiKey.id,
    name: apiKey.name,
    plaintextKey, // Return ONLY ONCE
    createdAt: apiKey.createdAt,
    expiresAt: apiKey.expiresAt,
  });
}
