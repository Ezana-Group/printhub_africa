import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isAdmin = host.startsWith("admin.") || host.startsWith("admin.localhost") || (host.includes("localhost:3000") && req.nextUrl.pathname.startsWith("/admin"));
  
  // Extract the segment after /api/auth/
  const segments = req.nextUrl.pathname.split("/api/auth/")[1];
  const searchParams = req.nextUrl.searchParams.toString();
  
  const target = isAdmin ? `/api/auth/admin/${segments}` : `/api/auth/customer/${segments}`;
  const url = new URL(target + (searchParams ? `?${searchParams}` : ""), req.url);
  
  return NextResponse.redirect(url);
}

export async function POST(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isAdmin = host.startsWith("admin.") || host.startsWith("admin.localhost") || (host.includes("localhost:3000") && req.nextUrl.pathname.startsWith("/admin"));
  
  const segments = req.nextUrl.pathname.split("/api/auth/")[1];
  const target = isAdmin ? `/api/auth/admin/${segments}` : `/api/auth/customer/${segments}`;
  const url = new URL(target, req.url);
  
  return NextResponse.redirect(url, { status: 307 });
}
