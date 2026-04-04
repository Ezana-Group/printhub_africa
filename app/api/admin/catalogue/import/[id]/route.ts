import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const item = await prisma.catalogueImportQueue.findUnique({
      where: { id: params.id }
    });

    if (!item) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (err) {
    console.error("[catalogue-import-get]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const item = await prisma.catalogueImportQueue.update({
      where: { id: params.id },
      data: {
        aiEnhancement: data.aiEnhancement,
        scrapedName: data.scrapedName,
        scrapedDescription: data.scrapedDescription,
        status: data.status,
      }
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("[catalogue-import-patch]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
