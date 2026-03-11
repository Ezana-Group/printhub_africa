import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];
const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/** CSRF mitigation: reject state-changing API requests from other origins when Origin header is present. */
function checkApiOrigin(req: Request): NextResponse | null {
  const path = new URL(req.url).pathname;
  if (!path.startsWith("/api") || !MUTATION_METHODS.includes(req.method)) return null;
  const origin = req.headers.get("origin");
  if (!origin) return null; // Allow when Origin absent (same-origin in some browsers, or server/Postman)
  const allowed = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (!allowed) return null;
  try {
    if (new URL(origin).origin !== new URL(allowed).origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function innerMiddleware(req: Request) {
  const token = (req as Request & { nextauth?: { token?: { role?: string } } }).nextauth?.token;
  const path = new URL(req.url).pathname;

  if (path.startsWith("/admin")) {
    if (!token?.role || !ADMIN_ROLES.includes(token.role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export default withAuth(
  function middleware(req) {
    const apiBlock = checkApiOrigin(req);
    if (apiBlock) return apiBlock;
    return innerMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = new URL(req.url).pathname;
        if (path.startsWith("/admin")) {
          return !!token && ADMIN_ROLES.includes(token.role as string);
        }
        if (path.startsWith("/account")) {
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
    "/api/:path*",
  ],
};
