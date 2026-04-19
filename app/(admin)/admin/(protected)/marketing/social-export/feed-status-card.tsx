"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Copy, ExternalLink, RefreshCw } from "lucide-react";

export function FeedStatusCard() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing/feed-health");
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const copyUrl = (id: string, platform: string) => {
    const url = `${window.location.origin}/api/products/${platform}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const feeds = [
    { id: "universal", label: "Universal Feed", platform: "feed", desc: "All-in-one JSON feed for custom integrations." },
    { id: "google", label: "Google Merchant Center", platform: "google", desc: "For Google Shopping ads." },
    { id: "meta", label: "Meta (Facebook/Instagram)", platform: "feed?platform=meta", desc: "For IG Shopping and FB marketplace." },
    { id: "tiktok", label: "TikTok Shop", platform: "tiktok", desc: "For TikTok product showcases." },
    { id: "linkedin", label: "LinkedIn Ads", platform: "linkedin", desc: "For professional product retargeting." },
    { id: "pinterest", label: "Pinterest Catalog", platform: "pinterest", desc: "For product pins." },
    { id: "x", label: "X (Twitter) Ads", platform: "x", desc: "For X product cards." },
    { id: "googlebiz", label: "Google Business Profile", platform: "google-business", desc: "For local business product listings." },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {feeds.map((feed) => {
        const count = feed.id === "universal" 
          ? healthData?.totalProducts 
          : healthData?.feeds?.[feed.id === "googlebiz" ? "google-business" : feed.id] || 0;
        const total = healthData?.totalProducts || 0;

        return (
          <div key={feed.id} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col group hover:border-primary/50 transition-all duration-300">
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{feed.label}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{feed.desc}</p>
                </div>
                {loading ? (
                  <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                ) : count > 0 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 fill-amber-500/10" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Items in Feed</span>
                  <span>{loading ? "..." : `${count} / ${total}`}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: loading ? "0%" : `${(count / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-2 px-3 border-t flex items-center justify-between gap-2">
              <button
                onClick={() => copyUrl(feed.id, feed.platform)}
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-1.5 px-2 rounded-md hover:bg-white"
              >
                {copied === feed.id ? <span className="text-emerald-500">Copied!</span> : <><Copy className="w-3 h-3" /> Copy URL</>}
              </button>
              <a
                href={`/api/products/${feed.platform}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-white text-muted-foreground hover:text-primary transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
