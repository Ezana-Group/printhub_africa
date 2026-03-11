import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { getSignedDownloadUrl } from "@/lib/s3";

/** GET: Redirect to a signed download URL for the item's STL (private bucket). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi({ permission: "products_view" });
  if (auth instanceof NextResponse) return auth;
  const { id: itemId } = await params;

  const item = await prisma.catalogueItem.findUnique({
    where: { id: itemId },
    select: { stlFileUrl: true, stlFileName: true },
  });
  if (!item?.stlFileUrl) return NextResponse.json({ error: "No STL file" }, { status: 404 });

  const key = item.stlFileUrl;
  const signedUrl = await getSignedDownloadUrl(key);
  if (signedUrl) {
    return NextResponse.redirect(signedUrl);
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (key.startsWith("uploads/")) {
    return NextResponse.redirect(`${base}/${key}`);
  }
  return NextResponse.json({ error: "Download not available." }, { status: 502 });
}
