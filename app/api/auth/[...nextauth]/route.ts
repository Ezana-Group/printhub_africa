import { NextRequest } from "next/server";
import { GET as adminGet, POST as adminPost } from "../admin/[...nextauth]/route";
import { GET as customerGet, POST as customerPost } from "../customer/[...nextauth]/route";

export async function GET(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const host = req.headers.get("host") ?? "";
  const referer = req.headers.get("referer") || "";
  
  // Await params for Next.js 15 compatibility
  const params = await ctx.params;
  const resolvedCtx = { ...ctx, params };
  
  // Detection logic for admin: check subdomains or localhost with admin pathing
  const isAdmin = 
    host.startsWith("admin.") || 
    host.startsWith("admin.localhost") || 
    (host.includes("localhost") && (
      req.nextUrl.pathname.includes("/admin") || 
      referer.includes("/admin")
    ));
  
  if (isAdmin) {
    return adminGet(req, resolvedCtx);
  }
  return customerGet(req, resolvedCtx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const host = req.headers.get("host") ?? "";
  const referer = req.headers.get("referer") || "";
  
  // Await params for Next.js 15 compatibility
  const params = await ctx.params;
  const resolvedCtx = { ...ctx, params };
  
  const isAdmin = 
    host.startsWith("admin.") || 
    host.startsWith("admin.localhost") || 
    (host.includes("localhost") && (
      req.nextUrl.pathname.includes("/admin") || 
      referer.includes("/admin")
    ));
  
  if (isAdmin) {
    return adminPost(req, resolvedCtx);
  }
  return customerPost(req, resolvedCtx);
}
