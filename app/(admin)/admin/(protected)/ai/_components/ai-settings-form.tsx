"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AiSettings {
  aiRequireApproval: boolean;
  aiAutoMockups: boolean;
  aiAutoVideos: boolean;
  aiVoiceTranscription: boolean;
  aiTelegramBot: boolean;
  aiWeeklyTrendReport: boolean;
  aiMonthlyBusinessReport: boolean;
  aiJijiEnabled: boolean;
  aiCustomerReplyModel: string;
  aiDescriptionModel: string;
  aiImageGenerator: string;
  aiElevenLabsCharUsed: number;
  aiElevenLabsCharLimit: number;
  aiSocialGenerationEnabled: boolean;
  aiAdCopyEnabled: boolean;
  aiQuoteDraftingEnabled: boolean;
  aiSentimentAnalysisEnabled: boolean;
}

interface Props {
  settings: AiSettings;
}

export function AiSettingsForm({ settings }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof AiSettings) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const select = (key: keyof AiSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const ToggleRow = ({
    label,
    description,
    field,
  }: {
    label: string;
    description: string;
    field: keyof AiSettings;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => toggle(field)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          form[field] ? "bg-emerald-500" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${
            form[field] ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  const SelectRow = ({
    label,
    description,
    field,
    options,
  }: {
    label: string;
    description: string;
    field: keyof AiSettings;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <select
        value={form[field] as string}
        onChange={(e) => select(field, e.target.value)}
        className="text-sm border border-border rounded-md px-2 py-1 bg-background"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const charPct = form.aiElevenLabsCharLimit > 0
    ? Math.round((form.aiElevenLabsCharUsed / form.aiElevenLabsCharLimit) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Approval & Auto-generation */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Approval & Automation
        </h3>
        <div className="rounded-lg border p-4 space-y-0">
          <ToggleRow
            label="Require approval before posting"
            description="All AI-generated content must be approved by an admin before publishing"
            field="aiRequireApproval"
          />
          <ToggleRow
            label="Auto-generate mockups on product publish"
            description="Automatically trigger DALL-E 3 + Stability AI when a product goes live"
            field="aiAutoMockups"
          />
          <ToggleRow
            label="Auto-generate videos on product publish"
            description="Automatically trigger Runway + ElevenLabs after mockups are approved"
            field="aiAutoVideos"
          />
        </div>
      </div>

      {/* Feature toggles */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Feature Toggles
        </h3>
        <div className="rounded-lg border p-4 space-y-0">
          <ToggleRow
            label="WhatsApp voice note transcription"
            description="Transcribe incoming voice notes via Whisper before Claude replies"
            field="aiVoiceTranscription"
          />
          <ToggleRow
            label="Telegram bot"
            description="Enable customer-facing Telegram bot (AI-10 workflow)"
            field="aiTelegramBot"
          />
          <ToggleRow
            label="Weekly trend report"
            description="Monday 7AM EAT — Perplexity research → Gemini strategy → Claude content calendar"
            field="aiWeeklyTrendReport"
          />
          <ToggleRow
            label="Monthly business intelligence report"
            description="1st of month 6AM EAT — Gemini analysis → Claude report → PDF to SUPER_ADMIN"
            field="aiMonthlyBusinessReport"
          />
          <ToggleRow
            label="Jiji.co.ke listings"
            description="Auto-post to Jiji when products are published (unofficial API — may break)"
            field="aiJijiEnabled"
          />
        </div>
      </div>

      {/* AI Automation Suite */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-indigo-600 uppercase tracking-wider flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          AI Automation Suite (New)
        </h3>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/10 p-4 space-y-0">
          <ToggleRow
            label="AI Social Media Generation"
            description="Automatic LinkedIn/Twitter/Instagram post drafting for new products"
            field="aiSocialGenerationEnabled"
          />
          <ToggleRow
            label="AI Strategic Ad Copy"
            description="Multi-platform ad variations and promotional headlines"
            field="aiAdCopyEnabled"
          />
          <ToggleRow
            label="AI Intelligent Quote Drafting"
            description="Automatic price estimation and response drafting for new leads"
            field="aiQuoteDraftingEnabled"
          />
          <ToggleRow
            label="AI Sentiment & Priority Analysis"
            description="Analyze customer mood and prioritize urgent support tickets"
            field="aiSentimentAnalysisEnabled"
          />
        </div>
      </div>

      {/* Model selection */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Model Selection
        </h3>
        <div className="rounded-lg border p-4 space-y-0">
          <SelectRow
            label="Customer reply model"
            description="Model used for WhatsApp, email and Telegram replies"
            field="aiCustomerReplyModel"
            options={[
              { value: "claude-opus-4-6", label: "Claude Opus 4.6 (recommended)" },
              { value: "gpt-4o", label: "GPT-4o" },
            ]}
          />
          <SelectRow
            label="Product description model"
            description="Model used for long-form product descriptions"
            field="aiDescriptionModel"
            options={[
              { value: "claude-opus-4-6", label: "Claude Opus 4.6 (recommended)" },
              { value: "gpt-4o", label: "GPT-4o" },
            ]}
          />
          <SelectRow
            label="Image generation"
            description="Which image generators to use for lifestyle mockups"
            field="aiImageGenerator"
            options={[
              { value: "both", label: "Both (DALL-E 3 + Stability AI)" },
              { value: "dalle3", label: "DALL-E 3 only" },
              { value: "stability", label: "Stability AI only" },
            ]}
          />
        </div>
      </div>

      {/* ElevenLabs usage */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          ElevenLabs Character Quota
        </h3>
        <div className="rounded-lg border p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Used this month</span>
            <span className={charPct >= 80 ? "text-destructive font-medium" : "text-foreground"}>
              {form.aiElevenLabsCharUsed.toLocaleString()} / {form.aiElevenLabsCharLimit.toLocaleString()} chars ({charPct}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${charPct >= 80 ? "bg-destructive" : charPct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(charPct, 100)}%` }}
            />
          </div>
          {charPct >= 80 && (
            <p className="text-xs text-destructive mt-2">
              ⚠ At {charPct}% of ElevenLabs limit. Consider upgrading your plan.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save AI Settings"}
      </button>
    </div>
  );
}
