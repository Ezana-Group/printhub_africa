import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MarketingContentClient } from "./marketing-content-client";

export const metadata: Metadata = {
  title: "Media & Content Manager - PrintHub Admin",
  description: "Unified dashboard for AI content approval, weekly calendar, and social media exports.",
};

export default async function MarketingContentPage() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role as string)) {
    redirect("/login");
  }

  // Get monday of current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const [
    pendingMockups,
    pendingVideos,
    currentWeekCalendar,
    products,
    categories
  ] = await Promise.all([
    prisma.productMockup.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.productVideo.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { product: { select: { name: true } } },
    }),
    prisma.contentCalendar.findFirst({
      where: { weekStarting: { gte: monday } },
      orderBy: { createdAt: "desc" },
    }),
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

  // Parse calendar
  type CalendarDay = { date: string; posts: { platform: string; content: string; hashtags?: string }[] };
  let calendarDays: CalendarDay[] = [];
  let strategyText = "";

  if (currentWeekCalendar) {
    try {
      const cal = currentWeekCalendar.contentCalendar as { days?: CalendarDay[] };
      calendarDays = cal?.days ?? [];
      const strat = currentWeekCalendar.strategy as { summary?: string };
      strategyText = strat?.summary ?? "";
    } catch {
      calendarDays = [];
    }
  }

  return (
    <MarketingContentClient 
      mockups={pendingMockups.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString()
      }))}
      videos={pendingVideos.map(v => ({
        ...v,
        createdAt: v.createdAt.toISOString()
      }))}
      calendar={{
        weekStarting: monday.toISOString(),
        days: calendarDays,
        strategy: strategyText
      }}
      products={products.map(p => ({
        ...p,
        categoryName: p.category?.name || "Uncategorized"
      }))}
      categories={categories}
    />
  );
}
