import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Cache corporate membership by userId with 5 min TTL
const CACHE_TTL_MS = 5 * 60 * 1000;
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

export const authOptionsCustomer: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Default 30 days, will be refined if BusinessSettings are accessible
  },
  cookies: {
    sessionToken: {
      name: "printhub.customer.session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || (process.env.NODE_ENV === "production" ? ".printhub.africa" : "localhost"),
      },
    },
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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: { 
            id: true, 
            email: true, 
            passwordHash: true, 
            role: true, 
            status: true,
            emailVerified: true,
            displayName: true,
            phone: true
          },
        });

        if (!user || !user.passwordHash || user.status === "DEACTIVATED") return null;
        
        // STAFF/ADMIN/SUPER_ADMIN check
        if (["STAFF", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
          throw new Error("Staff accounts must log in at admin.printhub.africa");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          emailVerified: !!user.emailVerified,
          displayName: user.displayName,
          phone: user.phone
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { role: true, status: true, id: true },
      });

      if (dbUser && (dbUser.status === "DEACTIVATED" || dbUser.status === "INVITE_PENDING")) {
        return false;
      }

      if (dbUser && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(dbUser.role)) {
        // For OAuth or any other sign-in method
        throw new Error("Staff accounts must log in at admin.printhub.africa");
      }

      // Security hardening: check unlinked social provider for privileged accounts (redundant here but safe)
      if (account?.type === "oauth" && dbUser && ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(dbUser.role)) {
        return false;
      }

      return true;
    },
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

      console.warn(`[Security] Blocked open redirect attempt to: ${url}`);
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.emailVerified !== undefined) token.emailVerified = session.emailVerified;
        if (session.displayName !== undefined) token.displayName = session.displayName;
        if (session.phone !== undefined) token.phone = session.phone;
      }

      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.emailVerified = (user as any).emailVerified;
        token.displayName = (user as any).displayName;
        token.phone = (user as any).phone;
      }

      // Corporate logic (copied from unified auth.ts)
      const userId = token.id as string;
      if (userId) {
        const cached = getCachedCorporate(userId);
        if (cached) {
          token.isCorporate = cached.isCorporate;
          token.corporateId = cached.corporateId;
        } else {
          const membership = await prisma.corporateTeamMember.findFirst({
            where: { userId, isActive: true },
            include: { corporate: { select: { id: true, status: true, tier: true } } },
          });
          if (membership?.corporate?.status === "APPROVED") {
            token.isCorporate = true;
            token.corporateId = membership.corporateId;
            setCachedCorporate(userId, {
              isCorporate: true,
              corporateId: membership.corporateId,
              corporateRole: membership.role,
              corporateTier: membership.corporate.tier,
            });
          } else {
            token.isCorporate = false;
            token.corporateId = undefined;
            setCachedCorporate(userId, { isCorporate: false });
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).displayName = token.displayName;
        (session.user as any).phone = token.phone;
        (session.user as any).isCorporate = token.isCorporate;
        (session.user as any).corporateId = token.corporateId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
