"use client";

import { 
  ShieldCheck, 
  Tag, 
  CreditCard, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { forwardRef, useImperativeHandle, useRef } from "react";

interface WhatsAppEditorProps {
  data: { category: string; bodyText: string };
  onChange: (data: { category: string; bodyText: string }) => void;
  onFocus?: () => void;
}

const CATEGORIES = [
  { 
    id: "UTILITY", 
    label: "Utility", 
    description: "Confirmations, updates, post-purchase management, etc.", 
    icon: <ShieldCheck className="h-5 w-5" /> 
  },
  { 
    id: "MARKETING", 
    label: "Marketing", 
    description: "Promotions, product announcements, newsletters.", 
    icon: <Tag className="h-5 w-5" /> 
  },
  { 
    id: "AUTHENTICATION", 
    label: "Authentication", 
    description: "One-time passwords, login codes, verification.", 
    icon: <CreditCard className="h-5 w-5" /> 
  },
  { 
    id: "SERVICE", 
    label: "Service", 
    description: "Customer support, inquiries, general replies.", 
    icon: <MessageSquare className="h-5 w-5" /> 
  }
];

export interface WhatsAppEditorHandle {
  insertText: (text: string) => void;
}

export const WhatsAppEditor = forwardRef<WhatsAppEditorHandle, WhatsAppEditorProps>(
  ({ data, onChange, onFocus }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const charactersCount = data.bodyText.length;
    const isOverLimit = charactersCount > 1024;

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (!textareaRef.current) return;
        const el = textareaRef.current;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const current = el.value;
        const next = current.slice(0, start) + text + current.slice(end);
        onChange({ ...data, bodyText: next });
        
        // Re-focus and set cursor position
        setTimeout(() => {
          el.focus();
          const pos = start + text.length;
          el.setSelectionRange(pos, pos);
        }, 0);
      }
    }));

    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-slate-700">Template Category</Label>
          <p className="text-sm text-slate-500 -mt-2">WhatsApp bills by category. Select the most appropriate one for this template.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onChange({ ...data, category: cat.id })}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all group relative overflow-hidden ${
                  data.category === cat.id 
                    ? "border-[#D85A30] bg-orange-50/50 ring-1 ring-[#D85A30]" 
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-lg mb-3 ${
                  data.category === cat.id 
                    ? "bg-[#D85A30] text-white" 
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                }`}>
                  {cat.icon}
                </div>
                <h4 className={`font-bold text-sm ${data.category === cat.id ? "text-slate-900" : "text-slate-700"}`}>
                  {cat.label}
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {cat.description}
                </p>
                {data.category === cat.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-[#D85A30]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="whatsapp-body" className="text-sm font-semibold text-slate-700">Message Body</Label>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isOverLimit ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
            }`}>
              {charactersCount} / 1024 characters
            </div>
          </div>
          
          <div className="relative group">
            <Textarea 
              ref={textareaRef}
              id="whatsapp-body"
              value={data.bodyText}
              onChange={(e) => onChange({ ...data, bodyText: e.target.value })}
              onFocus={onFocus}
              placeholder="Type your message here..."
              className={`min-h-[250px] p-4 text-sm leading-relaxed border-slate-200 focus:border-[#D85A30] focus:ring-[#D85A30]/10 rounded-xl transition-all font-mono scrollbar-hide resize-y ${
                isOverLimit ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" : ""
              }`}
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest pointer-events-none opacity-50 group-focus-within:opacity-100">
              Plain Text Only
            </div>
          </div>
          
          {isOverLimit && (
            <p className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              Character limit exceeded. WhatsApp templates must be under 1024 characters.
            </p>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl px-1">
            WhatsApp templates do not support rich formatting like HTML or Markdown. 
            Use <code className="text-orange-600 bg-orange-50 px-1 rounded">{"{{variable}}"}</code> notation for dynamic content. 
          </p>
        </div>
      </div>
    );
  }
);

WhatsAppEditor.displayName = "WhatsAppEditor";
