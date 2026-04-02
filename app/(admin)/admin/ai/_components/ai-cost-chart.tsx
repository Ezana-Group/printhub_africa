"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ServiceCost {
  service: string;
  costUsd: number;
  label: string;
}

interface Props {
  data: ServiceCost[];
  totalUsd: number;
}

const SERVICE_COLORS: Record<string, string> = {
  claude: "#d97706",
  "openai-gpt4o": "#10b981",
  "openai-gpt4o-mini": "#34d399",
  dalle3: "#6366f1",
  whisper: "#8b5cf6",
  elevenlabs: "#f43f5e",
  runway: "#0ea5e9",
  stability: "#ec4899",
  gemini: "#3b82f6",
  perplexity: "#14b8a6",
};

const SERVICE_LABELS: Record<string, string> = {
  claude: "Claude",
  "openai-gpt4o": "GPT-4o",
  "openai-gpt4o-mini": "GPT-4o Mini",
  dalle3: "DALL-E 3",
  whisper: "Whisper",
  elevenlabs: "ElevenLabs",
  runway: "Runway",
  stability: "Stability AI",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover shadow-md px-3 py-2 text-sm">
      <p className="font-medium">{SERVICE_LABELS[label ?? ""] ?? label}</p>
      <p className="text-muted-foreground">${(payload[0].value ?? 0).toFixed(4)}</p>
    </div>
  );
}

export function AiCostChart({ data, totalUsd }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No AI usage recorded this month yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">Total this month</p>
        <p className="text-2xl font-bold text-foreground">${totalUsd.toFixed(2)}</p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="service"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => SERVICE_LABELS[v] ?? v}
          />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="costUsd" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.service} fill={SERVICE_COLORS[entry.service] ?? "#6b7280"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {data.map((d) => (
          <div key={d.service} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: SERVICE_COLORS[d.service] ?? "#6b7280" }}
            />
            <span className="text-muted-foreground truncate">{SERVICE_LABELS[d.service] ?? d.service}</span>
            <span className="font-mono font-medium ml-auto">${d.costUsd.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
