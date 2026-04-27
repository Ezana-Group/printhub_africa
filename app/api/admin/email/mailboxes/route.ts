import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";
import { canAccessRoute } from "@/lib/admin-permissions";
import { z } from "zod";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const createMailboxSchema = z.object({
  address: z.string().min(3).max(200),
  label: z.string().min(1).max(120),
});

export async function GET() {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;

  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/email/settings", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mailboxes = await prisma.emailAddress.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      address: true,
      label: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    mailboxes: mailboxes.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;

  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessRoute("/admin/email/settings", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cloudflareConfigured =
    !!process.env.CLOUDFLARE_API_TOKEN &&
    !!process.env.CLOUDFLARE_ZONE_ID &&
    !!process.env.RESEND_INBOUND_ADDRESS;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createMailboxSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const address = parsed.data.address.trim().toLowerCase();
  const label = parsed.data.label.trim();

  if (!address.endsWith("@printhub.africa")) {
    return NextResponse.json({ error: "Mailbox address must end with @printhub.africa" }, { status: 400 });
  }

  // 1) Optionally register forwarding rule in Cloudflare Email Routing.
  if (cloudflareConfigured) {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    const resendInboundAddress = process.env.RESEND_INBOUND_ADDRESS!;

    const cfResp = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfToken}`,
          "Content-Type": "application/json",
          "User-Agent": "PrintHub/1.0 (https://printhub.africa)",
        },
        body: JSON.stringify({
          actions: [{ type: "forward", value: [resendInboundAddress] }],
          matchers: [{ type: "literal", field: "to", value: address }],
          enabled: true,
          name: label,
        }),
      }
    );

    if (!cfResp.ok) {
      const text = await cfResp.text().catch(() => "");
      console.error(`[Cloudflare] API error ${cfResp.status}:`, text);
      return NextResponse.json(
        { error: "Failed to create Cloudflare forwarding rule", details: text || undefined },
        { status: 502 }
      );
    }
  }

  // 2) Create EmailAddress in DB.
  try {
    const emailAddress = await prisma.emailAddress.create({
      data: { address, label, isActive: true },
    });

    return NextResponse.json({
      success: true,
      inboundReady: cloudflareConfigured,
      warning: cloudflareConfigured
        ? undefined
        : "Mailbox saved. Inbound email will not work until CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, and RESEND_INBOUND_ADDRESS are configured.",
      emailAddress,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: cloudflareConfigured
          ? "Mailbox created in Cloudflare but failed to save in DB"
          : "Failed to save mailbox in DB",
        details: String(e),
      },
      { status: 500 }
    );
  }
}

