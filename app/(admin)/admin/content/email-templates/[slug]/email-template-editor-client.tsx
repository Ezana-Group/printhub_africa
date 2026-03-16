"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Send, Loader2 } from "lucide-react";

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

  return (
    <div className="space-y-6 max-w-4xl">
      {description && (
        <p className="text-sm text-slate-600">{description}</p>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject line</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Order {{orderNumber}} confirmed – {{businessName}}"
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500">Use placeholders like {`{{businessName}}`}, {`{{orderNumber}}`}, {`{{footer}}`}.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bodyHtml">Body (HTML)</Label>
          <Textarea
            id="bodyHtml"
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            placeholder="<div>...</div>"
            rows={18}
            className="font-mono text-sm resize-y"
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
  );
}
