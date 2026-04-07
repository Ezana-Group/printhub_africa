"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0">
      {/* Left: template form */}
      <div className="flex-1 min-w-0 space-y-6">
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
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
              className="font-mono text-sm h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bodyHtml">Body (Visual & HTML)</Label>
            <SmartTextEditor
              ref={bodyRef}
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Write your email content here. Use {{placeholders}} for dynamic data."
              minHeight="450px"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
            <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            {message === "saved" && <span className="text-sm text-green-600 font-medium">Saved.</span>}
            {message === "error" && <span className="text-sm text-red-600 font-medium">Save failed.</span>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-500" /> Send test email
          </h3>
          <p className="text-sm text-slate-600">
            Sends this template to an address using sample placeholder data. Leave empty to use your account email.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="email"
              placeholder="Optional: recipient email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              className="max-w-xs h-10"
            />
            <Button variant="outline" onClick={handleSendTest} disabled={testSending}>
              {testSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send test
            </Button>
            {testMessage === "sent" && <span className="text-sm text-green-600 font-medium">Test email sent.</span>}
            {testMessage === "error" && <span className="text-sm text-red-600 font-medium">Send failed.</span>}
          </div>
        </div>
      </div>

      {/* Right: placeholders & preview panel */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6">
        {/* Live Preview Window */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-4">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Eye className="h-3 w-3 text-blue-500" /> Live Preview
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePreview} 
              disabled={previewLoading}
              className="h-7 px-2 text-[10px] font-bold uppercase hover:bg-white transition-colors"
            >
              {previewLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              Refresh
            </Button>
          </div>
          <div className="bg-[#f8fafc] min-h-[350px] max-h-[500px] overflow-y-auto custom-scrollbar p-0">
            {previewHtml ? (
              <div
                className="bg-white shadow-sm prose prose-sm max-w-none origin-top scale-[0.9] w-[111%] -mb-[10%]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-center space-y-3 px-6">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <Eye className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">No Preview Loaded</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Click refresh to generate a preview with sample data.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
             <Search className="h-4 w-4 text-blue-500" />
             <h3 className="font-bold text-slate-800 text-sm">Placeholders</h3>
          </div>
          <p className="text-xs text-slate-500">
            Drag into subject or body, or click "Subject" / "Body" to insert at cursor.
          </p>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter placeholders..."
              value={placeholderFilter}
              onChange={(e) => setPlaceholderFilter(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Category</label>
            <select
              value={placeholderCategory}
              onChange={(e) => setPlaceholderCategory(e.target.value as PlaceholderCategory | "all")}
              className="w-full h-8 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All categories</option>
              {(Object.keys(EMAIL_PLACEHOLDER_CATEGORIES) as PlaceholderCategory[]).map((key) => (
                <option key={key} value={key}>
                  {EMAIL_PLACEHOLDER_CATEGORIES[key].label}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
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
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
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
              <p className="text-xs text-slate-500 p-2 italic">No placeholders match "{placeholderFilter}".</p>
            )}
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
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
      className="group flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 font-mono text-[11px]"
    >
      <span className="cursor-grab active:cursor-grabbing px-1.5 py-1 text-slate-400" title="Drag to subject or body">
        <GripVertical className="h-3 w-3" />
      </span>
      <span className="py-1 pr-1 text-slate-700" title={item.description}>
        {`{{${item.key}}}`}
      </span>
      <span className="flex items-center border-l border-slate-200">
        <button
          type="button"
          onClick={onInsertSubject}
          className="px-1.5 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-r-md text-[10px] font-bold uppercase transition-colors"
          title="Insert into subject"
        >
          Sub
        </button>
        <button
          type="button"
          onClick={onInsertBody}
          className="px-1.5 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 text-[10px] font-bold uppercase transition-colors"
          title="Insert into body"
        >
          Body
        </button>
      </span>
    </div>
  );
}
