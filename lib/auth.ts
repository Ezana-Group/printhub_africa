import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const role = (user as { role?: string }).role ?? "CUSTOMER";
        token.role = role;
      }
      // AUDIT FIX: Always fetch fresh staff permissions from DB for STAFF so session is never stale after admin changes
      const role = token.role as string;
      if (role === "STAFF" && token.id) {
        const staff = await prisma.staff.findUnique({
          where: { userId: token.id as string },
          select: { permissions: true },
        });
        token.permissions = staff?.permissions ?? [];
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
