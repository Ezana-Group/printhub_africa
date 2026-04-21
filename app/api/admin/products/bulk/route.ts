import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(["set_active", "set_inactive", "delete"]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ids, action } = parsed.data;
  const permission = action === "delete" ? "products_delete" : "products_edit";
  const auth = await requireAdminApi({ permission });
  if (auth instanceof NextResponse) return auth;

  try {
    if (action === "delete") {
      const result = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      });
      revalidateTag("products");
      revalidateTag("homepage");
      revalidatePath("/shop");
      return NextResponse.json({ ok: true, affected: result.count });
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive: action === "set_active" },
    });
    revalidateTag("products");
    revalidateTag("homepage");
    revalidatePath("/shop");
    return NextResponse.json({ ok: true, affected: result.count });
  } catch (error) {
    console.error("Admin products bulk action failed:", error);
    return NextResponse.json({ error: "Bulk action failed" }, { status: 500 });
  }
}
