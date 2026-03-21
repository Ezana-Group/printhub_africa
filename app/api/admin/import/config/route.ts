import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";

export async function GET() {
  const auth = await requireAdminApi({ permission: "catalogue_import" });
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    config: {
      THINGIVERSE_APP_TOKEN: !!process.env.THINGIVERSE_APP_TOKEN,
      MMF_CLIENT_ID: !!process.env.MMF_CLIENT_ID,
      CGTRADER_CLIENT_ID: !!process.env.CGTRADER_CLIENT_ID,
    }
  });
}
