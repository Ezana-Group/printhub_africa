import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptionsAdmin } from "@/lib/auth-admin";
import { prisma } from "@/lib/prisma";

const SERVICE_PRICING = {
  claude: { inputPer1k: 0.015, outputPer1k: 0.075 },
  "openai-gpt4o": { inputPer1k: 0.0025, outputPer1k: 0.01 },
  "openai-gpt4o-mini": { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  dalle3: { perImage: 0.04 },
  whisper: { perMinute: 0.006 },
  elevenlabs: { perChar: 0.00003 },
  runway: { per5sec: 0.5 },
  stability: { perImage: 0.008 },
  gemini: { inputPer1k: 0.00125, outputPer1k: 0.005 },
  perplexity: { inputPer1k: 0.001, outputPer1k: 0.001 },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const session = await getServerSession(authOptionsAdmin);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { service } = await params;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const logs = await prisma.aiServiceLog.findMany({
      where: { service, createdAt: { gte: startOfMonth } },
      orderBy: { createdAt: "desc" },
    });

    const lastSuccess = logs.find((l) => l.success);
    const recentFailures = logs
      .filter((l) => !l.success)
      .slice(0, 3)
      .length;

    const consecutiveFailures =
      logs.length > 0 && !logs[0].success
        ? logs.findIndex((l) => l.success) === -1
          ? Math.min(recentFailures, 3)
          : logs.findIndex((l) => l.success)
        : 0;

    const totalCostUsd = logs.reduce((s, l) => s + (l.costUsd ?? 0), 0);
    const totalCalls = logs.length;
    const successRate = totalCalls > 0 ? Math.round((logs.filter((l) => l.success).length / totalCalls) * 100) : 100;

    const status: "healthy" | "degraded" | "down" =
      consecutiveFailures >= 3 ? "down" :
      consecutiveFailures >= 1 ? "degraded" : "healthy";

    // Attempt a lightweight ping to verify the service is reachable
    let reachable = true;
    try {
      if (service === "claude") {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({ model: "claude-opus-4-6", max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
          signal: AbortSignal.timeout(5000),
        });
        reachable = r.status !== 401 && r.status !== 403;
      } else if (service === "openai-gpt4o" || service === "openai-gpt4o-mini" || service === "dalle3" || service === "whisper") {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}` },
          signal: AbortSignal.timeout(5000),
        });
        reachable = r.ok;
      } else if (service === "elevenlabs") {
        const r = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
          signal: AbortSignal.timeout(5000),
        });
        reachable = r.ok;
      } else if (service === "gemini") {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY ?? ""}`,
          { signal: AbortSignal.timeout(5000) }
        );
        reachable = r.ok;
      } else if (service === "perplexity") {
        const r = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY ?? ""}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "llama-3.1-sonar-large-128k-online", messages: [{ role: "user", content: "ping" }] }),
          signal: AbortSignal.timeout(5000),
        });
        reachable = r.status !== 401;
      } else if (service === "runway") {
        const r = await fetch("https://api.dev.runwayml.com/v1/tasks", {
          headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY ?? ""}` },
          signal: AbortSignal.timeout(5000),
        });
        reachable = r.status !== 401;
      } else if (service === "stability") {
        const r = await fetch("https://api.stability.ai/v1/user/account", {
          headers: { Authorization: `Bearer ${process.env.STABILITY_API_KEY ?? ""}` },
          signal: AbortSignal.timeout(5000),
        });
        reachable = r.ok;
      }
    } catch {
      reachable = false;
    }

    const pricing = SERVICE_PRICING[service as keyof typeof SERVICE_PRICING];

    return NextResponse.json({
      service,
      status: reachable ? status : "down",
      reachable,
      lastSuccessAt: lastSuccess?.createdAt ?? null,
      consecutiveFailures,
      monthlyStats: {
        totalCalls,
        successRate,
        totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      },
      pricing,
    });
  } catch (err) {
    console.error("[service-health]", err);
    return NextResponse.json({ service, status: "down", error: "Check failed" }, { status: 500 });
  }
}
