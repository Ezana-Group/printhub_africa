import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";
import { n8n } from "@/lib/n8n";

/**
 * POST /api/admin/marketing/social-export/sync
 * Triggers a global social media syndication sync across all active channels.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi({ permission: "marketing_edit" }, req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { session } = auth;
    
    // Trigger n8n Sync All Feeds workflow
    await n8n.syncAllFeeds({ 
      triggeredBy: session.user.id 
    });

    return NextResponse.json({ 
      success: true, 
      message: "Social syndication sync triggered successfully." 
    });
  } catch (error: any) {
    console.error("[SOCIAL_SYNC_ERROR]", error);
    return NextResponse.json({ 
      error: "SYNC_FAILED", 
      message: error.message || "Failed to trigger syndication sync." 
    }, { status: 500 });
  }
}
