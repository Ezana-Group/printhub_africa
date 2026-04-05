"use client";

import { 
  FileText, 
  Layout, 
  Maximize2,
  Code
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PdfEditorProps {
  data: { pageSize: string; orientation: string; bodyHtml: string };
  onChange: (data: { pageSize: string; orientation: string; bodyHtml: string }) => void;
}

export function PdfEditor({ data, onChange }: PdfEditorProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Page size</Label>
          <Select 
            value={data.pageSize} 
            onValueChange={(val) => onChange({ ...data, pageSize: val })}
          >
            <SelectTrigger className="h-11 border-slate-200 rounded-lg">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
              <SelectItem value="LETTER">Letter (8.5 x 11 in)</SelectItem>
              <SelectItem value="A3">A3 (297 x 420 mm)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Orientation</Label>
          <Select 
            value={data.orientation} 
            onValueChange={(val) => onChange({ ...data, orientation: val })}
          >
            <SelectTrigger className="h-11 border-slate-200 rounded-lg">
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PORTRAIT">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Portrait
                </div>
              </SelectItem>
              <SelectItem value="LANDSCAPE">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Landscape
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="pdf-html-body" className="text-sm font-semibold text-slate-700">Document HTML Structure</Label>
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">
            <Code className="h-3 w-3" />
            HTML / CSS supported
          </div>
        </div>
        
        <div className="relative group">
          <Textarea 
            id="pdf-html-body"
            value={data.bodyHtml}
            onChange={(e) => onChange({ ...data, bodyHtml: e.target.value })}
            placeholder="<html><body><h1>{{businessName}}</h1>...</body></html>"
            className="min-h-[450px] p-4 text-sm leading-relaxed border-slate-200 focus:border-[#D85A30] focus:ring-[#D85A30]/10 rounded-xl transition-all font-mono bg-slate-900 text-slate-100 selection:bg-orange-500/30 scrollbar-hide resize-y"
            spellCheck={false}
          />
          <div className="absolute top-4 right-4 pointer-events-none opacity-30 group-focus-within:opacity-100 transition-opacity">
            <Maximize2 className="h-5 w-5 text-slate-400" />
          </div>
        </div>
        
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl px-1">
          PDF templates support standard HTML5 and CSS. For dynamic documents (invoices, receipts), 
          it's recommended to use a base structure and embed placeholders like 
          <code className="text-orange-600 bg-orange-50 px-1 rounded mx-1">{"{{orderItemsHtml}}"}</code> 
          for pre-formatted tables.
        </p>
      </div>
    </div>
  );
}
