import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/** Public API paths that must never be blocked (no auth, no origin check). */
function isPublicCatalogueApi(pathname: string, method: string): boolean {
  if (method !== "GET") return false;
  return (
    pathname === "/api/catalogue" ||
    pathname === "/api/catalogue/categories" ||
    pathname === "/api/catalogue/featured" ||
    pathname.startsWith("/api/catalogue/") // includes /api/catalogue/[slug]
  );
}

/** Allowed origins for API mutations (CSRF). Request host (Vercel + previews), env URL, localhost. */
function getAllowedOrigins(req: Request): string[] {
  const origins: string[] = [];
  // Same-origin: the host this request was sent to (Vercel production + preview URLs work without extra config)
  try {
    origins.push(new URL(req.url).origin);
  } catch {
    // ignore
  }
  const primary = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (primary) {
    try {
      const o = new URL(primary).origin;
      if (!origins.includes(o)) origins.push(o);
    } catch {
      // ignore
    }
  }
  origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  return origins;
}

/** CSRF mitigation: reject state-changing API requests from other origins when Origin header is present. */
function checkApiOrigin(req: Request): NextResponse | null {
  const path = new URL(req.url).pathname;
  if (!path.startsWith("/api") || !MUTATION_METHODS.includes(req.method)) return null;
  const origin = req.headers.get("origin");
  if (!origin) return null; // Allow when Origin absent (same-origin in some browsers, or server/Postman)
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

function innerMiddleware(req: Request) {
  const token = (req as Request & { nextauth?: { token?: { role?: string; isCorporate?: boolean } } }).nextauth?.token;
  const path = new URL(req.url).pathname;

  if (path.startsWith("/admin")) {
    if (!token?.role || !ADMIN_ROLES.includes(token.role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Corporate portal: require auth; if not a corporate member, redirect to apply
  const isCorporateApply = path.startsWith("/corporate/apply") || path.startsWith("/corporate/invite");
  if (path.startsWith("/corporate") && !isCorporateApply) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!token.isCorporate) {
      return NextResponse.redirect(new URL("/corporate/apply", req.url));
    }
  }

  return NextResponse.next();
}

export default withAuth(
  function middleware(req) {
    const path = new URL(req.url).pathname;
    const method = req.method;
    if (isPublicCatalogueApi(path, method)) {
      return NextResponse.next();
    }
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
        if (path.startsWith("/admin")) {
          return !!token && ADMIN_ROLES.includes(token.role as string);
        }
        if (path.startsWith("/account")) {
          return !!token;
        }
        if (path.startsWith("/corporate")) {
          if (path.startsWith("/corporate/apply") || path.startsWith("/corporate/invite")) {
            return true; // apply and invite pages: allow (apply may require login in page)
          }
          return !!token;
        }
        return true;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/corporate/:path*",
    "/api/:path*",
  ],
};
