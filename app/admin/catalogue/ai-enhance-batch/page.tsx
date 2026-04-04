"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Play, 
  Loader2,
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
  Search,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  images: string[];
  category: { name: string };
  status?: "pending" | "processing" | "completed" | "failed";
}

export default function BatchEnhancePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalogue/unenhanced");
      if (!res.ok) throw new Error("Failed to fetch unenhanced products");
      const data = await res.json();
      setProducts(data.map((p: any) => ({ ...p, status: "pending" })));
    } catch (error) {
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enhanceSingle = async (productId: string) => {
    try {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: "processing" } : p));
      
      const res = await fetch("/api/admin/catalogue/enhance-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      
      if (!res.ok) throw new Error("Enhancement failed");
      
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: "completed" } : p));
      setCompletedCount(prev => prev + 1);
      return true;
    } catch (error) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: "failed" } : p));
      return false;
    }
  };

  const enhanceAll = async () => {
    const pendingProducts = products.filter(p => p.status === "pending" || p.status === "failed");
    if (pendingProducts.length === 0) {
      toast.info("No pending products to enhance");
      return;
    }

    setIsEnhancing(true);
    setCompletedCount(0);
    
    // Process in batches of 5 to avoid overloading the n8n instance or hitting rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < pendingProducts.length; i += BATCH_SIZE) {
      const batch = pendingProducts.slice(i, i + BATCH_SIZE);
      setCurrentBatchIndex(i + batch.length);
      
      const batchPromises = batch.map(p => enhanceSingle(p.id));
      await Promise.all(batchPromises);
      
      // Artificial delay between batches for stability
      if (i + BATCH_SIZE < pendingProducts.length) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    setIsEnhancing(false);
    toast.success(`Batch processing complete! Enhanced ${completedCount} products.`);
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
          <p className="text-zinc-500 animate-pulse">Scanning catalogue for unenhanced items...</p>
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
            <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">Mass Processing</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Batch AI Enhance
          </h1>
          <p className="text-zinc-400 mt-3 text-lg font-medium">Auto-generate descriptions and marketing copy for bulk uploads.</p>
        </div>
        <div className="flex gap-3 mt-6 md:mt-0 z-10">
          <Button 
            variant="outline" 
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 h-14 px-8 rounded-2xl font-bold transition-all active:scale-95"
            onClick={fetchData}
            disabled={isEnhancing}
          >
            <RefreshCcw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> Scan All
          </Button>
          <Button 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 h-14 px-10 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 border-0 transition-all active:scale-95 group"
            onClick={enhanceAll}
            disabled={isEnhancing || products.length === 0}
          >
            {isEnhancing ? (
               <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enhancing...</>
            ) : (
               <><Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> Enhance All Queue</>
            )}
          </Button>
        </div>
      </div>

      {isEnhancing && (
        <Card className="bg-zinc-950 border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-500 animate-shimmer" />
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
                <Badge className="bg-indigo-500/20 text-indigo-400 animate-pulse">PROCESSING BATCH</Badge>
                <p className="font-black text-white text-lg">Running AI Pipeline...</p>
             </div>
             <p className="text-zinc-500 font-bold">{currentBatchIndex} of {products.length} Items</p>
          </div>
          <Progress value={(currentBatchIndex / products.length) * 100} className="h-4 bg-zinc-900 rounded-full" />
          <div className="mt-6 grid grid-cols-4 gap-4">
             <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Completed</span>
                <span className="text-white font-black">{completedCount}</span>
             </div>
             <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between text-yellow-400">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Remaining</span>
                <span className="font-black">{products.length - currentBatchIndex}</span>
             </div>
             <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between text-red-400">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Errors</span>
                <span className="font-black">{products.filter(p => p.status === 'failed').length}</span>
             </div>
             <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between text-indigo-400">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Stream</span>
                <span className="font-black text-[10px]">5 CONCURRENT</span>
             </div>
          </div>
        </Card>
      )}

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
        <Input 
          placeholder="Filter unenhanced products by name or category..." 
          className="h-20 pl-16 pr-8 bg-zinc-950 border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 shadow-2xl text-xl rounded-3xl transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="bg-zinc-950 border-zinc-800 shadow-2xl rounded-3xl overflow-hidden min-h-[500px]">
        <Table>
          <TableHeader className="bg-zinc-900/60 h-20 border-b border-zinc-800">
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="pl-10 text-zinc-400 font-black uppercase text-xs tracking-widest">Image</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest">Product Information</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest">Status</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest text-right pr-10">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-[400px] text-center">
                  <div className="flex flex-col items-center gap-3 text-zinc-500 font-medium">
                    <CheckCircle2 className="w-16 h-16 opacity-10 mb-2" />
                    All products have descriptions!
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => (
                <TableRow key={p.id} className="border-b border-zinc-900 hover:bg-zinc-900/20 transition-all group h-32">
                  <TableCell className="pl-10">
                    <div className="w-20 h-20 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group-hover:scale-105 transition-transform">
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900"><Zap className="w-6 h-6" /></div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-black text-white text-xl tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{p.name}</p>
                      <div className="flex items-center gap-3">
                         <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{p.category.name}</span>
                         <span className="w-1 h-1 rounded-full bg-zinc-800" />
                         <span className="text-xs text-zinc-600 font-medium tracking-tight">Created {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.status === "pending" && <Badge className="bg-zinc-900/50 text-zinc-500 border-zinc-800 h-9 px-4 rounded-xl font-bold"><Clock className="w-3 h-3 mr-2" /> PENDING</Badge>}
                    {p.status === "processing" && <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 h-9 px-4 rounded-xl font-bold animate-pulse"><Loader2 className="w-3 h-3 mr-2 animate-spin" /> ENHANCING</Badge>}
                    {p.status === "completed" && <Badge className="bg-green-500/10 text-green-400 border-green-500/20 h-9 px-4 rounded-xl font-bold"><CheckCircle2 className="w-3 h-3 mr-2" /> COMPLETED</Badge>}
                    {p.status === "failed" && <Badge className="bg-red-500/10 text-red-500 border-red-500/20 h-9 px-4 rounded-xl font-bold"><AlertTriangle className="w-3 h-3 mr-2" /> FAILED</Badge>}
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-3">
                      <Button variant="ghost" size="icon" className="hover:bg-zinc-900 transition-all" asChild>
                         <Link href={`/admin/products/${p.id}`}><Eye className="w-5 h-5 text-zinc-500 hover:text-white" /></Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-6 font-bold rounded-xl h-10 transition-all transform active:scale-95"
                        onClick={() => enhanceSingle(p.id)}
                        disabled={isEnhancing || p.status === "processing" || p.status === "completed"}
                      >
                         {p.status === "completed" ? "Refined" : "Enhance"} <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      <div className="pb-12 text-center">
         <p className="text-zinc-600 font-medium">Batch processing uses high-latency LLM models. For large catalogues, process in small groups.</p>
      </div>
    </div>
  );
}
