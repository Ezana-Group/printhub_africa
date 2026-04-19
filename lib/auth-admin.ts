import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { verifySync } from "otplib";
import { sendEmail } from "@/lib/email";
import { n8n } from "@/lib/n8n";

/**
 * Server-side authentication helper for Admin/Staff routes.
 */
export async function authAdmin(req?: any) {
  const session = await getServerSession(authOptionsAdmin);
  return (session?.user as any) || null;
}

// Reuse logic from lib/auth.ts
const CACHE_TTL_MS = 5 * 60 * 1000;
const staffPermissionsCache = new Map<string, { permissions: string[]; expiresAt: number }>();

function getCachedStaffPermissions(userId: string): string[] | undefined {
  const entry = staffPermissionsCache.get(userId);
  if (!entry || Date.now() > entry.expiresAt) return undefined;
  return entry.permissions;
}

function setCachedStaffPermissions(userId: string, permissions: string[]) {
  staffPermissionsCache.set(userId, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateStaffPermissionsCache(userId: string) {
  staffPermissionsCache.delete(userId);
}

import { checkImpossibleTravel } from "./impossible-travel";
import { getLocationFromIp } from "./geo-detection";

export const authOptionsAdmin: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // Default 8 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-printhub.admin.session" : "printhub.admin.session",
      options: {
        httpOnly: true,
        sameSite: "strict", // Tightened for enhanced CSRF protection
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".printhub.africa" : undefined,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "admin-credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            role: true,
            status: true,
            totpSecret: true,
            displayName: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            name: true,
            profileImage: true,
          },
        });

        if (!user || user.status === "DEACTIVATED") return null;

        // CUSTOMER check
        if (user.role === "CUSTOMER") {
          throw new Error("This is a staff portal. Customer accounts must log in at printhub.africa.");
        }

        // Lockout Check
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account locked. Try again after 15 minutes.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash || "");
        if (!isValid) {
          const attempts = (user.failedLoginAttempts ?? 0) + 1;
          const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts, lockedUntil },
          });
          return null;
        }

        // 2FA Logic (Required for Staff as per existing auth.ts strategy)
        if (user.totpSecret) {
          if (!credentials.totpCode) throw new Error("2FA_REQUIRED");
          const verified = verifySync({ secret: user.totpSecret, token: credentials.totpCode });
          if (!verified) throw new Error("INVALID_2FA");
        }

        const ip = (req.headers?.["x-forwarded-for"] as string)?.split(",")[0] || "127.0.0.1";
        const userAgent = (req.headers?.["user-agent"] as string) || "unknown";

        // Impossible Travel Check - Asynchronous Validation
        const currentLocation = await getLocationFromIp(ip);
        
        let isSuspiciousVal = false;
        if (currentLocation) {
          const { isSuspicious, reason } = await checkImpossibleTravel({
            userId: user.id,
            currentIp: ip,
            currentLocation,
            sessionId: "new-session", // not needed here
          });
          
          isSuspiciousVal = isSuspicious;

          if (isSuspicious) {
            // Revoke all other active AdminSessions
            await prisma.adminSession.updateMany({
              where: { userId: user.id, revokedAt: null },
              data: { revokedAt: new Date() },
            });
            
            // n8n Trigger: Security Alert (Impossible Travel)
            n8n.securityAlert({
              type: 'IMPOSSIBLE_TRAVEL',
              affectedUserId: user.id,
              affectedUserEmail: user.email,
              affectedUserName: user.name || user.email,
              details: { reason, location: currentLocation, ip },
              superAdminEmail: process.env.SUPER_ADMIN_EMAIL || "admin@printhub.africa"
            }).catch(err => console.error("n8n security-alert trigger failed:", err));
            
            // n8n Trigger: Specific Impossible Travel Trigger (if using separate workflow)
            n8n.impossibleTravel({
              userId: user.id,
              userEmail: user.email,
              userName: user.name || user.email,
              previousCountry: "UNKNOWN", // Fetching this would require another query
              previousIp: "UNKNOWN",
              previousLoginAt: new Date().toISOString(),
              newCountry: currentLocation?.country || "unknown",
              newIp: ip,
              newLoginAt: new Date().toISOString(),
              superAdminEmail: process.env.SUPER_ADMIN_EMAIL || "admin@printhub.africa",
              adminProfileUrl: `${process.env.NEXT_PUBLIC_ADMIN_URL}/admin/staff/${user.id}`
            }).catch(console.error);

            // Write to AuditLog (FIXED: added entity)
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "IMPOSSIBLE_TRAVEL_DETECTED",
                category: "SECURITY",
                entity: "User",
                entityId: user.id,
                ipAddress: ip,
                after: { reason, location: currentLocation },
              }
            }).catch(console.error);
          }
        }

        // @ts-ignore - AdminSession is in schema
        const adminSession = await prisma.adminSession.create({
          data: {
            userId: user.id,
            sessionToken: crypto.randomBytes(32).toString("hex"),
            ipAddress: ip,
            userAgent: userAgent,
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
            suspiciousLogin: isSuspiciousVal,
            ipCountry: currentLocation?.country,
            ipCity: currentLocation?.city,
          },
        });

        // Device Fingerprinting
        const fingerprint = crypto.createHash("sha256").update(userAgent).digest("hex");
        // @ts-ignore - KnownAdminDevice is in schema
        const knownDevice = await prisma.knownAdminDevice.findFirst({
          where: { userId: user.id, fingerprint: fingerprint },
        });

        if (!knownDevice) {
          // @ts-ignore - KnownAdminDevice is in schema
          await prisma.knownAdminDevice.create({
            data: { userId: user.id, fingerprint: fingerprint },
          });
          
          // Trigger n8n: New Device login
          n8n.newStaffLogin({
            userId: user.id,
            userEmail: user.email,
            userName: user.name || user.email,
            ipAddress: ip,
            userAgent: userAgent,
            city: currentLocation?.city || null,
            country: currentLocation?.country || null,
            loginAt: new Date().toISOString(),
            revokeUrl: `${process.env.NEXT_PUBLIC_ADMIN_URL}/security/revoke?token=${adminSession.sessionToken}`
          }).catch(err => console.error("n8n new-staff-login trigger failed:", err));
        } else {
          // @ts-ignore - KnownAdminDevice is in schema
          await prisma.knownAdminDevice.update({
            where: { id: knownDevice.id },
            data: { lastSeenAt: new Date() },
          });
        }

        // Update successful login
        await prisma.user.update({
          where: { id: user.id },
          // @ts-ignore - lastLoginIp is in schema
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginIp: ip },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          sessionId: adminSession.id,
          image: user.profileImage,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 🔴 HIGH-6: Safe `callbackUrl` Redirect Validation
      
      // Allow relative urls
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Allow urls that belong to our application domains
      try {
        const parsedUrl = new URL(url);
        if (
          parsedUrl.origin === baseUrl ||
          parsedUrl.hostname === 'printhub.africa' ||
          parsedUrl.hostname === 'admin.printhub.africa' ||
          parsedUrl.hostname === 'localhost' 
        ) {
          return url;
        }
      } catch (e) {
        // invalid URL format, ignore
      }

      console.warn(`[Security] Admin open redirect blocked to: ${url}`);
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.displayName = (user as any).displayName;
        token.sessionId = (user as any).sessionId;
        token.lastLoginAt = Date.now();
        token.lastLoginIp = (user as any).lastLoginIp || "127.0.0.1";
      }

      // Permissions Logic (STAFF role)
      if (token.role === "STAFF" && token.id) {
        const userId = token.id as string;
        const cached = getCachedStaffPermissions(userId);
        if (cached !== undefined) {
          token.permissions = cached;
        } else {
          const staff = await prisma.staff.findUnique({
            where: { userId },
            select: { permissions: true },
          });
          const perms = staff?.permissions ?? [];
          token.permissions = perms;
          setCachedStaffPermissions(userId, perms);
        }
      } else if (token.role === "ADMIN" || token.role === "SUPER_ADMIN") {
        token.permissions = ["ALL"]; // Or use your permission map
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
        (session.user as any).displayName = token.displayName;
        (session.user as any).sessionId = token.sessionId;
        (session.user as any).lastLoginAt = token.lastLoginAt;
        (session.user as any).lastLoginIp = token.lastLoginIp;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
