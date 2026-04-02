import NextAuth from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { withRateLimit } from "@/lib/rate-limit-wrapper";

const handler = NextAuth(authOptionsAdmin);
export { handler as GET };
export const POST = withRateLimit(handler as any, { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: "auth_admin" });
