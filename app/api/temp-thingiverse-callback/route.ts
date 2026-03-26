import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "No code received" }, { status: 400 });
    }

    // Exchange code for access token
    const res = await fetch("https://www.thingiverse.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.THINGIVERSE_CLIENT_ID!,
            client_secret: process.env.THINGIVERSE_CLIENT_SECRET!,
            code,
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/temp-thingiverse-callback`,
        }),
    });

    const text = await res.text();
    return NextResponse.json({ raw: text });
}