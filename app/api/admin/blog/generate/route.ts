import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { n8n } from "@/lib/n8n";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { topic, keywords } = await req.json();
    
    // Trigger n8n SEO content generation
    await n8n.generateSeoContent({
      topic,
      keywords,
      productContext: true
    });

    return NextResponse.json({ success: true, message: "Generation started" });
  } catch (err) {
    console.error("[blog-generate-post]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
