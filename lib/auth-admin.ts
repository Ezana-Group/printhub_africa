import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { isPrivilegedStaffRole, isStaffWorkEmail } from "@/lib/staff-email";
import crypto from "crypto";
import { verifyAndLogAdminDevice } from "@/lib/admin-device-check";

/** Cache staff permissions by userId with 5 min TTL to avoid DB hit on every request. */
const CACHE_TTL_MS = 5 * 60 * 1000;
const staffPermissionsCache = new Map<
  string,
  { permissions: string[]; expiresAt: number }
>();

function getCachedStaffPermissions(userId: string): string[] | undefined {
  const entry = staffPermissionsCache.get(userId);
  if (!entry || Date.now() > entry.expiresAt) return undefined;
  return entry.permissions;
}

function setCachedStaffPermissions(userId: string, permissions: string[]) {
  staffPermissionsCache.set(userId, {
    permissions,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/** Cache corporate membership by userId with same TTL to avoid DB hit on every request. */
interface CorporateCacheEntry {
  isCorporate: boolean;
  corporateId?: string;
  corporateRole?: string;
  corporateTier?: string;
  expiresAt: number;
}
const corporateCache = new Map<string, CorporateCacheEntry>();

function getCachedCorporate(userId: string): CorporateCacheEntry | undefined {
  const entry = corporateCache.get(userId);
  if (!entry || Date.now() > entry.expiresAt) return undefined;
  return entry;
}

function setCachedCorporate(userId: string, data: Omit<CorporateCacheEntry, "expiresAt">) {
  corporateCache.set(userId, { ...data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Call when corporate membership changes so cache is invalidated. */
export function invalidateCorporateCache(userId: string) {
  corporateCache.delete(userId);
}

/** Call when admin updates staff permissions so cache is invalidated. */
export function invalidateStaffPermissionsCache(userId: string) {
  staffPermissionsCache.delete(userId);
}

export const adminAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.ADMIN_SESSION_MAX_AGE || "28800"), // 8 hours default
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Host-ph-admin" : "ph-admin-dev",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
        token: { label: "2FA token", type: "text" },
      },
      async authorize(credentials, req) {
        const twoFaToken = (credentials?.token ?? "").trim();
        const code = (credentials?.totpCode ?? "").trim();

        const codeDigits = code.replace(/\D/g, "").slice(0, 6);
        if (twoFaToken && codeDigits.length === 6) {
          const { verifyTwoFaToken } = await import("@/lib/twofa-token");
          const userId = verifyTwoFaToken(twoFaToken);
          if (!userId) return null;
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              profileImage: true,
              role: true,
              totpSecret: true,
              twoFaMethod: true,
              otpCodeHash: true,
              otpExpiresAt: true,
              emailVerified: true,
            },
          });
          if (!user) return null;
          if (isPrivilegedStaffRole(user.role) && !isStaffWorkEmail(user.email)) return null;
          if (user.totpSecret) {
            try {
              const result = verifySync({ secret: user.totpSecret, token: code });
              if (!result.valid) return null;
            } catch {
              return null;
            }
          } else if (user.otpCodeHash && user.otpExpiresAt && user.otpExpiresAt >= new Date()) {
            if (!(await bcrypt.compare(codeDigits, user.otpCodeHash))) return null;
            await prisma.user.update({
              where: { id: user.id },
              data: { otpCodeHash: null, otpExpiresAt: null },
            });
          } else {
            return null;
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
              image: user.profileImage ?? undefined,
              role: user.role,
              emailVerified: !!user.emailVerified,
            };
        }

        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            profileImage: true,
            role: true,
            passwordHash: true,
            status: true,
            adminLockedUntil: true,
            adminFailedLoginCount: true,
            adminTwoFactorEnabled: true,
            adminTwoFactorGraceEndsAt: true,
          },
        });
        if (!user?.passwordHash) return null;
        if (user.status === "DEACTIVATED") return null;
        if (user.role === "CUSTOMER") throw new Error("customer-account");

        if (user.adminLockedUntil && user.adminLockedUntil > new Date()) {
          throw new Error("account-locked");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          const attempts = (user.adminFailedLoginCount ?? 0) + 1;
          const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              adminFailedLoginCount: attempts,
              adminLockedUntil: lockedUntil,
            },
          });
          return null;
        }

        // Handle 2FA checking here loosely for NextAuth structure, the detailed
        // checks happen on login page redirect logic
        let mustSetup2FA = false;
        
        if (!user.adminTwoFactorEnabled) {
          if (!user.adminTwoFactorGraceEndsAt) {
            mustSetup2FA = true;
          } else if (user.adminTwoFactorGraceEndsAt < new Date()) {
             // Grace period expired, need to enforce setup via front-end
             mustSetup2FA = true;
          } else {
             // Still in grace period
             mustSetup2FA = true;
          }
        }
        
        const newSessionId = crypto.randomUUID();

        // Log device & verify location (Mocking a NextRequest object using NextAuth req headers)
        const mockReq = { 
           headers: { 
              get: (key: string) => req.headers?.[key] || null 
           } 
        } as unknown;
        
        await verifyAndLogAdminDevice(user.id, mockReq as Request, true);

        await prisma.user.update({
          where: { id: user.id },
          data: { 
             adminFailedLoginCount: 0, 
             adminLockedUntil: null,
             adminLastLoginAt: new Date(),
             adminLastLoginIP: (mockReq as { headers: { get: (name: string) => string | null } }).headers.get("x-real-ip") || "Unknown",
             adminActiveSessionId: newSessionId // This invalidates any other active session
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.profileImage ?? undefined,
          role: user.role,
          mustSetup2FA,
          sessionId: newSessionId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, status: true, adminLockedUntil: true },
      });

      if (!dbUser) return false;
      if (dbUser.status === "DEACTIVATED") return false;
      if (dbUser.role === "CUSTOMER") return "/admin/login?error=customer-account";
      if (dbUser.adminLockedUntil && dbUser.adminLockedUntil > new Date()) return "/admin/login?error=account-locked";

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.displayName !== undefined) token.displayName = session.displayName;
      }
      if (user) {
        token.id = user.id;
        const dbU = user as { role?: string; displayName?: string; name?: string; mustSetup2FA?: boolean; sessionId?: string };
        token.role = dbU.role ?? "CUSTOMER";
        token.displayName = dbU.displayName;
        token.name = dbU.name;
        token.mustSetup2FA = dbU.mustSetup2FA;
        token.sessionId = dbU.sessionId;
      }

      // Refresh data from DB to ensure session invalidation and force logout logic works correctly
      if (token.id) {
        const adminData = await prisma.user.findUnique({
           where: { id: token.id as string },
           select: { adminForceLogoutAt: true, adminActiveSessionId: true }
        });
        
        if (adminData?.adminForceLogoutAt && (token.iat as number) * 1000 < (adminData.adminForceLogoutAt as Date).getTime()) {
           // Token issued before force logout
           token.error = "SessionInvalidated";
        }
        
        // Concurrent session control - Check if this token's sessionId matches adminActiveSessionId
        if (token.sessionId && adminData?.adminActiveSessionId && token.sessionId !== adminData.adminActiveSessionId) {
             token.error = "SessionInvalidated";
        }
      }

      // STAFF: use cached permissions (5 min TTL) to avoid DB on every request; invalidate via invalidateStaffPermissionsCache when admin changes permissions
      const role = token.role as string;
      if (role === "STAFF" && token.id) {
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
      } else if (role !== "STAFF") {
        token.permissions = undefined; // ADMIN/SUPER_ADMIN have full access
      }
      return token;
    },
    async session({ session, token }) {
      if (token.error === "SessionInvalidated") return session; // Return unmodified session if invalidated, layout handles redirect
      
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { permissions?: string[] }).permissions = token.permissions as string[] | undefined;
        (session.user as { displayName?: string | null }).displayName = token.displayName as string | null | undefined;
        (session.user as { mustSetup2FA?: boolean }).mustSetup2FA = token.mustSetup2FA as boolean | undefined;
        (session.user as { sessionId?: string }).sessionId = token.sessionId as string | undefined;
        session.user.name = token.name as string | null | undefined;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (!url || url.startsWith("/")) return url ? `${baseUrl}${url}` : baseUrl;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },
  },
  secret: process.env.ADMIN_NEXTAUTH_SECRET,
};
