import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/** Helper to check if an IP is in a CIDR range or matches exactly. */
function isIpInRange(ip: string, cidr: string): boolean {
  if (ip === cidr) return true;
  if (!cidr.includes("/")) return false;
  
  try {
    const [range, bits] = cidr.split("/");
    const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1);
    const ipInt = ip.split(".").reduce((acc, part) => (acc << 8) + parseInt(part), 0);
    const rangeInt = range.split(".").reduce((acc, part) => (acc << 8) + parseInt(part), 0);
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

async function checkAdminSecurity(req: any, token: any) {
  const path = new URL(req.url).pathname;
  const isAdminPath = path.startsWith("/admin") || path.startsWith("/api/admin");
  
  if (!isAdminPath || !token || !ADMIN_ROLES.includes(token.role)) {
    return null;
  }

  // Fetch security settings from internal API (Bypassing Edge/Prisma limitation)
  let settings: any = null;
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "https://printhub.africa";
    const res = await fetch(`${baseUrl}/api/auth/internal-security`, {
      headers: { "x-internal-secret": process.env.INTERNAL_SECRET || "" },
    });
    if (res.ok) settings = await res.json();
  } catch (err) {
    console.error("Middleware security fetch failed:", err);
  }

  if (!settings) return null;

  // 1. IP Allowlist Enforcement
  if (settings.ipAllowlist?.enabled) {
    const clientIp = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (clientIp && settings.ipAllowlist.ips?.length > 0) {
      const isAllowed = settings.ipAllowlist.ips.some((cidr: string) => isIpInRange(clientIp, cidr));
      if (!isAllowed) {
        console.warn(`Admin access blocked for IP: ${clientIp}`);
        return NextResponse.json({ error: "Access denied from this IP address." }, { status: 403 });
      }
    }
  }

  // 2. Session Timeout Enforcement (Admin only)
  if (token.lastActiveAt && settings.sessionSettings?.adminTimeoutHours) {
    const timeoutMs = settings.sessionSettings.adminTimeoutHours * 60 * 60 * 1000;
    const idleTime = Date.now() - (token.lastActiveAt as number);
    if (idleTime > timeoutMs) {
      // Session expired due to inactivity
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "SessionExpired");
      const response = NextResponse.redirect(url);
      // Clear next-auth cookies to force re-login
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("__Secure-next-auth.session-token");
      return response;
    }
  }

  return null;
}

/** Public API paths that must never be blocked (no auth, no origin check). */
function isPublicCatalogueApi(pathname: string, method: string): boolean {
  if (method !== "GET") return false;
  return (
    pathname === "/api/catalogue" ||
    pathname === "/api/catalogue/categories" ||
    pathname === "/api/catalogue/featured" ||
    pathname.startsWith("/api/catalogue/") 
  );
}

/** Allowed origins for API mutations (CSRF). */
function getAllowedOrigins(req: Request): string[] {
  const origins: string[] = [];
  try {
    origins.push(new URL(req.url).origin);
  } catch {}
  const primary = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (primary) {
    try {
      const o = new URL(primary).origin;
      if (!origins.includes(o)) origins.push(o);
    } catch {}
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

async function innerMiddleware(req: Request) {
  const token = (req as any).nextauth?.token;
  const path = new URL(req.url).pathname;

  // Security Enforcement (IP/Session)
  const securityBlock = await checkAdminSecurity(req, token);
  if (securityBlock) return securityBlock;

  // Role Checks
  if (path.startsWith("/api/admin")) {
    if (!token?.role || !ADMIN_ROLES.includes(token.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (path.startsWith("/admin")) {
    if (!token?.role || !ADMIN_ROLES.includes(token.role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Corporate portal check
  const isCorporateApply = path.startsWith("/corporate/apply") || path.startsWith("/corporate/invite");
  if (path.startsWith("/corporate") && !isCorporateApply) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    if (!token.isCorporate) return NextResponse.redirect(new URL("/corporate/apply", req.url));
  }

  return NextResponse.next();
}

export default withAuth(
  async function middleware(req) {
    const path = new URL(req.url).pathname;
    const method = req.method;
    if (isPublicCatalogueApi(path, method)) return NextResponse.next();
    
    const apiBlock = checkApiOrigin(req);
    if (apiBlock) return apiBlock;

    return innerMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = new URL(req.url).pathname;
        const method = req.method ?? "GET";
        if (isPublicCatalogueApi(path, method)) return true;
        if (path.startsWith("/admin")) return !!token && ADMIN_ROLES.includes(token.role as string);
        if (path.startsWith("/account")) return !!token;
        if (path.startsWith("/corporate")) {
          if (path.startsWith("/corporate/apply") || path.startsWith("/corporate/invite")) return true;
          return !!token;
        }
        return true;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/corporate/:path*", "/api/:path*"],
};
