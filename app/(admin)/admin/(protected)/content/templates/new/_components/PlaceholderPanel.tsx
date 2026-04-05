"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  SearchX, 
  ChevronRight, 
  Plus, 
  FileText, 
  Image as ImageIcon,
  GripVertical
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  EMAIL_PLACEHOLDER_CATEGORIES, 
  type PlaceholderCategory, 
  type PlaceholderItem 
} from "@/lib/email-placeholders";
import { WhatsAppBubble } from "./WhatsAppBubble";

interface PlaceholderPanelProps {
  type: "email" | "whatsapp" | "pdf";
  currentEmailData: { subject: string; bodyHtml: string };
  currentWhatsAppData: { bodyText: string };
  currentPdfData: { bodyHtml: string };
  onInsertEmailBody: (tag: string) => void;
  onInsertEmailSubject: (tag: string) => void;
  onInsertWhatsApp: (tag: string) => void;
  onInsertPdf: (tag: string) => void;
}

export function PlaceholderPanel({ 
  type, 
  currentEmailData,
  currentWhatsAppData,
  currentPdfData,
  onInsertEmailBody,
  onInsertEmailSubject,
  onInsertWhatsApp,
  onInsertPdf
}: PlaceholderPanelProps) {
  const [search, setSearch] = useState("");
  
  // Flatten and filter placeholders
  const filteredCategories = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return Object.entries(EMAIL_PLACEHOLDER_CATEGORIES);

    return Object.entries(EMAIL_PLACEHOLDER_CATEGORIES).map(([cat, info]) => {
      const filtered = info.placeholders.filter(p => 
        p.key.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
      return [cat, { ...info, placeholders: filtered }];
    }).filter(([_, info]) => (info as any).placeholders.length > 0) as [PlaceholderCategory, any][];
  }, [search]);

  return (
    <div className="w-full lg:w-[420px] xl:w-[480px] bg-white border-l border-slate-200 flex flex-col h-full sticky top-[65px] lg:top-0">
      {/* Preview Section (Conditional) */}
      <div className="border-b border-slate-200 bg-slate-50/50 flex-none overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Preview</h3>
        </div>

        <div className="p-5 max-h-[350px] overflow-y-auto scrollbar-hide">
          {type === "email" && (
            <div className="space-y-4">
               <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Subject</div>
                  <div className="text-sm font-semibold text-slate-700">
                    {currentEmailData.subject || "No subject set"}
                  </div>
               </div>
               <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm min-h-[100px] text-xs prose-sm prose-slate max-w-none prose-p:my-1 overflow-hidden" 
                 dangerouslySetInnerHTML={{ __html: currentEmailData.bodyHtml }} 
               />
            </div>
          )}

          {type === "whatsapp" && (
            <div className="bg-[#E5DDD5] rounded-xl p-4 min-h-[150px] flex items-end">
              <WhatsAppBubble text={currentWhatsAppData.bodyText} />
            </div>
          )}

          {type === "pdf" && (
            <div className="bg-slate-200 rounded-lg p-6 flex justify-center min-h-[300px]">
              <div className="bg-white w-[210px] h-[297px] scale-75 origin-top shadow-xl p-4 overflow-hidden text-[8px] relative">
                {/* PDF Header Mockup */}
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                   <div className="flex items-center gap-1.5 leading-none">
                      <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                        <FileText className="h-3 w-3 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">PRINTHUB</div>
                        <div className="text-[6px] text-slate-400">Official Invoice</div>
                      </div>
                   </div>
                   <div className="text-right leading-tight">
                      <div className="font-bold text-primary">#PH-2024-001</div>
                      <div className="text-[6px] text-slate-500">5 Apr 2024</div>
                   </div>
                </div>

                {/* PDF Body content (sanitized or raw) */}
                <div 
                  className="prose-xs prose-slate max-w-none text-slate-700" 
                  dangerouslySetInnerHTML={{ __html: currentPdfData.bodyHtml.replace(/\{\{(.+?)\}\}/g, '<span class="bg-[#EEEDFE] text-[#534AB7] px-1 rounded font-mono font-bold">$1</span>') }} 
                />

                {/* PDF Table Mockup */}
                <div className="mt-4 border-t border-slate-100 pt-2 shrink-0">
                  <div className="grid grid-cols-4 gap-2 font-bold bg-slate-50 p-1 mb-1 text-[6px]">
                    <div className="col-span-2">Item</div>
                    <div>Qty</div>
                    <div>Total</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-1 border-b border-slate-50 text-[5px]">
                    <div className="col-span-2">Large Format Header</div>
                    <div>1</div>
                    <div>KES 2,500</div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <div className="text-right">
                       <div className="text-[5px] text-slate-500">Subtotal</div>
                       <div className="font-bold text-slate-900">KES 2,500</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Placeholders Search */}
      <div className="p-5 border-b border-slate-200 flex-none bg-white">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Insert Placeholders</h3>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <Input 
            placeholder="Search variables e.g. 'order'..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:border-orange-500/30 transition-all rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Scrollable Placeholder List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-hide">
        {filteredCategories.map(([catKey, info]) => (
          <div key={catKey} className="space-y-3">
             <div className="flex items-center gap-2 group">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D85A30] bg-orange-50 px-2 py-0.5 rounded">
                  {info.label}
                </span>
                <div className="h-px bg-orange-100 flex-1" />
             </div>
             
             <div className="grid grid-cols-1 gap-2">
                {info.placeholders.map((p: PlaceholderItem) => (
                  <div 
                    key={p.key} 
                    className="group relative flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white hover:border-orange-200 hover:shadow-md hover:shadow-orange-500/5 transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                       <GripVertical className="h-3.5 w-3.5 text-slate-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="min-w-0">
                          <code className="bg-[#EEEDFE] text-[#534AB7] px-1.5 py-0.5 rounded text-[11px] font-mono font-bold leading-none inline-block mb-1">
                            {"{{" + p.key + "}}"}
                          </code>
                          <p className="text-[10px] text-slate-500 truncate" title={p.description}>
                            {p.description}
                          </p>
                       </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                       {type === "email" ? (
                         <>
                           <button
                             onClick={() => onInsertEmailSubject("{{" + p.key + "}}")}
                             className="px-2 py-1 bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-[#D85A30] text-[9px] font-bold uppercase rounded-md border border-slate-100 hover:border-orange-200 transition-all active:scale-95 shadow-sm"
                           >
                             Subject
                           </button>
                           <button
                             onClick={() => onInsertEmailBody("{{" + p.key + "}}")}
                             className="px-2 py-1 bg-slate-50 hover:bg-[#D85A30] text-slate-500 hover:text-white text-[9px] font-bold uppercase rounded-md border border-slate-100 hover:border-[#D85A30] transition-all active:scale-95 shadow-sm"
                           >
                             Body
                           </button>
                         </>
                       ) : (
                         <button
                           onClick={() => {
                             if (type === "whatsapp") onInsertWhatsApp("{{" + p.key + "}}");
                             if (type === "pdf") onInsertPdf("{{" + p.key + "}}");
                           }}
                           className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-[#D85A30] text-slate-500 hover:text-white rounded-lg border border-slate-100 hover:border-[#D85A30] transition-all active:scale-95 shadow-sm"
                         >
                           <Plus className="h-4 w-4" />
                         </button>
                       )}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <SearchX className="h-5 w-5 text-slate-300" />
             </div>
             <p className="text-sm font-medium text-slate-500">No placeholders found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
