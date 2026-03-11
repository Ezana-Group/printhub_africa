import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const STAFF_OR_ADMIN = ["STAFF", "ADMIN", "SUPER_ADMIN"];

const postSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
});

/** GET: Return current user profile for my-account form (name, email, phone). */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

/** POST: Update current user profile (name, email, phone). Writes to User table. */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !role || !STAFF_OR_ADMIN.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  if (data.email !== undefined && data.email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  }
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.email != null && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone ?? null }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    console.error("My account profile update error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
