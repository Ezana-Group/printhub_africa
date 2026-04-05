"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Undo, 
  Redo, 
  Heading2, 
  Minus, 
  Quote, 
  ChevronRight,
  Code
} from "lucide-react";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SmartTextEditor, type SmartTextEditorHandle } from "@/components/admin/smart-text-editor";

interface EmailEditorProps {
  data: { subject: string; bodyHtml: string };
  onChange: (data: { subject: string; bodyHtml: string }) => void;
  onFocusSubject?: () => void;
  onFocusBody?: () => void;
}

export interface EmailEditorHandle {
  insertSubject: (text: string) => void;
  insertBody: (text: string) => void;
}

export const EmailEditor = forwardRef<EmailEditorHandle, EmailEditorProps>(
  ({ data, onChange, onFocusSubject, onFocusBody }, ref) => {
    const subjectRef = useRef<HTMLInputElement>(null);
    const bodyRef = useRef<SmartTextEditorHandle>(null);

    useImperativeHandle(ref, () => ({
      insertSubject: (text: string) => {
        if (!subjectRef.current) return;
        const el = subjectRef.current;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const current = el.value;
        const next = current.slice(0, start) + text + current.slice(end);
        onChange({ ...data, subject: next });
        
        setTimeout(() => {
          el.focus();
          const pos = start + text.length;
          el.setSelectionRange(pos, pos);
        }, 0);
      },
      insertBody: (text: string) => {
        bodyRef.current?.insertText(text);
      }
    }));

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email-subject" className="text-sm font-semibold text-slate-700">Subject line</Label>
          <Input 
            ref={subjectRef}
            id="email-subject"
            value={data.subject}
            onChange={(e) => onChange({ ...data, subject: e.target.value })}
            onFocus={onFocusSubject}
            placeholder="e.g. Your order {{orderNumber}} has been shipped"
            className="h-11 border-slate-200 focus:border-[#D85A30] focus:ring-[#D85A30]/10 rounded-lg transition-all"
          />
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
            Tip: Use placeholders like <code className="text-orange-600 bg-orange-50 px-1 rounded">{"{{firstName}}"}</code> to personalize the subject.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-slate-700">Email content</Label>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500/30 transition-all">
            <SmartTextEditor 
              ref={bodyRef}
              value={data.bodyHtml}
              onChange={(html) => onChange({ ...data, bodyHtml: html })}
              onFocus={onFocusBody}
              placeholder="Write your email body here..."
              minHeight="450px"
            />
          </div>
        </div>
      </div>
    );
  }
);

EmailEditor.displayName = "EmailEditor";
