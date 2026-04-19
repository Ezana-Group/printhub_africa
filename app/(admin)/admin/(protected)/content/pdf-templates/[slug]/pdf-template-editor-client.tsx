"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Loader2, Search, GripVertical, FileText } from "lucide-react";
import {
  EMAIL_PLACEHOLDER_CATEGORIES,
  formatPlaceholder,
  type PlaceholderCategory,
  type PlaceholderItem,
} from "@/lib/email-placeholders";
import { SmartTextEditor, type SmartTextEditorHandle } from "@/components/admin/smart-text-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Maximize2, ExternalLink, Download } from "lucide-react";

export function PdfTemplateEditorClient({
  slug,
  description,
  initialBodyHtml,
}: {
  slug: string;
  description: string;
  initialBodyHtml: string;
}) {
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [placeholderFilter, setPlaceholderFilter] = useState("");
  const [placeholderCategory, setPlaceholderCategory] = useState<PlaceholderCategory | "all">("all");
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  const bodyRef = useRef<SmartTextEditorHandle>(null);
  const insertIntoBody = useCallback(
    (text: string) => bodyRef.current?.insertText(text),
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/content/templates/pdf/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyHtml }),
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
      const res = await fetch(`/api/admin/content/templates/pdf-preview/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyHtml }),
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
            <div className="flex justify-between items-center">
              <Label htmlFor="bodyHtml">PDF Content (HTML)</Label>
              <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-100">A4 Document</span>
            </div>
            <SmartTextEditor
              ref={bodyRef}
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Design your PDF layout using HTML and tailwind classes. Use {{placeholders}} for dynamic data."
              minHeight="550px"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Template
            </Button>
            <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Generate Preview
            </Button>
            {message === "saved" && <span className="text-sm text-green-600 font-medium">Changes saved!</span>}
            {message === "error" && <span className="text-sm text-red-600 font-medium">Error saving.</span>}
          </div>
        </div>
      </div>

      {/* Right: preview & placeholders panel */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6">
        {/* PDF Live Preview Window */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-4">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3 w-3 text-blue-500" /> PDF Preview
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePreview} 
                disabled={previewLoading}
                className="h-7 w-7 hover:bg-white transition-colors"
                title="Refresh Preview"
              >
                {previewLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
              </Button>
              {previewHtml && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setFullscreenPreview(true)} 
                    className="h-7 w-7 hover:bg-white transition-colors"
                    title="Fullscreen Mode"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => window.open(`/api/admin/content/templates/pdf-preview/${slug}`, '_blank')}
                    className="h-7 w-7 hover:bg-white transition-colors"
                    title="Open Full Page"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="bg-[#f8fafc] min-h-[400px] max-h-[550px] overflow-y-auto custom-scrollbar p-4 flex justify-center items-start">
            {previewHtml ? (
              <div 
                className="bg-white shadow-lg origin-top scale-[0.35] w-[210mm] h-[297mm] -mb-[180%] border border-slate-200 pointer-events-none overflow-hidden"
                style={{ width: "210mm", height: "297mm" }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="mt-20 flex flex-col items-center justify-center text-center space-y-3 px-6">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <FileText className="h-6 w-6 text-slate-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">No Preview Ready</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Click refresh to visualize the A4 layout with sample data.</p>
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
            Drag into editor or click "Insert" to add at cursor.
          </p>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Find a variable..."
              value={placeholderFilter}
              onChange={(e) => setPlaceholderFilter(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1 custom-scrollbar">
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
                        onInsert={() => insertIntoBody(formatPlaceholder(p.key))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={fullscreenPreview} onOpenChange={setFullscreenPreview}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-slate-100 border-none shadow-2xl">
          <DialogHeader className="p-4 bg-white border-b border-slate-200 flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Full Page Preview: {slug}
            </DialogTitle>
            <div className="flex items-center gap-2 pr-8">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(`/api/admin/content/templates/pdf-preview/${slug}`, '_blank')}
                className="text-xs h-8"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Open Full Window
              </Button>
              <Button 
                size="sm" 
                onClick={() => window.open(`/api/admin/content/templates/pdf-preview/${slug}?print=true`, '_blank')}
                className="text-xs h-8"
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-500/10 custom-scrollbar">
            {previewHtml ? (
              <div 
                className="bg-white shadow-2xl border border-slate-200"
                style={{ 
                  width: "210mm", 
                  minHeight: "297mm",
                  padding: "0" // The template's internal padding should define this
                }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      
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
  onInsert,
}: {
  item: PlaceholderItem;
  onInsert: () => void;
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
      <span className="cursor-grab active:cursor-grabbing px-1.5 py-1 text-slate-400" title="Drag to editor">
        <GripVertical className="h-3 w-3" />
      </span>
      <span className="py-1 pr-1 text-slate-700" title={item.description}>
        {`{{${item.key}}}`}
      </span>
      <span className="flex items-center border-l border-slate-200">
        <button
          type="button"
          onClick={onInsert}
          className="px-2 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-r-md text-[10px] font-bold uppercase transition-colors"
          title="Insert into body"
        >
          Insert
        </button>
      </span>
    </div>
  );
}
