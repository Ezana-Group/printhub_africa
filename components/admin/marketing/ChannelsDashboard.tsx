"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, CheckCircle2, XCircle, AlertCircle, Trash2, Globe, ShoppingCart, MessageSquare, Tag } from "lucide-react";
import { toast } from "sonner";

interface Props {
  channels: any[];
  baseUrl: string;
  config: any;
}

export function ChannelsDashboard({ channels, baseUrl, config }: Props) {
  const [testing, setTesting] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/channels/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all marketing error logs?")) return;
    try {
      const res = await fetch("/api/admin/channels/logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        toast.success("Logs cleared");
      }
    } catch (error) {
      toast.error("Failed to clear logs");
    }
  };

  const testFeed = async (name: string, url: string) => {
    setTesting(name);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const count = (text.match(/<item>/g) || []).length || (text.match(/"id":/g) || []).length;
        toast.success(`${name}: Feed is valid. Found ${count} items.`);
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (error: any) {
      toast.error(`${name}: Feed test failed. ${error.message}`);
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-6">
        {channels.map((channel) => (
          <Card key={channel.name} className="overflow-hidden border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    {channel.name.includes("Meta") && <Globe className="w-5 h-5 text-blue-600" />}
                    {channel.name.includes("Google") && <ShoppingCart className="w-5 h-5 text-red-500" />}
                    {channel.name.includes("TikTok") && <MessageSquare className="w-5 h-5 text-black" />}
                    {channel.name.includes("Pinterest") && <Tag className="w-5 h-5 text-red-600" />}
                    {!channel.name.match(/Meta|Google|TikTok|Pinterest/) && <RefreshCw className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    {channel.enabled ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 mt-1">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 mt-1">Disabled</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {channel.feedUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => testFeed(channel.name, channel.feedUrl)}
                      disabled={testing === channel.name}
                      className="h-8 gap-2"
                    >
                      {testing === channel.name ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Test Feed
                    </Button>
                  )}
                  {channel.feedUrl && (
                    <Button variant="ghost" size="sm" asChild className="h-8 text-slate-500">
                      <a href={channel.feedUrl} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pixel / Tag ID</p>
                  <p className="text-sm font-mono text-slate-600">{channel.pixelId || "Not Set"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversions API</p>
                  <div className="flex items-center gap-2">
                    {channel.capi ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-slate-600">Enabled (Server-side)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-300" />
                        <span className="text-sm text-slate-400">Client-side only</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <p className="text-sm text-slate-600 font-medium">Monitoring events...</p>
                </div>
              </div>
              
              {channel.feedUrl && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Product Feed URL</p>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <code className="text-[12px] text-slate-600 truncate flex-1">{channel.feedUrl}</code>
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => {
                        navigator.clipboard.writeText(channel.feedUrl!);
                        toast.success("Copied to clipboard");
                    }}>
                      Copy URL
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- MARKETING ERROR LOGS --- */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-amber-500" />
               Marketing Error Logs
            </CardTitle>
            <CardDescription>Recent integration failures and API errors.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loadingLogs}>
              <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-10" />
                No errors recorded. All systems healthy.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Error</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-[10px]">{log.channel}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-medium">{log.error}</div>
                        {log.payload && (
                          <pre className="mt-1 text-[10px] text-slate-400 bg-slate-50 p-2 rounded max-w-sm overflow-hidden text-ellipsis">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
