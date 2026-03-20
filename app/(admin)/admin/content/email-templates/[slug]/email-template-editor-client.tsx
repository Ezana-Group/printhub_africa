"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Send, Loader2, Search, GripVertical } from "lucide-react";
import {
  EMAIL_PLACEHOLDER_CATEGORIES,
  formatPlaceholder,
  type PlaceholderCategory,
  type PlaceholderItem,
} from "@/lib/email-placeholders";
import { SmartTextEditor, type SmartTextEditorHandle } from "@/components/admin/smart-text-editor";

function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
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

export function EmailTemplateEditorClient({
  slug,
  description,
  initialSubject,
  initialBodyHtml,
}: {
  slug: string;
  description: string;
  initialSubject: string;
  initialBodyHtml: string;
}) {
  const [subject, setSubject] = useState(initialSubject);
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testMessage, setTestMessage] = useState<"sent" | "error" | null>(null);
  const [placeholderFilter, setPlaceholderFilter] = useState("");
  const [placeholderCategory, setPlaceholderCategory] = useState<PlaceholderCategory | "all">("all");

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<SmartTextEditorHandle>(null);

  const insertIntoSubject = useCallback(
    (text: string) => insertAtCursor(subjectRef.current, text, setSubject),
    []
  );
  const insertIntoBody = useCallback(
    (text: string) => bodyRef.current?.insertText(text),
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/email-templates/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyHtml }),
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

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewHtml(null);
    try {
      const res = await fetch(`/api/admin/email-templates/${slug}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, bodyHtml }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const data = await res.json();
      setPreviewHtml(data.html);
    } catch {
      setPreviewHtml("<p>Preview failed. Save the template and try again.</p>");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestMessage(null);
    try {
      const res = await fetch(`/api/admin/email-templates/${slug}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testTo.trim() ? { to: testTo.trim() } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setTestMessage("sent");
    } catch (e) {
      setTestMessage("error");
      console.error(e);
    } finally {
      setTestSending(false);
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
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject line</Label>
            <Input
              ref={subjectRef}
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const text = e.dataTransfer.getData("text/plain");
                if (text && /^\{\{\w+\}\}$/.test(text)) insertIntoSubject(text);
              }}
              placeholder="e.g. Order {{orderNumber}} confirmed – {{businessName}}"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyHtml">Body (Visual & HTML)</Label>
            <SmartTextEditor
              ref={bodyRef}
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Write your email content here. Use {{placeholders}} for dynamic data."
              minHeight="400px"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
            <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Preview
            </Button>
            {message === "saved" && <span className="text-sm text-green-600">Saved.</span>}
            {message === "error" && <span className="text-sm text-red-600">Save failed.</span>}
          </div>
        </div>

        {previewHtml !== null && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-sm font-medium text-slate-700">
              Preview (sample data)
            </div>
            <div
              className="p-6 min-h-[200px] prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Send test email</h3>
          <p className="text-sm text-slate-600">
            Sends this template to an address using sample placeholder data. Leave empty to use your account email.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="email"
              placeholder="Optional: recipient email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline" onClick={handleSendTest} disabled={testSending}>
              {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send test
            </Button>
            {testMessage === "sent" && <span className="text-sm text-green-600">Test email sent.</span>}
            {testMessage === "error" && <span className="text-sm text-red-600">Send failed.</span>}
          </div>
        </div>
      </div>

      {/* Right: placeholders panel */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sticky top-4 space-y-4">
          <h3 className="font-semibold text-slate-900">Placeholders</h3>
          <p className="text-xs text-slate-500">
            Drag into subject or body, or click &quot;Subject&quot; / &quot;Body&quot; to insert at cursor.
          </p>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter placeholders..."
              value={placeholderFilter}
              onChange={(e) => setPlaceholderFilter(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select
              value={placeholderCategory}
              onChange={(e) => setPlaceholderCategory(e.target.value as PlaceholderCategory | "all")}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
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
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {label}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {filtered.map((p) => (
                      <PlaceholderChip
                        key={p.key}
                        item={p}
                        onInsertSubject={() => insertIntoSubject(formatPlaceholder(p.key))}
                        onInsertBody={() => insertIntoBody(formatPlaceholder(p.key))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {placeholderFilter.trim() && categoriesToShow.every(({ placeholders }) => {
              const filtered = placeholders.filter(
                (p) =>
                  p.key.toLowerCase().includes(filterLower) ||
                  p.description.toLowerCase().includes(filterLower)
              );
              return filtered.length === 0;
            }) && (
              <p className="text-sm text-slate-500">No placeholders match &quot;{placeholderFilter}&quot;.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderChip({
  item,
  onInsertSubject,
  onInsertBody,
}: {
  item: PlaceholderItem;
  onInsertSubject: () => void;
  onInsertBody: () => void;
}) {
  const text = formatPlaceholder(item.key);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", text);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="group flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 font-mono text-xs"
    >
      <span className="cursor-grab active:cursor-grabbing px-1.5 py-1 text-slate-400" title="Drag to subject or body">
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <span className="py-1 pr-1 text-slate-700" title={item.description}>
        {`{{${item.key}}}`}
      </span>
      <span className="flex items-center border-l border-slate-200">
        <button
          type="button"
          onClick={onInsertSubject}
          className="px-1.5 py-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-r-md text-[10px] font-medium"
          title="Insert into subject"
        >
          Subject
        </button>
        <button
          type="button"
          onClick={onInsertBody}
          className="px-1.5 py-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 text-[10px] font-medium"
          title="Insert into body"
        >
          Body
        </button>
      </span>
    </div>
  );
}
