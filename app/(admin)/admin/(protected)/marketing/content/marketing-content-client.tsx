"use client";
import { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContentQueueTable } from "../../ai/_components/content-queue-table";
import { ContentCalendarView } from "../../ai/_components/content-calendar-view";
import { ProductExportTable } from "../social-export/product-export-table";
import { SyncFeedsButton } from "../social-export/sync-feeds-button";
import { 
  LayoutDashboard, 
  Calendar, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Zap,
  Send,
  XCircle
} from "lucide-react";
import Link from "next/link";

interface MarketingContentClientProps {
  mockups: any[];
  videos: any[];
  calendar: {
    weekStarting: string;
    days: any[];
    strategy: string;
  };
  products: any[];
  categories: any[];
  broadcasts: any[];
}

export function MarketingContentClient({ 
  mockups, 
  videos, 
  calendar, 
  products,
  categories,
  broadcasts: initialBroadcasts 
}: MarketingContentClientProps) {
  const [broadcastList, setBroadcastList] = useState(initialBroadcasts);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingCount = mockups.filter(m => m.status === 'PENDING_REVIEW').length + 
                       videos.filter(v => v.status === 'PENDING_REVIEW').length +
                       broadcastList.length;

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/content/broadcasts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setBroadcastList(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-screen-2xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wide uppercase">
            <Sparkles className="h-4 w-4" />
            Marketing Operations
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b-4 border-primary/20 pb-1 inline-block">
            Unified Content Manager
          </h1>
          <p className="text-slate-500 max-w-2xl">
            Approve AI-generated media, manage your weekly social calendar, and sync product feeds to external platforms.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <SyncFeedsButton />
        </div>
      </div>

      <Tabs defaultValue="approval" className="w-full space-y-8">
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList className="bg-transparent border-none gap-8">
            <TabsTrigger 
              value="approval" 
              className="px-0 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approval Queue
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="px-0 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2.5"
            >
              <Calendar className="h-4 w-4" />
              Weekly Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="px-0 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2.5"
            >
              <Share2 className="h-4 w-4" />
              Social Sync Toggles
            </TabsTrigger>
            <TabsTrigger 
              value="broadcasts" 
              className="px-0 pb-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-slate-600 hover:text-slate-900 transition-all flex items-center gap-2.5"
            >
              <Zap className="h-4 w-4" />
              Campaign Broadcasts
              {broadcastList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                  {broadcastList.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="approval" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <ContentQueueTable mockups={mockups} videos={videos} />
            </div>
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Content Generation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mockups and videos are automatically generated by the AI every Friday to prepare for the siguiente week. 
                  Approving them here makes them available for selection in the content calendar.
                </p>
                <Link 
                  href="/admin/ai"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group"
                >
                  Configure AI Settings
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
             <ContentCalendarView 
               weekStarting={calendar.weekStarting} 
               days={calendar.days} 
               strategy={calendar.strategy} 
             />
          </div>
        </TabsContent>

        <TabsContent value="social" className="focus-visible:outline-none focus-visible:ring-0 space-y-6">
          <div className="flex flex-col gap-1 px-1">
             <h2 className="text-xl font-bold text-slate-900">Product Social Distribution</h2>
             <p className="text-sm text-slate-500">Enable or disable product visibility in automated social feeds and shopping sites.</p>
          </div>
          <ProductExportTable initialProducts={products} categories={categories} />
        </TabsContent>

        <TabsContent value="broadcasts" className="focus-visible:outline-none focus-visible:ring-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">AI Broadcast Queue</h2>
                  <p className="text-sm text-slate-500">Approve AI-generated weekly SMS and WhatsApp campaigns.</p>
                </div>
             </div>
             
             {broadcastList.length === 0 ? (
               <div className="py-20 text-center space-y-3">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-slate-300" />
                 </div>
                 <p className="text-slate-500 font-medium">No pending broadcasts to approve.</p>
               </div>
             ) : (
               <div className="grid gap-6">
                 {broadcastList.map(b => (
                   <div key={b.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-primary/30 transition-colors shadow-sm">
                      <div className="bg-slate-50 px-5 py-3 border-b flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tabular-nums">
                               {b.type}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">{b.title}</span>
                         </div>
                         <span className="text-[10px] text-slate-400 font-medium">Generated {new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="p-5 flex flex-col md:flex-row gap-6">
                         <div className="flex-1 bg-slate-50/50 p-4 rounded-lg border border-dashed border-slate-200 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                            {b.bodyText}
                         </div>
                         <div className="flex flex-col gap-2 w-full md:w-48">
                            <button 
                               onClick={() => handleAction(b.id, 'APPROVED')}
                               disabled={processingId === b.id}
                               className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-sm active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                               <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                               {processingId === b.id ? 'Processing...' : 'Approve & Send'}
                            </button>
                            <button 
                               onClick={() => handleAction(b.id, 'REJECTED')}
                               disabled={processingId === b.id}
                               className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all font-semibold active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                               <XCircle className="h-4 w-4" />
                               Reject
                            </button>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
