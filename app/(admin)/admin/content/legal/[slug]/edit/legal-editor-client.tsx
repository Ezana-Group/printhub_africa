"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-md border bg-background">
          <div className="border-b p-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>HTML content</span>
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-auto"
            >
              Preview ↗
            </a>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[480px] font-mono text-sm rounded-none border-0 focus-visible:ring-0"
            placeholder="HTML content..."
          />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="font-medium">Page settings</h3>
          <div>
            <Label>Title</Label>
            <Input value={title} readOnly className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} readOnly className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={isPublished ? "published" : "draft"}
              onChange={(e) => setIsPublished(e.target.value === "published")}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div>
            <Label>Last updated</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(lastUpdated).toLocaleString()} · v{version}
            </p>
          </div>
          <div>
            <Label>Change note (optional)</Label>
            <Input
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g. Updated refund window to 14 days"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save & Publish"}
          </Button>
          {message === "saved" && (
            <p className="text-sm text-green-600">Saved successfully.</p>
          )}
          {message === "error" && (
            <p className="text-sm text-destructive">Failed to save.</p>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">Version history</h3>
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">
                  v{h.version} · {new Date(h.savedAt).toLocaleDateString()}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestore(h.id)}
                  disabled={saving}
                >
                  Restore
                </Button>
                {h.changeNote && (
                  <span className="w-full text-muted-foreground text-xs">
                    {h.changeNote}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
