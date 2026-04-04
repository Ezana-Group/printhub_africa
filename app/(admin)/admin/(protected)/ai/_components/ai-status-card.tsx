"use client";

import { useState, useEffect } from "react";

interface ServiceStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  reachable: boolean;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  monthlyStats: { totalCalls: number; successRate: number; totalCostUsd: number };
}

const SERVICE_LABELS: Record<string, { label: string; icon: string }> = {
  claude: { label: "Claude (Anthropic)", icon: "🧠" },
  "openai-gpt4o": { label: "GPT-4o (OpenAI)", icon: "🤖" },
  "openai-gpt4o-mini": { label: "GPT-4o Mini", icon: "⚡" },
  dalle3: { label: "DALL-E 3", icon: "🎨" },
  whisper: { label: "Whisper (OpenAI)", icon: "🎙️" },
  elevenlabs: { label: "ElevenLabs", icon: "🔊" },
  runway: { label: "Runway ML", icon: "🎬" },
  stability: { label: "Stability AI", icon: "🖼️" },
  gemini: { label: "Google Gemini", icon: "💫" },
  perplexity: { label: "Perplexity", icon: "🔍" },
};

function StatusBadge({ status }: { status: "healthy" | "degraded" | "down" }) {
  const config = ({
    healthy: { bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500", label: "Operational" },
    degraded: { bg: "bg-amber-500/10 text-amber-600 border-amber-500/20", dot: "bg-amber-500 animate-pulse", label: "Degraded" },
    down: { bg: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive animate-pulse", label: "Down" },
  } as Record<string, { bg: string; dot: string; label: string }>)[status] || { 
    bg: "bg-muted text-muted-foreground border-muted-foreground/20", 
    dot: "bg-muted-foreground", 
    label: "Unknown" 
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ServiceCard({ serviceKey }: { serviceKey: string }) {
  const [data, setData] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const meta = SERVICE_LABELS[serviceKey];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/ai/service-health/${serviceKey}`, { cache: "no-store" });
        if (res.ok) setData(await res.json());
      } catch {/* silent */} finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [serviceKey]);

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta?.icon}</span>
          <div>
            <p className="text-sm font-semibold leading-tight">{meta?.label ?? serviceKey}</p>
            {loading ? (
              <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1" />
            ) : data ? (
              <StatusBadge status={data.status} />
            ) : (
              <StatusBadge status="down" />
            )}
          </div>
        </div>
        {data && (
          <span className="text-xs text-muted-foreground font-mono">
            ${(data.monthlyStats?.totalCostUsd ?? 0).toFixed(2)}/mo
          </span>
        )}
      </div>

      {data && !loading && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Calls</p>
            <p className="text-sm font-semibold">{data.monthlyStats?.totalCalls ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Success</p>
            <p className="text-sm font-semibold">{data.monthlyStats?.successRate ?? 0}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Failures</p>
            <p className={`text-sm font-semibold ${data.consecutiveFailures >= 3 ? "text-destructive" : ""}`}>
              {data.consecutiveFailures}
            </p>
          </div>
        </div>
      )}

      {data?.lastSuccessAt && (
        <p className="text-xs text-muted-foreground">
          Last OK: {new Date(data.lastSuccessAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
        </p>
      )}
    </div>
  );
}

export function AiStatusDashboard() {
  const services = Object.keys(SERVICE_LABELS);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {services.map((s) => (
        <ServiceCard key={s} serviceKey={s} />
      ))}
    </div>
  );
}
