

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

function isPublicCatalogueApi(pathname: string, method: string): boolean {
  if (method !== "GET") return false;
  return (
    pathname === "/api/catalogue" ||
    pathname === "/api/catalogue/categories" ||
    pathname === "/api/catalogue/featured" ||
    pathname.startsWith("/api/catalogue/")
  );
}

function getAllowedOrigins(req: Request): string[] {
  const origins: string[] = [];
  try {
    origins.push(new URL(req.url).origin);
  } catch { }

  const primary = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (primary) {
    try {
      const o = new URL(primary).origin;
      if (!origins.includes(o)) origins.push(o);
    } catch { }
  }
  const admin = process.env.ADMIN_NEXTAUTH_URL;
  if (admin) {
    try {
      const ao = new URL(admin).origin;
      if (!origins.includes(ao)) origins.push(ao);
    } catch { }
  }

  origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  return origins;
}

function checkApiOrigin(req: Request): NextResponse | null {
  const path = new URL(req.url).pathname;
  if (!path.startsWith("/api") || !MUTATION_METHODS.includes(req.method)) return null;
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const allowedOrigins = getAllowedOrigins(req);
  try {
    const requestOrigin = new URL(origin).origin;
    if (!allowedOrigins.includes(requestOrigin)) {
      return NextResponse.json({ error: "Forbidden - Invalid Origin" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden - Malformed Origin" }, { status: 403 });
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  if (isPublicCatalogueApi(pathname, method)) {
    return NextResponse.next();
  }

  const apiBlock = checkApiOrigin(req);
  if (apiBlock) return apiBlock;

  const isAdminHost = host.startsWith('admin.');
  const isAdminPath = pathname.startsWith('/admin');

  // Strict Routing Enforcements
  if (isAdminHost && !isAdminPath) {
    // Redirect bare admin.printhub.africa to dashboard
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  if (!isAdminHost && isAdminPath) {
    // 404 to obscure admin portal on customer domains
    return new NextResponse(null, { status: 404 });
  }

  if (isAdminHost || isAdminPath) {
    return handleAdminMiddleware(req);
  }

  return handleCustomerMiddleware(req);
}

async function handleAdminMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Let the pages handle their own basic state for the login flow 
  if (
     pathname === '/admin/login' || 
     pathname === '/admin/login/verify-2fa' ||
     pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.ADMIN_NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production" ? "__Host-ph-admin" : "ph-admin-dev"
  });

  if (pathname.startsWith('/admin/setup/2fa')) {
    // Requires a session, the page protects itself from fully secured users
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin')) {
    if (!token?.role || !ADMIN_ROLES.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // General Admin Route Protection
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (!token?.role || !ADMIN_ROLES.includes(token.role as string)) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  if (token.mustSetup2FA) {
    return NextResponse.redirect(new URL('/admin/setup/2fa', req.url));
  }

  return NextResponse.next();
}

async function handleCustomerMiddleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (!pathname.startsWith('/api/account') && !pathname.startsWith('/account') && !pathname.startsWith('/corporate')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === "production" ? "__Host-ph-customer" : "ph-customer-dev"
  });

  if (pathname.startsWith('/api/account') || pathname.startsWith('/api/corporate')) {
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  if (pathname.startsWith('/account')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
  }

  const isCorporateApply = pathname.startsWith("/corporate/apply") || pathname.startsWith("/corporate/invite");
  if (pathname.startsWith("/corporate") && !isCorporateApply) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!token.isCorporate) {
      return NextResponse.redirect(new URL("/corporate/apply", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/corporate/:path*",
    "/api/:path*",
  ],
};
