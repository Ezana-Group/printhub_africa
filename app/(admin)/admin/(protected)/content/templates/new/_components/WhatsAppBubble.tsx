"use client";

import { Check, CheckCheck } from "lucide-react";

export function WhatsAppBubble({ text }: { text: string }) {
  // Convert newlines to <br/> and handle simple variables
  const formattedText = text
    .split("\n")
    .map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));

  return (
    <div className="flex flex-col items-start w-full max-w-sm ml-auto">
      <div className="relative bg-[#DCF8C6] text-[#303030] p-3 rounded-2xl rounded-tr-none shadow-sm text-sm leading-relaxed max-w-full min-w-[100px]">
        {/* Triangle / Tail */}
        <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#DCF8C6] border-r-[10px] border-r-transparent" />
        
        <div className="whitespace-pre-wrap break-words">
          {formattedText}
        </div>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-slate-500/70">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
        </div>
      </div>
    </div>
  );
}
