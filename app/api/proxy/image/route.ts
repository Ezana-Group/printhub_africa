import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new NextResponse("URL parameter is required", { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(imageUrl);
    const url = new URL(decodedUrl);

    // Security: Only allow specific domains to prevent being an open proxy
    const allowedDomains = [
      "thingiverse.com",
      "printables.com",
      "myminifactory.com",
      "cults3d.com",
      "creazilla.com",
      "thangs.com",
      "cgtrader.com",
      "makerworld.com",
      "bambulab.com",
      "r2.dev",
      "prusa3d.com" // Printables might use this occasionally
    ];

    if (!allowedDomains.some(domain => url.hostname.endsWith(domain))) {
      return new NextResponse("Domain not allowed", { status: 403 });
    }

    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://www.thingiverse.com/", // Some CDNs check referer
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*", // Allow cross-origin access to our proxy
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
