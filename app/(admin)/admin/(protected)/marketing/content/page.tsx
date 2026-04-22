import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MarketingContentClient } from "./marketing-content-client";

export const metadata: Metadata = {
  title: "Product Social Distribution - PrintHub Admin",
  description: "Manage product visibility in external platforms and shopping feeds.",
};

export default async function MarketingContentPage() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role as string)) {
    redirect("/login");
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
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
        featuredThisWeek: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <MarketingContentClient
      products={products.map(p => ({
        ...p,
        categoryName: p.category?.name || "Uncategorized"
      }))}
      categories={categories}
    />
  );
}
