"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";

export function AddLegalPageForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSlugChange = (value: string) => {
    setSlug(value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/content/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create page");
        return;
      }
      router.push(`/admin/content/legal/${data.page.slug}/edit`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="slug">URL slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="e.g. shipping-policy"
          required
          className="font-mono"
        />
        <p className="text-xs text-slate-500">
          Lowercase letters, numbers and hyphens only. The page will be available at /{slug || "…"}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Shipping Policy"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content (HTML/Rich Text, optional)</Label>
        <div className="mt-1">
          <SmartTextEditor
            value={content}
            onChange={setContent}
            placeholder="Document content..."
            minHeight="250px"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          You can leave this empty and add content in the editor after creating the page.
        </p>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create legal page"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/content/legal")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
