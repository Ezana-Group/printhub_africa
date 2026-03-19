import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STAFF_OR_ADMIN = ["STAFF", "ADMIN", "SUPER_ADMIN"];

/** GET: Return current user's notification preferences (for My Notifications page). */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || !role || !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = `staffNotificationPrefs:${session.user.id}`;
  const row = await prisma.pricingConfig.findUnique({ where: { key } });
  if (!row) return NextResponse.json({ preferences: null });
  try {
    const preferences = JSON.parse(row.valueJson) as unknown;
    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json({ preferences: null });
  }
}

/** POST: Save current user's notification preferences. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user?.id || !role || !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const key = `staffNotificationPrefs:${session.user.id}`;
  const valueJson = JSON.stringify(body);
  await prisma.pricingConfig.upsert({
    where: { key },
    update: { valueJson },
    create: { key, valueJson },
  });
  return NextResponse.json({ success: true });
}
