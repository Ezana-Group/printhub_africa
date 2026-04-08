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
  Zap
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
        <CardContent>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* GOOGLE MERCHANT CENTER */}
            <div className="space-y-4">
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
                <li>Set fetch frequency to <strong>Daily</strong>.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <a href="https://merchants.google.com/" target="_blank">
                  Open GMC Dashboard <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>

            {/* META COMMERCE MANAGER */}
            <div className="space-y-4 text-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Facebook className="w-5 h-5 ml-0.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Meta (FB & IG)</h4>
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">Catalogue Manager</Badge>
                </div>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                <li>Go to <strong>Data Sources &gt; Add Items</strong>.</li>
                <li>Select <strong>Data Feed</strong> option.</li>
                <li>Select <strong>Scheduled Feed</strong> and paste URL.</li>
                <li>Ensure automatic updates are enabled.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <a href="https://business.facebook.com/commerce" target="_blank">
                  Open Meta Commerce <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>

            {/* TIKTOK SHOP */}
            <div className="space-y-4">
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
                <li>Upload items via <strong>Data Feed</strong>.</li>
                <li>Choose <strong>Scheduled Update</strong> type.</li>
              </ul>
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <a href="https://ads.tiktok.com/marketing_api/auth?app_id=123" target="_blank">
                  Open TikTok Ads <ExternalLink className="w-3 h-3 ml-2" />
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
