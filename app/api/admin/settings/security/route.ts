import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/settings-api";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const passwordPolicySchema = z.object({
  minLength: z.number().min(6).max(128).optional(),
  requireUppercase: z.boolean().optional(),
  requireNumbers: z.boolean().optional(),
  requireSpecialChars: z.boolean().optional(),
  passwordExpiry: z.enum(["Never", "30 days", "90 days", "180 days", "1 year"]).optional(),
  preventReuseOf: z.number().min(0).max(24).optional(),
}).optional();

const twoFactorPolicySchema = z.object({
  superAdmin: z.enum(["Enforced", "Recommended", "Optional", "Disabled"]).optional(),
  admin: z.enum(["Enforced", "Recommended", "Optional", "Disabled"]).optional(),
  staff: z.enum(["Enforced", "Recommended", "Optional", "Disabled"]).optional(),
  customer: z.enum(["Enforced", "Recommended", "Optional", "Disabled"]).optional(),
}).optional();

const sessionSettingsSchema = z.object({
  adminTimeoutHours: z.number().min(1).max(168).optional(), // Max 1 week
  customerTimeoutDays: z.number().min(1).max(365).optional(),
  concurrentAdminMax: z.number().min(1).max(100).optional(),
}).optional();

const ipAllowlistSchema = z.object({
  enabled: z.boolean().optional(),
  ips: z.array(z.string()).optional(),
}).optional();

const rateLimitSettingsSchema = z.object({
  loginMaxAttempts: z.number().min(1).max(20).optional(),
  loginLockoutMinutes: z.number().min(1).max(1440).optional(),
  apiLimitPerMinute: z.number().min(10).max(10000).optional(),
  checkoutLimitPer10Min: z.number().min(1).max(100).optional(),
  restrictMpesaIps: z.boolean().optional(),
}).optional();

const securityPatchSchema = z.object({
  passwordPolicy: passwordPolicySchema,
  twoFactorPolicy: twoFactorPolicySchema,
  sessionSettings: sessionSettingsSchema,
  ipAllowlist: ipAllowlistSchema,
  rateLimitSettings: rateLimitSettingsSchema,
});

export async function GET(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const settings = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
    select: {
      passwordPolicy: true,
      twoFactorPolicy: true,
      sessionSettings: true,
      ipAllowlist: true,
      rateLimitSettings: true,
    },
  });

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const auth = await requireRole(req, "ADMIN");
  if (auth instanceof NextResponse) return auth;

  const json = await req.json().catch(() => ({}));
  const body = securityPatchSchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid body", details: body.error.flatten() }, { status: 400 });
  }

  // Sensitive changes like IP allowlist toggle or restrictive settings require SUPER_ADMIN
  const isSuperAdmin = (auth.session.user as any).role === "SUPER_ADMIN";
  if (body.data.ipAllowlist?.enabled !== undefined && !isSuperAdmin) {
    return NextResponse.json({ error: "Only SUPER_ADMIN can toggle IP allowlist" }, { status: 403 });
  }

  const existing = await prisma.businessSettings.findUnique({
    where: { id: "default" },
    select: {
      passwordPolicy: true,
      twoFactorPolicy: true,
      sessionSettings: true,
      ipAllowlist: true,
      rateLimitSettings: true,
    },
  });

  const updateData: any = {};
  if (body.data.passwordPolicy) {
    updateData.passwordPolicy = { ...(existing?.passwordPolicy as any || {}), ...body.data.passwordPolicy };
  }
  if (body.data.twoFactorPolicy) {
    updateData.twoFactorPolicy = { ...(existing?.twoFactorPolicy as any || {}), ...body.data.twoFactorPolicy };
  }
  if (body.data.sessionSettings) {
    updateData.sessionSettings = { ...(existing?.sessionSettings as any || {}), ...body.data.sessionSettings };
  }
  if (body.data.ipAllowlist) {
    updateData.ipAllowlist = { ...(existing?.ipAllowlist as any || {}), ...body.data.ipAllowlist };
  }
  if (body.data.rateLimitSettings) {
    updateData.rateLimitSettings = { ...(existing?.rateLimitSettings as any || {}), ...body.data.rateLimitSettings };
  }

  await prisma.businessSettings.update({
    where: { id: "default" },
    data: updateData,
  });

  await writeAudit({
    userId: auth.userId,
    action: "SECURITY_SETTINGS_UPDATED",
    entity: "SETTINGS",
    entityId: "security",
    after: body.data,
    request: req,
  });

  return NextResponse.json({ success: true });
}
