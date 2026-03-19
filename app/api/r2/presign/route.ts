import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessRoute } from "@/lib/admin-permissions";
import {
  createPresignedDownloadUrl,
  isR2Configured,
  publicFileUrl,
} from "@/lib/r2";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export async function GET(req: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "File storage not configured" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const permissions = (session?.user as { permissions?: string[] })?.permissions;

  if (!session?.user?.id || !role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessRoute("/admin/email", role, permissions ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const bucketParam = url.searchParams.get("bucket");
  const redirect = url.searchParams.get("redirect") === "1";
  const expiresIn = Number(url.searchParams.get("expiresIn") ?? "3600");

  if (!key) {
    return NextResponse.json({ error: "Missing `key` query param" }, { status: 400 });
  }

  const bucket = bucketParam === "public" ? "public" : "private";

  try {
    const downloadUrl =
      bucket === "public" ? publicFileUrl(key) : await createPresignedDownloadUrl(key, expiresIn);

    if (redirect) return NextResponse.redirect(downloadUrl);
    return NextResponse.json({ url: downloadUrl, expiresIn: bucket === "public" ? null : expiresIn });
  } catch {
    return NextResponse.json({ error: "Failed to presign download URL" }, { status: 500 });
  }
}

