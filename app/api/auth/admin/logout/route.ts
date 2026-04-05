import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  return handleLogout(req);
}

export async function GET(req: Request) {
  return handleLogout(req);
}

async function handleLogout(req: Request) {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction ? "__Secure-printhub.admin.session" : "printhub.admin.session";
    
    const token = await getToken({ 
      req: req as any, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName 
    });

    if (token?.sessionId) {
      // Invalidate AdminSession in DB
      await prisma.adminSession.updateMany({
        where: { id: token.sessionId as string },
        data: { revokedAt: new Date() }
      }).catch(err => console.error("Failed to revoke AdminSession:", err));
    } else if (token?.sub) {
      // Fallback: revoke all sessions for this user if sessionId is missing
      await prisma.adminSession.updateMany({
        where: { userId: token.sub, revokedAt: null },
        data: { revokedAt: new Date() }
      }).catch(err => console.error("Failed to revoke AdminSessions for user:", err));
    }

    // Prepare redirect to login
    const loginUrl = new URL("/login", req.url);
    // If on admin subdomain and not localhost, /login will work via middleware or direct redirect
    // If we want to be explicit about the domain:
    // const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.printhub.africa";
    
    const response = NextResponse.redirect(loginUrl, { status: 302 });

    // Clear the cookie
    (await cookies()).delete(cookieName);

    // Also clear the default next-auth cookies just in case
    (await cookies()).delete("next-auth.session-token");
    (await cookies()).delete("__Secure-next-auth.session-token");
    (await cookies()).delete("next-auth.csrf-token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
