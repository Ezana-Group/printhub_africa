import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { sendEmail } from "@/lib/email";
import { isPrivilegedStaffRole, isStaffWorkEmail } from "@/lib/staff-email";

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

const fromEmail = process.env.FROM_EMAIL ?? "PrintHub <hello@printhub.africa>";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? [
          AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
          }),
        ]
      : []),
    EmailProvider({
      from: fromEmail,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await sendEmail({
          to: email,
          subject: "Sign in to PrintHub",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h1 style="color: #FF4D00;">PrintHub</h1>
              <p>Click the link below to sign in to your account:</p>
              <p><a href="${url}" style="color: #FF4D00; font-weight: bold;">Sign in to PrintHub</a></p>
              <p>Or copy this link: ${url}</p>
              <p>This link expires in 24 hours. If you didn't request it, ignore this email.</p>
              <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya</p>
            </div>
          `,
        });
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
        token: { label: "2FA token", type: "text" },
      },
      async authorize(credentials) {
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
            lockedUntil: true,
            failedLoginAttempts: true,
            totpSecret: true,
            twoFaMethod: true,
            otpCodeHash: true,
            otpExpiresAt: true,
            emailVerified: true,
          },
        });
        if (!user?.passwordHash) return null;
        if (user.status === "DEACTIVATED") return null;
        if (user.status === "INVITE_PENDING") return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account locked. Try again after 15 minutes.");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          const attempts = (user.failedLoginAttempts ?? 0) + 1;
          const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil,
            },
          });
          return null;
        }

        if (isPrivilegedStaffRole(user.role) && !isStaffWorkEmail(normalizedEmail)) {
          return null;
        }

        const method = user.twoFaMethod ?? (user.totpSecret ? "totp" : null);
        const totpCode = (credentials.totpCode ?? "").trim();

        if (method === "totp" && user.totpSecret) {
          const totpDigits = (totpCode ?? "").replace(/\D/g, "").slice(0, 6);
          if (!totpDigits || totpDigits.length !== 6) throw new Error("2FA_REQUIRED");
          try {
            const result = verifySync({ secret: user.totpSecret, token: totpCode });
            if (!result.valid) return null;
          } catch {
            return null;
          }
        } else if (method === "email") {
          if (!totpCode || totpCode.length !== 6) {
            const { randomInt } = await import("crypto");
            const sixDigit = String(randomInt(100000, 1000000)); // CSPRNG — never use Math.random() for OTPs
            const hash = await bcrypt.hash(sixDigit, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await prisma.user.update({
              where: { id: user.id },
              data: { otpCodeHash: hash, otpExpiresAt: expiresAt },
            });
            await sendEmail({
              to: user.email,
              subject: "Your PrintHub sign-in code",
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h1 style="color: #FF4D00;">PrintHub</h1>
                  <p>Your sign-in code is: <strong>${sixDigit}</strong></p>
                  <p>It expires in 10 minutes. If you didn't request this, ignore this email.</p>
                  <p style="color: #6B6B6B; font-size: 12px;">PrintHub · Nairobi, Kenya</p>
                </div>
              `,
            });
            throw new Error("2FA_REQUIRED");
          }
          if (!user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) return null;
          if (!(await bcrypt.compare(totpCode, user.otpCodeHash))) return null;
          await prisma.user.update({
            where: { id: user.id },
            data: { otpCodeHash: null, otpExpiresAt: null },
          });
        } else if (method === "sms") {
          if (!totpCode || totpCode.length !== 6) {
            const { randomInt } = await import("crypto");
            const sixDigit = String(randomInt(100000, 1000000)); // CSPRNG — never use Math.random() for OTPs
            const hash = await bcrypt.hash(sixDigit, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await prisma.user.update({
              where: { id: user.id },
              data: { otpCodeHash: hash, otpExpiresAt: expiresAt },
            });
            const phone = user.phone?.replace(/\D/g, "");
            if (phone) {
              try {
                const { sendSms } = await import("@/lib/sms");
                await sendSms({
                  to: phone.startsWith("+") ? phone : `+${phone}`,
                  body: `Your PrintHub sign-in code is ${sixDigit}. Expires in 10 minutes.`,
                });
              } catch (err) {
                console.error("SMS 2FA send error:", err);
              }
            }
            throw new Error("2FA_REQUIRED");
          }
          if (!user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) return null;
          if (!(await bcrypt.compare(totpCode, user.otpCodeHash))) return null;
          await prisma.user.update({
            where: { id: user.id },
            data: { otpCodeHash: null, otpExpiresAt: null },
          });
        } else if (user.totpSecret) {
          const totpDigits = (totpCode ?? "").replace(/\D/g, "").slice(0, 6);
          if (!totpDigits || totpDigits.length !== 6) throw new Error("2FA_REQUIRED");
          try {
            const result = verifySync({ secret: user.totpSecret, token: totpCode });
            if (!result.valid) return null;
          } catch {
            return null;
          }
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
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, status: true },
      });

      // Do not allow inactive/invite-pending accounts to sign in via OAuth/email.
      if (dbUser && (dbUser.status === "DEACTIVATED" || dbUser.status === "INVITE_PENDING")) {
        return false;
      }

      if (
        dbUser &&
        isPrivilegedStaffRole(dbUser.role) &&
        !isStaffWorkEmail(email)
      ) {
        return false;
      }

      const isSocialOAuth =
        account?.type === "oauth" &&
        (account.provider === "google" ||
          account.provider === "facebook" ||
          account.provider === "apple");

      // Security hardening: privileged accounts must not be auto-linked by email on social sign-in.
      // Allow only when this exact OAuth account is already linked to the same user.
      if (
        isSocialOAuth &&
        dbUser &&
        (dbUser.role === "STAFF" || dbUser.role === "ADMIN" || dbUser.role === "SUPER_ADMIN")
      ) {
        const linked = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          select: { userId: true },
        });

        if (!linked || linked.userId !== dbUser.id) {
          await writeAudit({
            userId: dbUser.id,
            action: "SOCIAL_SIGNIN_BLOCKED_FOR_PRIVILEGED_ACCOUNT",
            entity: "AUTH",
            entityId: dbUser.id,
            after: {
              reason: "UNLINKED_SOCIAL_PROVIDER_FOR_PRIVILEGED_ACCOUNT",
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              email,
              role: dbUser.role,
            },
          });
          return "/login?error=SocialAdminDisabled";
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.emailVerified !== undefined) token.emailVerified = session.emailVerified;
        if (session.name !== undefined) token.name = session.name;
        if (session.displayName !== undefined) token.displayName = session.displayName;
        if (session.phone !== undefined) token.phone = session.phone;
      }
      if (user) {
        token.id = user.id;
        const dbU = user as { role?: string; emailVerified?: Date | boolean; displayName?: string; phone?: string; name?: string };
        token.role = dbU.role ?? "CUSTOMER";
        token.emailVerified = !!dbU.emailVerified;
        token.displayName = dbU.displayName;
        token.phone = dbU.phone;
        token.name = dbU.name;
      }
      // Corporate: add corporate membership to token for approved accounts (cached, 5 min TTL)
      const userId = token.id as string;
      if (userId) {
        const cached = getCachedCorporate(userId);
        if (cached) {
          token.isCorporate = cached.isCorporate;
          token.corporateId = cached.corporateId;
          token.corporateRole = cached.corporateRole;
          token.corporateTier = cached.corporateTier;
        } else {
          const membership = await prisma.corporateTeamMember.findFirst({
            where: { userId, isActive: true },
            include: { corporate: { select: { id: true, status: true, tier: true } } },
          });
          if (membership?.corporate?.status === "APPROVED") {
            token.isCorporate = true;
            token.corporateId = membership.corporateId;
            token.corporateRole = membership.role;
            token.corporateTier = membership.corporate.tier;
            setCachedCorporate(userId, {
              isCorporate: true,
              corporateId: membership.corporateId,
              corporateRole: membership.role,
              corporateTier: membership.corporate.tier,
            });
          } else {
            token.isCorporate = false;
            token.corporateId = undefined;
            token.corporateRole = undefined;
            token.corporateTier = undefined;
            setCachedCorporate(userId, { isCorporate: false });
          }
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
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { permissions?: string[] }).permissions = token.permissions as string[] | undefined;
        (session.user as { isCorporate?: boolean }).isCorporate = token.isCorporate as boolean | undefined;
        (session.user as { corporateId?: string }).corporateId = token.corporateId as string | undefined;
        (session.user as { corporateRole?: string }).corporateRole = token.corporateRole as string | undefined;
        (session.user as { corporateTier?: string }).corporateTier = token.corporateTier as string | undefined;
        (session.user as { emailVerified?: boolean }).emailVerified = token.emailVerified as boolean | undefined;
        (session.user as { displayName?: string | null }).displayName = token.displayName as string | null | undefined;
        (session.user as { phone?: string | null }).phone = token.phone as string | null | undefined;
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
  secret: process.env.NEXTAUTH_SECRET,
};
