import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";
/**
 * POST /api/admin/marketing/social-export/sync
 * Social syndication sync — AI generation not yet configured.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "marketing_edit" }, req);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    success: false,
    message: "Social syndication not configured. Wire to a direct integration.",
  }, { status: 501 });
}
