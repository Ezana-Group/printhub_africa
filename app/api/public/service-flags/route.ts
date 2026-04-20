import { NextResponse } from "next/server";
import { getServiceFlags } from "@/lib/service-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  const flags = await getServiceFlags();
  return NextResponse.json(flags);
}
