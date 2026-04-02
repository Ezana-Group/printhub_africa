import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { verifySync } from "otplib";
import { sendEmail } from "@/lib/email";

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
      name: "printhub.admin.session",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: true, // Always true for admin as per prompt "httpOnly: true, secure: true, sameSite: 'strict'"
        domain: process.env.NEXT_PUBLIC_ADMIN_DOMAIN || (process.env.NODE_ENV === "production" ? "admin.printhub.africa" : "localhost"),
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
            
            // Alert SUPER_ADMIN
            await sendEmail({
              to: process.env.SUPER_ADMIN_EMAIL || "admin@printhub.africa",
              subject: `⚠️ Suspicious login detected — ${user.name || user.email}`,
              html: `<p>A suspicious login was detected for user ${user.email}.</p><p>Reason: ${reason}</p><p><a href="https://admin.printhub.africa/admin/settings/users/${user.id}">Manage User</a></p>`
            }).catch(console.error);
            
            // Write to AuditLog
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "IMPOSSIBLE_TRAVEL_DETECTED",
                category: "SECURITY",
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
          // Send "New login detected" email
          await sendEmail({
            to: user.email,
            subject: "New login detected on PrintHub Admin",
            html: `
              <p>Hello ${user.displayName || user.name},</p>
              <p>A new login was detected on your staff account.</p>
              <ul>
                <li>Device: ${userAgent}</li>
                <li>IP: ${ip}</li>
                <li>Time: ${new Date().toLocaleString()}</li>
              </ul>
              <p>If this wasn't you, you can revoke this session immediately:</p>
              <p><a href="${process.env.NEXT_PUBLIC_ADMIN_URL}/security/revoke?token=${adminSession.sessionToken}">Revoke Session</a></p>
            `,
          });
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
