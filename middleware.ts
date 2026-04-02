import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';
  
  const isAdminDomain = 
    host.startsWith('admin.') || 
    host.startsWith('admin.localhost') ||
    (host.includes('localhost:3000') && pathname.startsWith('/admin'));

  const isProduction = process.env.NODE_ENV === "production";
  const ADMIN_COOKIE = isProduction ? "__Secure-printhub.admin.session" : "printhub.admin.session";
  const CUSTOMER_COOKIE = isProduction ? "__Secure-printhub.customer.session" : "printhub.customer.session";

  // Rule: Pass through webhooks and payment callbacks
  if (pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/payments/callback')) {
    return NextResponse.next();
  }

  if (isAdminDomain) {
    // --- ADMIN DOMAIN LOGIC ---
    
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: ADMIN_COOKIE 
    });

    const isLoginPage = pathname === "/login" || pathname === "/admin/login";
    const isAuthApi = pathname.startsWith("/api/auth");

    // Redirect to login if no session and not on auth pages
    if (!token && !isLoginPage && !isAuthApi) {
      const loginUrl = new URL("/login", request.url);
      // If we're on localhost:3000 and the path was /admin/..., we should probably keep /admin/login
      if (host.includes('localhost:3000') && !pathname.startsWith('/admin')) {
          loginUrl.pathname = '/admin/login';
      }
      return NextResponse.redirect(loginUrl);
    }

    // Block CUSTOMER sessions entirely on admin domain
    if (token && token.role === "CUSTOMER") {
      return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa", request.url));
    }

    // Response with security headers
    let response = NextResponse.next();

    // Internal Rewrite for admin subdomain: admin.printhub.africa/orders -> /admin/orders
    // Special case: /login -> /admin/login
    if (host.startsWith('admin.') && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
      const url = request.nextUrl.clone();
      if (pathname === "/login") {
        url.pathname = "/admin/login";
      } else {
        url.pathname = `/admin${pathname}`;
      }
      response = NextResponse.rewrite(url);
    }

    response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
    response.headers.set("X-Frame-Options", "DENY");
    return response;

  } else {
    // --- MAIN DOMAIN LOGIC ---

    // 1. Block /admin routes on main domain (return 404, not redirect)
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      return new NextResponse(null, { status: 404 });
    }

    // 2. Detect STAFF/ADMIN/SUPER_ADMIN session on /login -> redirect to admin portal
    if (pathname === "/login") {
      const adminToken = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: ADMIN_COOKIE 
      });
      if (adminToken && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(adminToken.role as string)) {
        return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.printhub.africa", request.url));
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
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Enforce corporate membership for /corporate
      if (pathname.startsWith("/corporate") && !token.isCorporate && !pathname.startsWith("/corporate/apply")) {
        return NextResponse.redirect(new URL("/corporate/apply", request.url));
      }
    }
  }

  return NextResponse.next();
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
