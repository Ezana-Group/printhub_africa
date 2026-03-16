import { NextResponse } from "next/server";

/**
 * GET /api/auth/providers — Which OAuth providers are configured (server env only).
 * Used by login/register to show Google/Facebook/Apple buttons without needing NEXT_PUBLIC_* for each.
 */
export async function GET() {
  const google =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const facebook =
    !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET;
  const apple =
    !!process.env.APPLE_CLIENT_ID && !!process.env.APPLE_CLIENT_SECRET;

  return NextResponse.json({
    google,
    facebook,
    apple,
  });
}
