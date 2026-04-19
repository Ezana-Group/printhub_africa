import NextAuth from "next-auth";
import { authOptionsCustomer } from "@/lib/auth-customer";

const handler = NextAuth(authOptionsCustomer);

export async function GET(req: any, ctx: { params: Promise<any> }) {
  const params = await ctx.params;
  return handler(req, { params });
}

export async function POST(req: any, ctx: { params: Promise<any> }) {
  const params = await ctx.params;
  return handler(req, { params });
}
