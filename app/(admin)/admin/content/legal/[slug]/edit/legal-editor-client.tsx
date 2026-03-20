"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  ExternalLink,
  FileCode2,
  History,
  RotateCcw,
  XCircle,
  Eye,
} from "lucide-react";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";

type HistoryItem = {
  id: string;
  version: number;
  savedAt: Date | string;
  savedBy: string | null;
  changeNote: string | null;
};

export function LegalPageEditorClient({
  slug,
  title,
  content: initialContent,
  version,
  lastUpdated,
  isPublished: initialPublished,
  history,
}: {
  slug: string;
  title: string;
  content: string;
  version: number;
  lastUpdated: Date | string;
  isPublished: boolean;
  history: HistoryItem[];
}) {
  const [content, setContent] = useState(initialContent);
  const [changeNote, setChangeNote] = useState("");
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");


  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/content/legal/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          changeNote: changeNote.trim() || undefined,
          isPublished,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("saved");
      setChangeNote("");
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (historyId: string) => {
    if (!confirm("Restore this version? Current content will be saved to history.")) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/content/legal/${slug}/restore/${historyId}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to restore");
      const data = await res.json();
      setContent(data.page.content);
      setMessage("saved");
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content area */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80">
            <button
              type="button"
              onClick={() => setTab("edit")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === "edit"
                  ? "bg-white text-slate-900 border-b-2 border-primary -mb-px"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileCode2 className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === "preview"
                  ? "bg-white text-slate-900 border-b-2 border-primary -mb-px"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-3 text-sm text-primary hover:underline ml-auto"
            >
              Open live page
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="p-4">
            {tab === "edit" ? (
              <div className="space-y-3">
                <SmartTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="<h2>Section title</h2><p>Paragraph text...</p>"
                  minHeight="420px"
                />
              </div>
            ) : (
              <div className="min-h-[420px] rounded-lg border border-slate-200 bg-slate-50/30 p-6 overflow-auto">
                <div
                  className="prose prose-slate max-w-none prose-headings:font-display prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-slate-200 prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-td:border prose-td:border-slate-200 prose-td:px-4 prose-td:py-3"
                  dangerouslySetInnerHTML={{ __html: content || "<p class='text-slate-400'>Nothing to preview yet.</p>" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Page settings</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-600">Title</Label>
              <Input value={title} readOnly className="mt-1.5 bg-slate-50 text-slate-600" />
            </div>
            <div>
              <Label className="text-slate-600">URL slug</Label>
              <Input value={slug} readOnly className="mt-1.5 bg-slate-50 text-slate-600" />
            </div>
            <div>
              <Label className="text-slate-600">Status</Label>
              <select
                value={isPublished ? "published" : "draft"}
                onChange={(e) => setIsPublished(e.target.value === "published")}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-600">Last updated</Label>
              <p className="text-sm text-slate-500 mt-1.5">
                {new Date(lastUpdated).toLocaleString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · v{version}
              </p>
            </div>
            <div>
              <Label className="text-slate-600">Change note (optional)</Label>
              <Input
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Updated refund window to 14 days"
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium"
            >
              {saving ? "Saving…" : "Save & Publish"}
            </Button>
            {message === "saved" && (
              <p className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Saved successfully.
              </p>
            )}
            {message === "error" && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                Failed to save. Try again.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <History className="h-4 w-4" />
            Version history
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No previous versions yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">v{h.version}</span>
                  <span className="text-slate-500">
                    {new Date(h.savedAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-8 gap-1 text-primary hover:text-primary/90"
                    onClick={() => handleRestore(h.id)}
                    disabled={saving}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  {h.changeNote && (
                    <span className="w-full text-xs text-slate-500 mt-1 pl-1">
                      {h.changeNote}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
