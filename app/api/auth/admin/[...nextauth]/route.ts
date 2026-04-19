import NextAuth from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { withRateLimit } from "@/lib/rate-limit-wrapper";

const handler = NextAuth(authOptionsAdmin);

export async function GET(req: any, ctx: { params: Promise<any> }) {
  const params = await ctx.params;
  return handler(req, { params });
}

export const POST = withRateLimit(async (req: any, ctx: { params: Promise<any> }) => {
  const params = await ctx.params;
  return handler(req, { params });
}, { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: "auth_admin" });
