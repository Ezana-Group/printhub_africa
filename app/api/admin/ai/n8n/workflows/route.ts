import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi({ permission: "marketing_view" });
  if (auth instanceof NextResponse) return auth;

  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || "https://n8n.printhub.africa";
  const apiKey = process.env.N8N_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "N8N_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${n8nUrl}/api/v1/workflows`, {
      headers: {
        "X-N8N-API-KEY": apiKey,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`n8n API responded with ${response.status}: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[n8n Workflows Proxy Error]:", error);
    return NextResponse.json({ error: "Failed to fetch workflows from n8n" }, { status: 500 });
  }
}
