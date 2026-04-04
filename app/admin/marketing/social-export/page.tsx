"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Share2, 
  Globe, 
  ShoppingBag, 
  Search, 
  Filter,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Video,
  Smartphone,
  CloudUpload,
  ArrowUpRight,
  Monitor
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: { name: string };
  [key: string]: any;
}

export default function SocialExportPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing/social-export");
      if (!res.ok) throw new Error("Failed to fetch export data");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error("Error loading export data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExport = async (productId: string, field: string, value: boolean) => {
    try {
      const res = await fetch("/api/admin/marketing/social-export", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, field, value })
      });
      if (!res.ok) throw new Error("Failed to update export status");
      
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p));
      toast.success(`Export updated: ${field}`);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 animate-pulse">Initialising distribution engine...</p>
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
            <Globe className="w-6 h-6 text-indigo-400" />
            <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">Omnichannel Distribution</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Social & Export Matrix
          </h1>
          <p className="text-zinc-400 mt-3 text-lg font-medium">Monitoring sync status across 26 configured endpoints.</p>
        </div>
        <div className="flex gap-3 mt-6 md:mt-0 z-10">
          <Button 
            variant="outline" 
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 h-14 px-8 rounded-2xl font-bold transition-all active:scale-95"
          >
            Download Manifest
          </Button>
          <Button 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-14 px-10 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 border-0 transition-all active:scale-95 group"
          >
            <CloudUpload className="mr-2 h-5 w-5 group-hover:-translate-y-1 transition-transform" /> Mass Sync All
          </Button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
        <Input 
          placeholder="Search by product name or category..." 
          className="h-20 pl-16 pr-8 bg-zinc-950 border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 shadow-2xl text-xl rounded-3xl transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-x-auto min-h-[500px]">
        <Table className="min-w-[1200px]">
          <TableHeader className="bg-zinc-900/60 h-20 border-b border-zinc-800">
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="pl-10 text-zinc-400 font-black uppercase text-xs tracking-widest w-[300px]">Product</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest text-center">Search & Web</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest text-center">Major Socials</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest text-center">Video & Mobile</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest text-center">Commerce (KE)</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest text-right pr-10">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[400px] text-center">
                  <div className="flex flex-col items-center gap-3 text-zinc-500 font-medium">
                    <Filter className="w-16 h-16 opacity-10 mb-2" />
                    No products matching your search.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => (
                <TableRow key={p.id} className="border-b border-zinc-900 hover:bg-zinc-900/20 transition-all group h-24">
                  <TableCell className="pl-10">
                    <div>
                      <p className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors uppercase truncate max-w-[200px]">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">{p.category.name}</p>
                    </div>
                  </TableCell>
                  
                  {/* Search & Web */}
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-3">
                       <div className="flex flex-col items-center gap-1.5" title="Google Search">
                          <Monitor className="w-3.5 h-3.5 text-blue-400" />
                          <Switch checked={p.exportToGoogle} onCheckedChange={(val) => toggleExport(p.id, "exportToGoogle", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="Google Business">
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                          <Switch checked={p.exportToGoogleBiz} onCheckedChange={(val) => toggleExport(p.id, "exportToGoogleBiz", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="Google Maps">
                          <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                          <Switch checked={p.exportToGoogleMapsPost} onCheckedChange={(val) => toggleExport(p.id, "exportToGoogleMapsPost", val)} className="scale-75" />
                       </div>
                    </div>
                  </TableCell>

                  {/* Major Socials */}
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-3">
                       <div className="flex flex-col items-center gap-1.5" title="Meta / FB">
                          <Monitor className="w-3.5 h-3.5 text-blue-600" />
                          <Switch checked={p.exportToMeta} onCheckedChange={(val) => toggleExport(p.id, "exportToMeta", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="LinkedIn">
                          <Share2 className="w-3.5 h-3.5 text-blue-700" />
                          <Switch checked={p.exportToLinkedIn} onCheckedChange={(val) => toggleExport(p.id, "exportToLinkedIn", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="Twitter / X">
                          <Share2 className="w-3.5 h-3.5 text-zinc-100" />
                          <Switch checked={p.exportToX} onCheckedChange={(val) => toggleExport(p.id, "exportToX", val)} className="scale-75" />
                       </div>
                    </div>
                  </TableCell>

                  {/* Video & Mobile */}
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-3">
                       <div className="flex flex-col items-center gap-1.5" title="TikTok">
                          <Video className="w-3.5 h-3.5 text-pink-500" />
                          <Switch checked={p.exportToTiktok} onCheckedChange={(val) => toggleExport(p.id, "exportToTiktok", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="Instagram Reels">
                          <Video className="w-3.5 h-3.5 text-purple-500" />
                          <Switch checked={p.exportToInstagramReels} onCheckedChange={(val) => toggleExport(p.id, "exportToInstagramReels", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="WhatsApp Channel">
                          <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                          <Switch checked={p.exportToWhatsappChannel} onCheckedChange={(val) => toggleExport(p.id, "exportToWhatsappChannel", val)} className="scale-75" />
                       </div>
                    </div>
                  </TableCell>

                  {/* Commerce (KE) */}
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-3">
                       <div className="flex flex-col items-center gap-1.5" title="Jiji Kenya">
                          <Badge className="text-[7px] w-4 h-4 p-0 flex items-center justify-center bg-green-800">JJ</Badge>
                          <Switch checked={p.exportToJiji} onCheckedChange={(val) => toggleExport(p.id, "exportToJiji", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="PigiaMe">
                          <Badge className="text-[7px] w-4 h-4 p-0 flex items-center justify-center bg-orange-600">PM</Badge>
                          <Switch checked={p.exportToPigiaMe} onCheckedChange={(val) => toggleExport(p.id, "exportToPigiaMe", val)} className="scale-75" />
                       </div>
                       <div className="flex flex-col items-center gap-1.5" title="Medium SEO">
                          <Badge className="text-[7px] w-4 h-4 p-0 flex items-center justify-center bg-zinc-100 text-black">M</Badge>
                          <Switch checked={p.exportToMedium} onCheckedChange={(val) => toggleExport(p.id, "exportToMedium", val)} className="scale-75" />
                       </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-3">
                       <Button variant="ghost" size="icon" className="hover:bg-zinc-900" asChild>
                          <Link href={`/p/${p.slug}`} target="_blank"><ExternalLink className="w-5 h-5 text-zinc-500 group-hover:text-white" /></Link>
                       </Button>
                       <Button variant="ghost" size="sm" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-4 font-bold rounded-xl h-10 transition-all border border-indigo-500/20">
                          Force Sync
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      <p className="text-zinc-600 text-sm font-medium text-center pb-12">
        Sync status is polled from n8n every 15 minutes. Swapped changes take immediate effect in the next cron cycle.
      </p>
    </div>
  );
}
