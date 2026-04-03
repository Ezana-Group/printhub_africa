import { NextRequest } from "next/server";
import { GET as adminGet, POST as adminPost } from "../admin/[...nextauth]/route";
import { GET as customerGet, POST as customerPost } from "../customer/[...nextauth]/route";

export async function GET(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  const host = req.headers.get("host") ?? "";
  const referer = req.headers.get("referer") || "";
  
  // Detection logic for admin: check subdomains or localhost with admin pathing
  const isAdmin = 
    host.startsWith("admin.") || 
    host.startsWith("admin.localhost") || 
    (host.includes("localhost") && (
      req.nextUrl.pathname.includes("/admin") || 
      referer.includes("/admin")
    ));
  
  if (isAdmin) {
    return adminGet(req, ctx);
  }
  return customerGet(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  const host = req.headers.get("host") ?? "";
  const referer = req.headers.get("referer") || "";
  
  const isAdmin = 
    host.startsWith("admin.") || 
    host.startsWith("admin.localhost") || 
    (host.includes("localhost") && (
      req.nextUrl.pathname.includes("/admin") || 
      referer.includes("/admin")
    ));
  
  if (isAdmin) {
    return adminPost(req, ctx);
  }
  return customerPost(req, ctx);
}
