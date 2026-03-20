import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { z } from "zod";

const navSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;

  try {
    const items = await prisma.navigationItem.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
        },
      },
      where: { parentId: null },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Fetch navigation error:", error);
    return NextResponse.json({ error: "Failed to fetch navigation" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = navSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const item = await prisma.navigationItem.create({
      data: {
        label: parsed.data.label,
        href: parsed.data.href,
        parentId: parsed.data.parentId ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Create navigation error:", error);
    return NextResponse.json({ error: "Failed to create navigation item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const parsed = navSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const item = await prisma.navigationItem.update({
      where: { id },
      data: {
        label: parsed.data.label,
        href: parsed.data.href,
        parentId: parsed.data.parentId ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update navigation error:", error);
    return NextResponse.json({ error: "Failed to update navigation item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi({ permission: "settings_manage" });
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.navigationItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete navigation error:", error);
    return NextResponse.json({ error: "Failed to delete navigation item" }, { status: 500 });
  }
}
