"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  PenSquare, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ExternalLink,
  Share2,
  Filter,
  RefreshCcw,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/blog");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error(error);
      toast.error("Could not load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/blog/${id}/publish`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to publish");
      toast.success("Article published!");
      fetchPosts();
    } catch (error) {
      toast.error("Publishing failed");
    }
  };

  const handleGenerate = async () => {
    if (!topic) return toast.error("Please enter a topic");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic })
      });
      if (!response.ok) throw new Error("Failed to start generation");
      toast.success("AI is currently writing your article. Check back in 2 minutes.");
      setTopic("");
    } catch (error) {
      toast.error("Generation failed to start");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.targetKeyword?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 backdrop-blur-md shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
        <div className="z-10">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">Content Engine</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Blog & SEO Content
          </h1>
          <p className="text-zinc-400 mt-2 text-lg font-medium">Manage AI-generated articles and omni-channel syndication.</p>
        </div>
        <div className="flex gap-3 mt-6 md:mt-0 z-10">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 h-14 px-8 rounded-2xl font-bold transition-all active:scale-95"
              >
                <Sparkles className="mr-2 h-5 w-5 text-indigo-400" /> AI Writer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 shadow-2xl text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">AI Content Generation</DialogTitle>
                <DialogDescription className="text-zinc-500">
                  Enter a topic or product name. Our AI will research, write, and SEO-optimise a {topic && topic.length > 5 ? 'detailed' : ''} blog post.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5 px-1">Article Topic / Target Keyword</label>
                <Input 
                  placeholder="e.g., Best Large Format Printers for Small Businesses in Kenya" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-14 bg-zinc-900 border-zinc-800 text-lg font-bold rounded-xl focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <DialogFooter>
                <Button 
                  className="w-full h-14 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 border-0"
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic}
                >
                  {isGenerating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Start Generation Pipeline"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            className="bg-white text-black hover:bg-zinc-200 h-14 px-8 rounded-2xl font-bold shadow-xl transition-all active:scale-95"
            asChild
          >
            <Link href="/admin/blog/new">
              <PenSquare className="mr-2 h-5 w-5" /> Manual Draft
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl hover:border-indigo-500/50 transition-colors group rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex justify-between items-center font-black uppercase text-xs tracking-widest text-zinc-500">
              Pending Drafts
              <Clock className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-black text-white">{posts.filter(p => p.status === "DRAFT").length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl hover:border-green-500/50 transition-colors group rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex justify-between items-center font-black uppercase text-xs tracking-widest text-zinc-500">
              Published Live
              <CheckCircle2 className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-black text-white">{posts.filter(p => p.status === "PUBLISHED").length}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl hover:border-purple-500/50 transition-colors group rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex justify-between items-center font-black uppercase text-xs tracking-widest text-zinc-500">
              AI Generated
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[8px]">CORE ENGINE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-black text-white">{posts.filter(p => p.aiGenerated).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
        <Input 
          placeholder="Filter by title, slug, or target keyword..." 
          className="h-20 pl-16 pr-8 bg-zinc-950 border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 shadow-2xl text-xl rounded-2xl transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="bg-zinc-950 border-zinc-800 overflow-hidden shadow-2xl rounded-3xl">
        <Table>
          <TableHeader className="bg-zinc-900/60 h-20 border-b border-zinc-800">
            <TableRow className="hover:bg-transparent border-0">
              <TableHead className="pl-10 text-zinc-400 font-black uppercase text-xs tracking-widest w-[40%]">Article & Context</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest">Distribution</TableHead>
              <TableHead className="text-zinc-400 font-black uppercase text-xs tracking-widest">Status</TableHead>
              <TableHead className="text-right text-zinc-400 font-black uppercase text-xs tracking-widest pr-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-24 text-zinc-500 animate-pulse">Scanning database for content...</TableCell></TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-24 text-zinc-500">No blog posts found matching your search.</TableCell></TableRow>
            ) : filteredPosts.map((post) => (
              <TableRow key={post.id} className="border-zinc-900 hover:bg-zinc-900/20 transition-all h-28 group">
                <TableCell className="pl-10">
                  <div className="font-black text-white text-xl tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{post.title}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className="bg-zinc-900 text-zinc-500 border-zinc-800 font-bold px-2 py-0.5">
                      {post.targetKeyword || "No Keyword"}
                    </Badge>
                    <span className="text-zinc-600 text-xs font-medium">Published {new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.aiGenerated && (
                      <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black tracking-widest">AI</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-3">
                     <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${post.mediumUrl ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-zinc-900 bg-zinc-900/40 text-zinc-700'}`}>
                        <Globe className="w-5 h-5" />
                     </div>
                     <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${post.linkedinPostUrl ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' : 'border-zinc-900 bg-zinc-900/40 text-zinc-700'}`}>
                        <Share2 className="w-5 h-5" />
                     </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`px-4 py-1.5 rounded-lg font-black tracking-tight ${
                    post.status === "PUBLISHED" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }`}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-10">
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-900 hover:text-white transition-all transform active:scale-90" asChild title="View Public Post">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-900 hover:text-yellow-400 transition-all transform active:scale-90" asChild title="Edit Content">
                      <Link href={`/admin/blog/${post.id}`}>
                        <PenSquare className="w-5 h-5" />
                      </Link>
                    </Button>
                    {post.status === "DRAFT" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-zinc-900 hover:text-green-400 transition-all transform active:scale-90"
                        onClick={() => handlePublish(post.id)}
                        title="Publish Live"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-900 hover:text-red-400 transition-all transform active:scale-90" title="Delete Permanent">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      <div className="pb-12 text-center">
         <p className="text-zinc-600 font-medium">Omnichannel syncing pushes to Medium and LinkedIn automatically upon publication.</p>
      </div>
    </div>
  );
}
