import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CORS_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-printhub-signature",
  "x-printhub-timestamp",
  "x-api-key",
  // Next.js RSC / navigation headers
  "RSC",
  "Next-Router-Prefetch",
  "Next-Router-State-Tree",
  "Next-Url",
  "Next-HMR-Refresh",
  // Sentry distributed tracing headers
  "sentry-trace",
  "baggage",
].join(", ");

function getAllowedOrigins(isProduction: boolean): string[] {
  return [
    process.env.NEXT_PUBLIC_ADMIN_URL,       // https://admin.printhub.africa
    process.env.NEXT_PUBLIC_APP_URL,         // https://printhub.africa
    "https://printhub.africa",
    "https://www.printhub.africa",
    "https://admin.printhub.africa",
    "https://test.ovid.co.ke",
    ...(!isProduction ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
  ].filter(Boolean) as string[];
}

function applyCors(response: NextResponse, origin: string | null, allowedOrigins: string[]): void {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", CORS_ALLOWED_HEADERS);
    response.headers.set("Vary", "Origin");
  }
}

/** Redirect with CORS headers so browsers allow cross-origin redirects */
function corsRedirect(
  url: string | URL,
  origin: string | null,
  allowedOrigins: string[],
  status = 307
): NextResponse {
  const response = NextResponse.redirect(url, status);
  applyCors(response, origin, allowedOrigins);
  return response;
}

/**
 * Returns true when a request is a Next.js internal RSC/prefetch fetch
 * (i.e. from the router, not a top-level browser navigation).
 * These are cross-origin fetches that must NOT be redirected to a different
 * origin — the browser will block them. We let them fall through instead so
 * Next.js handles them gracefully (it falls back to full navigation itself).
 */
function isRscOrPrefetch(request: NextRequest): boolean {
  return (
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("Next-Router-State-Tree")
  );
}

export async function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const allowedOrigins = getAllowedOrigins(isProduction);
  const origin = request.headers.get("origin");

  // --- CORS/Preflight Handling ---
  if (request.method === "OPTIONS") {
    if (origin && allowedOrigins.includes(origin)) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin",
        },
      });
    }
    // Blocked origin — return 403 explicitly (not NextResponse.next() which confuses browsers)
    if (origin) {
      return new NextResponse(null, { status: 403 });
    }
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';
  
  const isAdminDomain = 
    host.startsWith('admin.') || 
    host.startsWith('admin.localhost') ||
    (host.includes('localhost') && (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')));

  const ADMIN_COOKIE = isProduction ? "__Secure-printhub.admin.session" : "printhub.admin.session";
  const CUSTOMER_COOKIE = isProduction ? "__Secure-printhub.customer.session" : "printhub.customer.session";

  // Rule: Pass through webhooks, payment callbacks and n8n API routes
  if (pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/payments/callback') || pathname.startsWith('/api/n8n')) {
    return NextResponse.next();
  }

  if (isAdminDomain) {
    // --- ADMIN DOMAIN LOGIC ---
    
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: ADMIN_COOKIE 
    });

    // --- CSRF/Origin Protection for Mutations ---
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    const isTelemetry = pathname.includes("/envelope"); // Sentry/telemetry

    if (isMutation && !isTelemetry) {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL; // e.g. https://admin.printhub.africa
      
      // Robust check: origin must match adminUrl or be part of the core domain
      const isAuthorizedOrigin = 
        !origin || 
        origin === adminUrl || 
        origin.endsWith(".printhub.africa") ||
        (host.includes('localhost') && !isProduction);

      if (isProduction && origin && !isAuthorizedOrigin) {
        console.error(`[Security] CSRF/Origin mismatch. Method: ${request.method}, Path: ${pathname}, Origin: ${origin}, Expected: ${adminUrl}`);
        return new NextResponse(JSON.stringify({ 
          error: "CSRF Prevention: Invalid Origin",
          detail: "The request origin does not match the authorized administration domain."
        }), { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    }

    const isLoginPage = pathname === "/login" || pathname === "/admin/login";
    const isAuthApi = pathname.startsWith("/api/auth");

    // Redirect to login if no session and not on auth pages or telemetry.
    // RSC/prefetch fetches must NOT be redirected cross-origin — let them fall through
    // so Next.js can handle the fallback to full navigation gracefully.
    if (!token && !isLoginPage && !isAuthApi && !isTelemetry) {
      if (isRscOrPrefetch(request)) {
        // Return a CORS-aware 401 so Next.js falls back to browser navigation without a CORS error
        const rscFallback = new NextResponse(null, { status: 401 });
        applyCors(rscFallback, origin, allowedOrigins);
        return rscFallback;
      }
      console.log(`[Middleware] No admin token for: ${pathname}. Domain: ${host}`);
      const loginUrl = new URL("/login", request.url);
      if (host.includes('localhost') && pathname.startsWith('/admin')) {
          loginUrl.pathname = '/admin/login';
      }
      return corsRedirect(loginUrl, origin, allowedOrigins);
    }

    // Block CUSTOMER sessions entirely on admin domain
    if (token && token.role === "CUSTOMER") {
      return corsRedirect(
        new URL(process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa", request.url),
        origin,
        allowedOrigins
      );
    }

    // Response with security headers
    let response = NextResponse.next();

    // Internal Rewrite for admin subdomain: admin.printhub.africa/orders -> /admin/orders
    // Special case: /login -> /admin/login
    if (host.startsWith('admin.') && (!pathname.startsWith("/admin") || pathname === "/admin") && !pathname.startsWith("/api")) {
      const url = request.nextUrl.clone();
      if (pathname === "/login") {
        url.pathname = "/admin/login";
      } else if (pathname === "/" || pathname === "/admin") {
        url.pathname = "/admin/dashboard";
      } else {
        url.pathname = `/admin${pathname}`;
      }
      response = NextResponse.rewrite(url);
    }

    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.printhub.africa;");
    response.headers.set("X-Frame-Options", "DENY");
    // Apply CORS headers for cross-origin requests (e.g. printhub.africa fetching admin.printhub.africa RSC)
    applyCors(response, origin, allowedOrigins);
    return response;

  } else {
    // --- MAIN DOMAIN LOGIC ---

    // 1. Block /admin routes on main domain (return 404, not redirect)
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      return new NextResponse(null, { status: 404 });
    }

    // 2. Detect STAFF/ADMIN/SUPER_ADMIN session on /login → redirect to admin portal.
    //    RSC prefetches must NOT redirect cross-origin — skip the redirect for them.
    if (pathname === "/login") {
      const adminToken = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: ADMIN_COOKIE 
      });
      if (adminToken && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(adminToken.role as string)) {
        if (isRscOrPrefetch(request)) {
          // Let Next.js handle this — it will fall back to a full navigation which
          // the browser handles correctly without a cross-origin CORS restriction
          const finalResponse = NextResponse.next();
          applyCors(finalResponse, origin, allowedOrigins);
          return finalResponse;
        }
        return corsRedirect(
          new URL(process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.printhub.africa", request.url),
          origin,
          allowedOrigins
        );
      }
    }

    // 3. Enforce customer session for /account and /corporate
    if (pathname.startsWith("/account") || pathname.startsWith("/corporate")) {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: CUSTOMER_COOKIE 
      });

      if (!token) {
        return corsRedirect(new URL("/login", request.url), origin, allowedOrigins);
      }

      // Enforce corporate membership for /corporate
      if (pathname.startsWith("/corporate") && !token.isCorporate && !pathname.startsWith("/corporate/apply")) {
        return corsRedirect(new URL("/corporate/apply", request.url), origin, allowedOrigins);
      }
    }
  }

  const finalResponse = NextResponse.next();
  // Apply CORS headers on the fallthrough response (e.g., main domain API calls from admin origin)
  applyCors(finalResponse, origin, allowedOrigins);
  return finalResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/corporate/:path*",
    "/api/admin/:path*",
    "/login",
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
