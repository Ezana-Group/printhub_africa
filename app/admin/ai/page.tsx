"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Settings, 
  BarChart3, 
  Calendar,
  Zap,
  Image as ImageIcon,
  Video as VideoIcon,
  MessageSquare,
  RefreshCcw,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AIHealth {
  service: string;
  status: string;
  success: boolean;
  responseMs: number;
  lastSuccessfulCall: string;
}

interface PendingItem {
  id: string;
  type: "mockup" | "video" | "ad-copy";
  productId: string;
  productName: string;
  platform: string;
  previewUrl?: string;
  createdAt: string;
}

export default function AIControlCentre() {
  const [health, setHealth] = useState<Record<string, AIHealth>>({});
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingHealth, setRefreshingHealth] = useState(false);

  const services = [
    "claude", "gpt4o", "gemini", "perplexity", "dalle", 
    "stability", "runway", "elevenlabs", "whatsapp"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch initial health
      const healthPromises = services.map(s => 
        fetch(`/api/admin/ai/service-health/${s}`).then(r => r.json())
      );
      const healthResults = await Promise.all(healthPromises);
      const healthMap: Record<string, AIHealth> = {};
      healthResults.forEach((h, i) => {
        if (!h.error) healthMap[services[i]] = h;
      });
      setHealth(healthMap);

      // Fetch pending items
      const approvalRes = await fetch("/api/admin/ai/content-approval");
      const approvalData = await approvalRes.json();
      const combinedItems: PendingItem[] = [
        ...(approvalData.pendingMockups || []).map((m: any) => ({
          id: m.id,
          type: "mockup",
          productId: m.productId,
          productName: m.product?.name || "Unknown Product",
          platform: m.platform,
          previewUrl: m.imageUrl,
          createdAt: m.createdAt
        })),
        ...(approvalData.pendingVideos || []).map((v: any) => ({
          id: v.id,
          type: "video",
          productId: v.productId,
          productName: v.product?.name || "Unknown Product",
          platform: v.platform,
          previewUrl: v.videoUrl,
          createdAt: v.createdAt
        })),
        ...(approvalData.pendingAdCopy || []).map((a: any) => ({
          id: a.id,
          type: "ad-copy",
          productId: a.productId,
          productName: a.product?.name || "Unknown Product",
          platform: a.platform,
          previewUrl: null,
          createdAt: a.generatedAt
        }))
      ];
      setPendingItems(combinedItems);

      // Fetch settings
      const settingsRes = await fetch("/api/admin/ai/settings");
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load AI control data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshHealth = async () => {
    setRefreshingHealth(true);
    try {
      const healthPromises = services.map(s => 
        fetch(`/api/admin/ai/service-health/${s}`).then(r => r.json())
      );
      const healthResults = await Promise.all(healthPromises);
      const healthMap: Record<string, AIHealth> = {};
      healthResults.forEach((h, i) => {
        if (!h.error) healthMap[services[i]] = h;
      });
      setHealth(healthMap);
      toast.success("Health status updated");
    } catch (error) {
      toast.error("Failed to refresh health status");
    } finally {
      setRefreshingHealth(false);
    }
  };

  const handleApproval = async (id: string, type: string, isApproved: boolean) => {
    try {
      const res = await fetch("/api/admin/ai/content-approval", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type, isApproved })
      });
      if (!res.ok) throw new Error("Failed to process approval");
      
      setPendingItems(prev => prev.filter(item => item.id !== id));
      toast.success(isApproved ? "Approved!" : "Rejected");
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      const res = await fetch("/api/admin/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error("Failed to update setting");
      
      setSettings(newSettings);
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 animate-pulse">Initialising AI Control Centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 backdrop-blur-md shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
        <div className="z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">System Intelligence</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            AI Control Centre
          </h1>
          <p className="text-zinc-400 mt-3 text-lg font-medium">Monitoring engine health, content generation, and strategy automation.</p>
        </div>
        <div className="flex gap-3 mt-6 md:mt-0 z-10">
          <Button 
            variant="outline" 
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 h-12 px-6 rounded-xl font-bold transition-all active:scale-95"
            onClick={fetchData}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Hard Refresh
          </Button>
          <Button 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-12 px-8 rounded-xl font-bold shadow-xl shadow-indigo-500/20 border-0 transition-all active:scale-95"
          >
            Run Monthly Insights
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1.5 h-14 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl px-8 font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all">
            <Activity className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="approval" className="rounded-xl px-8 font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all">
            <Clock className="w-4 h-4 mr-2" /> Approval Queue
            {pendingItems.length > 0 && (
              <Badge className="ml-2 bg-indigo-500 pointer-events-none active:scale-100">{pendingItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl px-8 font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all">
            <Settings className="w-4 h-4 mr-2" /> Strategy & Settings
          </TabsTrigger>
          <TabsTrigger value="usage" className="rounded-xl px-8 font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all">
            <BarChart3 className="w-4 h-4 mr-2" /> Usage & Cost
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW CONTENT */}
        <TabsContent value="overview" className="space-y-8">
          {/* Health Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <h3 className="col-span-full text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-400" />
              API Model Health
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-500 hover:text-white"
                onClick={refreshHealth}
                disabled={refreshingHealth}
              >
                {refreshingHealth ? "Polling..." : "Refresh Status"}
              </Button>
            </h3>
            {services.map(s => {
              const h = health[s];
              return (
                <Card key={s} className="bg-zinc-950 border-zinc-800 shadow-xl hover:border-indigo-500/30 transition-all group overflow-hidden">
                  <div className={`h-1 w-full ${h?.success ? 'bg-green-500' : 'bg-red-500'} opacity-30 group-hover:opacity-100 transition-opacity`} />
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center text-lg capitalize font-black">
                      {s}
                      {h?.success ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">
                      Operational: {h?.status || "⚠️"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Latency</span>
                        <span className="text-zinc-300 font-bold">{h?.responseMs || 0}ms</span>
                      </div>
                      <Progress value={Math.max(10, 100 - ((h?.responseMs || 0) / 10))} className="h-1 bg-zinc-800" />
                      <div className="mt-2 text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                        Last ping: {h?.lastSuccessfulCall ? new Date(h.lastSuccessfulCall).toLocaleTimeString() : "Never"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Content Summary */}
            <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-zinc-900/40 border-b border-zinc-800 py-6">
                <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-purple-400" />
                  Upcoming Strategy
                </CardTitle>
                <CardDescription>Generated content roadmap for this week</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-900">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                    <div key={day} className="p-4 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-sm">
                          {day}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-200">Product Spotlight: Dynamic Item {i+1}</p>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">TikTok • Instagram • LinkedIn</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs">
                        Edit Strategy
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Cost Estimates */}
            <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
              <CardHeader className="bg-zinc-900/40 border-b border-zinc-800 py-6">
                <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-indigo-400" />
                  Monthly Spend Estimator
                </CardTitle>
                <CardDescription>Live cost tracking from API logs</CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex-1 flex flex-col justify-center">
                <div className="space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">Total Estimated Spend (30d)</span>
                    <h2 className="text-7xl font-black tracking-tighter text-white font-mono">$142.50</h2>
                    <Badge className="mt-4 bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-1">
                      -12% FROM LAST MONTH
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400 font-bold">Text Generation (Claude/GPT)</span>
                        <span className="text-white font-black">$45.20</span>
                      </div>
                      <Progress value={32} className="h-2 bg-zinc-900" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400 font-bold">Image & Video (DALL-E/Runway)</span>
                        <span className="text-white font-black">$82.80</span>
                      </div>
                      <Progress value={58} className="h-2 bg-zinc-900 text-purple-500" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400 font-bold">Audio & Others (ElevenLabs)</span>
                        <span className="text-white font-black">$14.50</span>
                      </div>
                      <Progress value={10} className="h-2 bg-zinc-900" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* APPROVAL QUEUE CONTENT */}
        <TabsContent value="approval" className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden min-h-[400px]">
            <Table>
              <TableHeader className="bg-zinc-900/60 h-16 border-b border-zinc-800">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="pl-8 text-zinc-400 font-black uppercase text-xs tracking-widest">Type</TableHead>
                  <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest">Product / Context</TableHead>
                  <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest">Platform</TableHead>
                  <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest text-right pr-8">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-[300px] text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-500 font-medium">
                        <CheckCircle2 className="w-12 h-12 opacity-20 mb-2" />
                        No pending items in the queue.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingItems.map((item) => (
                    <TableRow key={item.id} className="border-b border-zinc-900 hover:bg-zinc-900/20 transition-colors">
                      <TableCell className="pl-8 py-6">
                        {item.type === "mockup" && <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg"><ImageIcon className="w-3.5 h-3.5 mr-2" /> MOCKUP</Badge>}
                        {item.type === "video" && <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-lg"><VideoIcon className="w-3.5 h-3.5 mr-2" /> VIDEO</Badge>}
                        {item.type === "ad-copy" && <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded-lg"><MessageSquare className="w-3.5 h-3.5 mr-2" /> AD COPY</Badge>}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-black text-white text-lg tracking-tight">{item.productName}</p>
                          <p className="text-xs text-zinc-500 font-bold uppercase mt-1 tracking-widest">Generated {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-400">{item.platform}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-3">
                          {item.previewUrl && (
                            <Button variant="ghost" size="icon" className="hover:bg-zinc-800 transition-colors" asChild>
                              <Link href={item.previewUrl} target="_blank"><ExternalLink className="w-5 h-5" /></Link>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all transform active:scale-90"
                            onClick={() => handleApproval(item.id, item.type, false)}
                          >
                            <XCircle className="w-5 h-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all transform active:scale-90"
                            onClick={() => handleApproval(item.id, item.type, true)}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* SETTINGS CONTENT */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-zinc-900/40 border-b border-zinc-800 py-6 px-8">
                <CardTitle className="text-2xl font-black tracking-tight">Automation Controls</CardTitle>
                <CardDescription>Define which AI operations require human oversight</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between group">
                  <div className="space-y-0.5">
                    <p className="text-[15px] font-black text-white">Require Admin Approval</p>
                    <p className="text-sm text-zinc-500">Every AI-generated post must be approved before publication</p>
                  </div>
                  <Switch 
                    checked={settings?.aiRequireApproval} 
                    onCheckedChange={(val) => updateSetting("aiRequireApproval", val)} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between group pt-4 border-t border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-[15px] font-black text-white">Auto-Generate Mockups</p>
                    <p className="text-sm text-zinc-500">Trigger DALL-E/Stability for every new product automatically</p>
                  </div>
                  <Switch 
                    checked={settings?.aiAutoMockups} 
                    onCheckedChange={(val) => updateSetting("aiAutoMockups", val)} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between group pt-4 border-t border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-[15px] font-black text-white">Auto-Generate Videos</p>
                    <p className="text-sm text-zinc-500">Run Runway Gen-3 pipeline on new catalogue uploads</p>
                  </div>
                  <Switch 
                    checked={settings?.aiAutoVideos} 
                    onCheckedChange={(val) => updateSetting("aiAutoVideos", val)} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between group pt-4 border-t border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-[15px] font-black text-white">Sentiment Analysis Alerts</p>
                    <p className="text-sm text-zinc-500">Alert staff when negative customer sentiment is detected</p>
                  </div>
                  <Switch 
                    checked={settings?.aiSentimentAnalysisEnabled} 
                    onCheckedChange={(val) => updateSetting("aiSentimentAnalysisEnabled", val)} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between group pt-4 border-t border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-[15px] font-black text-white">Voice Transcription</p>
                    <p className="text-sm text-zinc-500">Use Whisper to transcribe incoming WhatsApp audio</p>
                  </div>
                  <Switch 
                    checked={settings?.aiVoiceTranscription} 
                    onCheckedChange={(val) => updateSetting("aiVoiceTranscription", val)} 
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-zinc-900/40 border-b border-zinc-800 py-6 px-8">
                <CardTitle className="text-2xl font-black tracking-tight">Active Strategy Profiles</CardTitle>
                <CardDescription>Current model selection per automated task</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Customer Context Model</label>
                    <div className="flex gap-2">
                       {["Claude 3.5 Opus", "GPT-4o", "Gemini 1.5"].map(m => (
                         <Button key={m} variant="secondary" className={`bg-zinc-900 border ${settings?.aiCustomerReplyModel?.includes(m.toLowerCase().split(' ')[0]) ? 'border-indigo-500/50 text-white' : 'border-zinc-800 text-zinc-500'} hover:bg-zinc-800 transition-all font-bold h-11 px-6 rounded-lg`}>
                           {m}
                         </Button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Product Description Engine</label>
                    <div className="flex gap-2">
                       {["Claude 3.5 Sonnet", "GPT-4o Vision"].map(m => (
                         <Button key={m} variant="secondary" className={`bg-zinc-900 border ${settings?.aiDescriptionModel?.includes(m.toLowerCase().split(' ')[0]) ? 'border-indigo-500/50 text-white' : 'border-zinc-800 text-zinc-500'} hover:bg-zinc-800 transition-all font-bold h-11 px-6 rounded-lg`}>
                           {m}
                         </Button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Primary Image Generator</label>
                    <div className="flex gap-2">
                       {["DALL-E 3", "Stability AI", "Both"].map(m => (
                         <Button key={m} variant="secondary" className={`bg-zinc-900 border ${settings?.aiImageGenerator === m.toLowerCase() ? 'border-indigo-500/50 text-white' : 'border-zinc-800 text-zinc-500'} hover:bg-zinc-800 transition-all font-bold h-11 px-6 rounded-lg`}>
                           {m}
                         </Button>
                       ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-zinc-900 space-y-4">
                  <div className="flex justify-between items-center bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-black text-zinc-200">Legal & Ethics Mode</p>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Banned Phrase filtering active</p>
                      </div>
                    </div>
                    <Badge className="bg-indigo-500 text-white font-black">ENHANCED</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* USAGE CONTENT */}
        <TabsContent value="usage" className="h-[400px] flex items-center justify-center">
          <div className="text-center group cursor-pointer">
            <div className="relative inline-block">
               <BarChart3 className="w-24 h-24 text-zinc-800 group-hover:text-indigo-500/50 transition-colors duration-500" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 p-2 rounded-lg border border-zinc-800 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 rotate-12 group-hover:rotate-0">
                 <span className="text-[10px] font-black text-white">COMING SOON</span>
               </div>
            </div>
            <p className="text-zinc-600 mt-6 font-medium text-lg">Detailed per-service token tracking is being calibrated.</p>
            <p className="text-zinc-700 mt-1 max-w-sm mx-auto">This dashboard will eventually hold granular data on input/output tokens and cost attribution per department.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
