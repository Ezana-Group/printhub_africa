"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, MessageSquare } from "lucide-react";
import {
  EMAIL_PLACEHOLDER_CATEGORIES,
  formatPlaceholder,
  type PlaceholderCategory,
  type PlaceholderItem,
} from "@/lib/email-placeholders";

function insertAtCursor(
  el: HTMLTextAreaElement | null,
  text: string,
  setValue: (value: string) => void
) {
  if (!el) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const current = el.value;
  const next = current.slice(0, start) + text + current.slice(end);
  setValue(next);
  setTimeout(() => {
    const pos = start + text.length;
    el.setSelectionRange(pos, pos);
    el.focus();
  }, 0);
}

export function WhatsAppTemplateEditorClient({
  slug,
  name,
  description,
  initialBody,
}: {
  slug: string;
  name: string;
  description: string;
  initialBody: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [placeholderFilter, setPlaceholderFilter] = useState("");
  const [placeholderCategory, setPlaceholderCategory] = useState<PlaceholderCategory | "all">("all");

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertIntoBody = useCallback(
    (text: string) => insertAtCursor(bodyRef.current, text, setBody),
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/whatsapp-templates/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }
      setMessage("saved");
    } catch (e) {
      setMessage("error");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filterLower = placeholderFilter.trim().toLowerCase();
  const categoriesToShow = (placeholderCategory === "all"
    ? (Object.keys(EMAIL_PLACEHOLDER_CATEGORIES) as PlaceholderCategory[])
    : [placeholderCategory]
  ).map((cat) => ({
    ...EMAIL_PLACEHOLDER_CATEGORIES[cat],
    categoryKey: cat,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Left: template form */}
      <div className="flex-1 min-w-0 space-y-6">
        <div>
           <h2 className="text-xl font-bold text-slate-900">{name}</h2>
           {description && (
             <p className="text-sm text-slate-600 mt-1">{description}</p>
           )}
        </div>
        
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="body">Message Body</Label>
            <textarea
              ref={bodyRef}
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi PrintHub, I have a question about {{quoteNumber}}..."
              className="w-full min-h-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
            />
            <p className="text-xs text-slate-500 italic">
              Note: WhatsApp messages don't support HTML. Use *bold*, _italic_, or ~strikethrough~ for formatting.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
            {message === "saved" && <span className="text-sm text-green-600 font-medium">Saved successfully.</span>}
            {message === "error" && <span className="text-sm text-red-600 font-medium">Failed to save.</span>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-green-50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <MessageSquare className="h-5 w-5" />
            <h3>WhatsApp Preview</h3>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 max-w-sm relative">
             <div className="absolute left-0 top-4 -translate-x-full h-0 w-0 border-y-8 border-y-transparent border-r-[12px] border-r-white drop-shadow-[-1px_0_0_rgba(0,0,0,0.05)]"></div>
             <p className="text-sm whitespace-pre-wrap break-words text-slate-800 leading-relaxed font-sans">
                {body || "No message content."}
             </p>
             <div className="text-[10px] text-slate-400 text-right mt-1 uppercase">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </div>
          </div>
          <p className="text-xs text-green-600/80">
            This is an approximate visual preview of how the message will appear in WhatsApp.
          </p>
        </div>
      </div>

      {/* Right: placeholders panel */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sticky top-4 space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Placeholders</h3>
          <p className="text-xs text-slate-500">
            Click a placeholder to insert it at your cursor position.
          </p>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter placeholders..."
              value={placeholderFilter}
              onChange={(e) => setPlaceholderFilter(e.target.value)}
              className="pl-8 h-9 text-sm focus-visible:ring-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select
              value={placeholderCategory}
              onChange={(e) => setPlaceholderCategory(e.target.value as PlaceholderCategory | "all")}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All categories</option>
              {(Object.keys(EMAIL_PLACEHOLDER_CATEGORIES) as PlaceholderCategory[]).map((key) => (
                <option key={key} value={key}>
                  {EMAIL_PLACEHOLDER_CATEGORIES[key].label}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[min(60vh,520px)] overflow-y-auto space-y-4 pr-1">
            {categoriesToShow.map(({ label, placeholders, categoryKey }) => {
              const filtered = filterLower
                ? placeholders.filter(
                    (p) =>
                      p.key.toLowerCase().includes(filterLower) ||
                      p.description.toLowerCase().includes(filterLower)
                  )
                : placeholders;
              if (filtered.length === 0) return null;
              return (
                <div key={categoryKey} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 p-1 rounded">
                    {label}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {filtered.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => insertIntoBody(formatPlaceholder(p.key))}
                        className="rounded bg-slate-100 hover:bg-primary/10 hover:text-primary px-1.5 py-1 font-mono text-[11px] text-slate-600 transition-colors border border-slate-200/50"
                        title={p.description}
                      >
                        {`{{${p.key}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
