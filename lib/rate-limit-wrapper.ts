import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitClientIp } from "./rate-limit";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { authOptions } from "@/lib/auth"; // fallback if needed

type RouteHandler = (req: any, context?: any) => Promise<NextResponse | Response> | NextResponse | Response;

export function withRateLimit(
  handler: RouteHandler,
  options: { limit: number; windowMs: number; keyPrefix: string; byUserId?: boolean }
) {
  return async (req: any, context?: any) => {
    let identifier = getRateLimitClientIp(req) || "unknown";
    
    if (options.byUserId) {
      const session = await getServerSession(authOptionsAdmin);
      if (session?.user?.id) {
        identifier = session.user.id as string;
      }
    }

    const key = `${options.keyPrefix}:${identifier}`;
    const { success, remaining, resetAt } = await rateLimit(key, { limit: options.limit, windowMs: options.windowMs });
    
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many requests", retryAfter, resetAt: resetAt.toISOString() },
        { 
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          }
        }
      );
    }
    
    return handler(req, context);
  };
}
