"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Instagram, 
  Facebook, 
  Search, 
  Share2,
  Info,
  ShieldCheck,
  Zap,
  Youtube,
  Ghost
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function CatalogueFeedLinks() {
  const [copied, setCopied] = useState(false);
  const feedUrl = "https://printhub.africa/api/feeds/products";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    toast.success("Feed URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Zap className="w-24 h-24 text-primary" />
        </div>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1 text-primary font-bold text-xs uppercase tracking-widest">
            <Globe className="w-3 h-3" /> Master Catalogue Feed
          </div>
          <CardTitle className="text-2xl font-bold">Product Feed Configuration</CardTitle>
          <CardDescription className="max-w-2xl">
            Use this master XML feed to sync your products automatically with major marketing platforms. 
            Any changes you make to products in the admin will update these channels every 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center gap-2 p-4 bg-white/80 backdrop-blur border-2 border-primary/20 rounded-xl shadow-inner">
            <code className="text-sm font-mono text-primary flex-1 break-all truncate">
              {feedUrl}
            </code>
            <Button 
              size="sm" 
              variant={copied ? "secondary" : "default"}
              onClick={copyToClipboard}
              className="px-6 font-bold"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy URL"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GOOGLE MERCHANT CENTER */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Google Merchant</h4>
                  <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">GMC + Shopping</Badge>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Go to <strong>Products &gt; Feeds</strong>.</li>
                <li>Add a new feed using <strong>Scheduled Fetch</strong>.</li>
                <li>Paste the URL above for the file path.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-[10px] h-8" asChild>
                <a href="https://merchants.google.com/" target="_blank">
                  Open GMC Dashboard <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>

            {/* META COMMERCE MANAGER */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Facebook className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Meta (FB & IG)</h4>
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">Catalogue Manager</Badge>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Go to <strong>Data Sources &gt; Add Items</strong>.</li>
                <li>Select <strong>Data Feed</strong> option.</li>
                <li>Choose <strong>Scheduled Feed</strong> and paste URL.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-[10px] h-8" asChild>
                <a href="https://business.facebook.com/commerce" target="_blank">
                  Open Meta Commerce <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>

            {/* TIKTOK SHOP */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">TikTok Shop</h4>
                  <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-200">Product Sync</Badge>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Go to <strong>Assets &gt; Catalog</strong>.</li>
                <li>Create catalog &amp; select <strong>Products</strong>.</li>
                <li>Choose <strong>Scheduled Update</strong> type.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-[10px] h-8" asChild>
                <a href="https://ads.tiktok.com/" target="_blank">
                  Open TikTok Ads <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>

            {/* YOUTUBE SHOPPING */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">YouTube Shop</h4>
                  <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">Channel Integration</Badge>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Requires <strong>Google Merchant Center</strong>.</li>
                <li>Link GMC account to your Channel.</li>
                <li>Tag products in Videos &amp; Shorts.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-[10px] h-8" asChild>
                <a href="https://studio.youtube.com/" target="_blank">
                  Open YouTube Studio <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>

            {/* PINTEREST */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-red-600 shadow-sm">
                  <Instagram className="w-5 h-5" /> 
                </div>
                <div>
                  <h4 className="font-bold text-sm">Pinterest</h4>
                  <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">Store Catalogs</Badge>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Go to <strong>Ads &gt; Catalogs</strong>.</li>
                <li>Create a <strong>Data Source</strong>.</li>
                <li>Use the XML URL for daily sync.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-[10px] h-8" asChild>
                <a href="https://business.pinterest.com/" target="_blank">
                  Open Pinterest Biz <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>

            {/* SNAPCHAT */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center text-black shadow-sm">
                  <Ghost className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Snapchat</h4>
                  <Badge variant="outline" className="text-[10px] text-slate-800 border-yellow-300">Snap Catalogs</Badge>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Go to <strong>Assets &gt; Catalogs</strong>.</li>
                <li>Select <strong>Add Products</strong>.</li>
                <li>Choose <strong>Scheduled Feed</strong> option.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-[10px] h-8" asChild>
                <a href="https://ads.snapchat.com/" target="_blank">
                  Open Snap Ads <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
        <div className="bg-primary/5 p-4 border-t border-primary/10 flex items-center gap-3 text-xs text-primary/70">
          <ShieldCheck className="w-4 h-4" />
          <p>
            <strong>GMC Compliance Hint:</strong> Ensure your Physical Address and Shipping Policy are published before submitting to Google to avoid "Misrepresentation" errors. 
          </p>
        </div>
      </Card>
    </div>
  );
}
