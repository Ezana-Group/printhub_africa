export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { redirect } from "next/navigation";
import { canAccessRoute } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { AiStatusDashboard } from "./_components/ai-status-card";
import { AiSettingsForm } from "./_components/ai-settings-form";
import { AiCostChart } from "./_components/ai-cost-chart";
import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";

export const metadata = {
  title: "AI Control Centre | PrintHub Admin",
  description: "Monitor and control all AI services powering PrintHub Africa automation.",
};

export default async function AiControlCentrePage() {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "";
  const permissions = (session.user as { permissions?: string[] }).permissions;

  if (!canAccessRoute("/admin/ai", role, permissions ?? [])) {
    redirect("/admin/access-denied");
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get monday of current week
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(monday.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const [
      pendingMockups,
      pendingVideos,
      currentWeekCalendar,
      businessSettings,
      monthlyAiLogs,
    ] = await Promise.all([
      prisma.productMockup.findMany({
        where: { status: "PENDING_REVIEW" },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { product: { select: { name: true, slug: true } } },
      }),
      prisma.productVideo.findMany({
        where: { status: "PENDING_REVIEW" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { product: { select: { name: true } } },
      }),
      prisma.contentCalendar.findFirst({
        where: { weekStarting: { gte: monday } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.businessSettings.findFirst({
        select: {
          aiRequireApproval: true,
          aiAutoMockups: true,
          aiAutoVideos: true,
          aiVoiceTranscription: true,
          aiTelegramBot: true,
          aiWeeklyTrendReport: true,
          aiMonthlyBusinessReport: true,
          aiJijiEnabled: true,
          aiCustomerReplyModel: true,
          aiDescriptionModel: true,
          aiImageGenerator: true,
          aiElevenLabsCharUsed: true,
          aiElevenLabsCharLimit: true,
          aiSocialGenerationEnabled: true,
          aiAdCopyEnabled: true,
          aiQuoteDraftingEnabled: true,
          aiSentimentAnalysisEnabled: true,
        },
      }),
      prisma.aiServiceLog.groupBy({
        by: ["service"],
        where: { createdAt: { gte: startOfMonth } },
        _sum: { costUsd: true },
      }),
    ]);

    const costData = monthlyAiLogs.map((l) => ({
      service: l.service.toLowerCase(),
      costUsd: Number(l._sum.costUsd ?? 0),
      label: l.service,
    }));
    const totalCostUsd = costData.reduce((s, d) => s + d.costUsd, 0);

    // Parse current week calendar content
    type CalendarDay = { date: string; posts: { platform: string; content: string; hashtags?: string }[] };
    let calendarDays: CalendarDay[] = [];
    let strategyText = "";

    if (currentWeekCalendar) {
      try {
        const cal = currentWeekCalendar.contentCalendar as { days?: CalendarDay[] };
        calendarDays = cal?.days ?? [];
        const strat = currentWeekCalendar.strategy as { summary?: string };
        strategyText = strat?.summary ?? JSON.stringify(currentWeekCalendar.strategy).slice(0, 500);
      } catch {
        calendarDays = [];
      }
    }

    const defaultSettings = {
      aiRequireApproval: businessSettings?.aiRequireApproval ?? true,
      aiAutoMockups: businessSettings?.aiAutoMockups ?? false,
      aiAutoVideos: businessSettings?.aiAutoVideos ?? false,
      aiVoiceTranscription: businessSettings?.aiVoiceTranscription ?? true,
      aiTelegramBot: businessSettings?.aiTelegramBot ?? false,
      aiWeeklyTrendReport: businessSettings?.aiWeeklyTrendReport ?? true,
      aiMonthlyBusinessReport: businessSettings?.aiMonthlyBusinessReport ?? true,
      aiJijiEnabled: businessSettings?.aiJijiEnabled ?? false,
      aiCustomerReplyModel: businessSettings?.aiCustomerReplyModel ?? "claude-opus-4-6",
      aiDescriptionModel: businessSettings?.aiDescriptionModel ?? "claude-opus-4-6",
      aiImageGenerator: businessSettings?.aiImageGenerator ?? "both",
      aiElevenLabsCharUsed: businessSettings?.aiElevenLabsCharUsed ?? 0,
      aiElevenLabsCharLimit: businessSettings?.aiElevenLabsCharLimit ?? 10000,
      aiSocialGenerationEnabled: businessSettings?.aiSocialGenerationEnabled ?? true,
      aiAdCopyEnabled: businessSettings?.aiAdCopyEnabled ?? true,
      aiQuoteDraftingEnabled: businessSettings?.aiQuoteDraftingEnabled ?? true,
      aiSentimentAnalysisEnabled: businessSettings?.aiSentimentAnalysisEnabled ?? true,
    };

    return (
      <div className="p-6 space-y-10 max-w-screen-xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="font-display text-2xl font-bold italic text-slate-800">AI Control Centre</h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor infrastructure health, configure core AI logic, and track computational costs.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/admin/ai/workflows"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm shadow-sm hover:scale-[1.02] transition-all"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              Monitor AI Workflows
            </Link>
            <Link 
              href="/admin/marketing/content"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:scale-[1.02] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Manage AI Generated Content
            </Link>
          </div>
        </div>

        <section className="mt-8">
          <AiStatusDashboard />
        </section>

        {/* ── Section 2: AI Settings ───────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg font-semibold">AI Logic & Settings</h2>
              <p className="text-xs text-muted-foreground">
                Control which AI features are active and select the preferred models for production.
              </p>
            </div>
          </div>
          <AiSettingsForm settings={defaultSettings} />
        </section>

        {/* ── Section 3: Usage & Cost Tracker ──────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h2 className="text-lg font-semibold">Usage &amp; Cost Tracker</h2>
              <p className="text-xs text-muted-foreground">
                Monthly compute spend by service, including OpenAI, Anthropic, and ElevenLabs.
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <AiCostChart data={costData} totalUsd={totalCostUsd} />
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error("[AiControlCentre] Server Component Render Error:", error);
    return (
      <div className="p-12 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 italic">AI Control Centre Offline</h1>
        <p className="text-slate-600 max-w-md mx-auto">
          We encountered an error while loading the AI infrastructure dashboard. This could be due to a temporary database connection issue.
        </p>
        <div className="max-w-2xl mx-auto p-4 bg-slate-50 border rounded-lg text-left overflow-auto">
          <p className="text-xs font-mono text-slate-500 whitespace-pre-wrap">
            {error instanceof Error ? error.message : "An unknown error occurred during server-side rendering."}
          </p>
        </div>
        <Link 
          href="/admin/dashboard"
          className="inline-block px-6 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }
}

