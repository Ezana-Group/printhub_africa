import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: { select: { name: true } },
        exportToGoogle: true,
        exportToMeta: true,
        exportToTiktok: true,
        exportToLinkedIn: true,
        exportToPinterest: true,
        exportToX: true,
        exportToGoogleBiz: true,
        exportToSnapchat: true,
        exportToYoutube: true,
        exportToInstagramStories: true,
        exportToInstagramReels: true,
        exportToYoutubeShorts: true,
        exportToWhatsappStatus: true,
        exportToWhatsappChannel: true,
        exportToTelegram: true,
        exportToGoogleDiscover: true,
        exportToGoogleMapsPost: true,
        exportToBingPlaces: true,
        exportToAppleMaps: true,
        exportToPigiaMe: true,
        exportToOlxKenya: true,
        exportToReddit: true,
        exportToLinkedInNewsletter: true,
        exportToMedium: true,
        exportToNextdoor: true,
        exportToJiji: true,
        exportToPostiz: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("[social-export-get]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { productId, field, value } = await req.json();
    
    // Validate field name to prevent arbitrary updates
    const validFields = [
        'exportToGoogle', 'exportToMeta', 'exportToTiktok', 'exportToLinkedIn',
        'exportToPinterest', 'exportToX', 'exportToGoogleBiz', 'exportToSnapchat',
        'exportToYoutube', 'exportToInstagramStories', 'exportToInstagramReels',
        'exportToYoutubeShorts', 'exportToWhatsappStatus', 'exportToWhatsappChannel',
        'exportToTelegram', 'exportToGoogleDiscover', 'exportToGoogleMapsPost',
        'exportToBingPlaces', 'exportToAppleMaps', 'exportToPigiaMe',
        'exportToOlxKenya', 'exportToReddit', 'exportToLinkedInNewsletter',
        'exportToMedium', 'exportToNextdoor', 'exportToJiji', 'exportToPostiz'
    ];

    if (!validFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }
    
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { [field]: value }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[social-export-patch]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
