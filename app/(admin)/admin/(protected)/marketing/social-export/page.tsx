import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { FeedStatusCard } from "./feed-status-card";
import { ProductExportTable } from "./product-export-table";
import { SyncFeedsButton } from "./sync-feeds-button";
import { CatalogueFeedLinks } from "./catalogue-feed-links";

export const metadata: Metadata = {
  title: "Social Export - PrintHub Admin",
};

export default async function SocialExportPage() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role as string)) {
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
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Social Media Export</h1>
          <p className="text-muted-foreground">
            Manage your product feeds for Google, Meta, TikTok, and more.
          </p>
        </div>
        <SyncFeedsButton />
      </div>

      <CatalogueFeedLinks />

      <FeedStatusCard />

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Product Export Settings</h2>
            <p className="text-sm text-muted-foreground">
              Toggle which products appear in which social media feeds.
            </p>
          </div>
        </div>

        <ProductExportTable 
          initialProducts={products.map(p => ({
            ...p,
            categoryName: p.category?.name || "Uncategorized"
          }))} 
          categories={categories}
        />
      </div>
    </div>
  );
}
