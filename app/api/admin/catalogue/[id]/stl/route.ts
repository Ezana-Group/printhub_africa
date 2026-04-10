import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { revalidatePath } from "next/cache";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_edit" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { fileId } = await req.json();

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });

    if (!uploadedFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const updatedItem = await prisma.catalogueItem.update({
      where: { id },
      data: {
        modelStorageKey: uploadedFile.storageKey,
        modelUrl: uploadedFile.url,
      },
    });

    // Mark the file as used in catalogue
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: { uploadContext: "ADMIN_CATALOGUE_STL" }
    });

    revalidatePath(`/admin/catalogue/${id}/edit`);
    revalidatePath("/admin/catalogue");

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("STL Association Error:", error);
    return NextResponse.json({ error: "Failed to update item with STL" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "catalogue_edit" });
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    await prisma.catalogueItem.update({
      where: { id },
      data: {
        modelStorageKey: null,
        modelUrl: null,
      },
    });

    revalidatePath(`/admin/catalogue/${id}/edit`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("STL Removal Error:", error);
    return NextResponse.json({ error: "Failed to remove STL" }, { status: 500 });
  }
}
