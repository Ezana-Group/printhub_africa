"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, PenSquare, Eye, Trash2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.targetKeyword?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-xl">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Blog & SEO Content
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">Manage AI-generated articles and SEO performance.</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 px-6 py-6 h-auto text-lg transition-all active:scale-95"
          asChild
        >
          <Link href="/admin/blog/new">
            <PenSquare className="mr-2 h-5 w-5" /> Write New Post
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl hover:border-indigo-500/50 transition-colors group">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Pending Drafts
              <Clock className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </CardTitle>
            <CardDescription className="text-zinc-500">Awaiting admin review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{posts.filter(p => p.status === "DRAFT").length}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl hover:border-green-500/50 transition-colors group">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Published
              <CheckCircle2 className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
            </CardTitle>
            <CardDescription className="text-zinc-500">Live on PrintHub Africa</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{posts.filter(p => p.status === "PUBLISHED").length}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl hover:border-purple-500/50 transition-colors group">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              AI Generated
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">SMART ENGINE</span>
            </CardTitle>
            <CardDescription className="text-zinc-500">Articles created by AI</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{posts.filter(p => p.aiGenerated).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <Input 
          placeholder="Search by title or keyword..." 
          className="pl-12 bg-zinc-900/50 border-zinc-800 h-14 text-lg rounded-xl focus:ring-2 focus:ring-indigo-500/50 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="bg-zinc-950 border-zinc-800 overflow-hidden shadow-2xl rounded-2xl">
        <Table>
          <TableHeader className="bg-zinc-900/80">
            <TableRow className="hover:bg-transparent border-zinc-800">
              <TableHead className="text-zinc-300 font-bold py-5">TITLE & DATE</TableHead>
              <TableHead className="text-zinc-300 font-bold py-5">TARGET KEYWORD</TableHead>
              <TableHead className="text-zinc-300 font-bold py-5">STATUS</TableHead>
              <TableHead className="text-right text-zinc-300 font-bold py-5 pr-8">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-zinc-500 animate-pulse">Loading blog posts...</TableCell></TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-zinc-500">No blog posts found matching your search.</TableCell></TableRow>
            ) : filteredPosts.map((post) => (
              <TableRow key={post.id} className="border-zinc-900 hover:bg-zinc-900/30 transition-colors">
                <TableCell className="py-6">
                  <div className="font-bold text-white text-lg">{post.title}</div>
                  <div className="text-zinc-500 text-sm mt-1">
                    {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 px-3 py-1 rounded-md">
                    {post.targetKeyword || "No Keyword"}
                  </Badge>
                  {post.aiGenerated && (
                    <Badge className="ml-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">AI</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={
                    post.status === "PUBLISHED" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  }>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-800 hover:text-white transition-colors" asChild>
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Eye className="w-5 h-5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-800 hover:text-yellow-400 transition-colors" asChild>
                      <Link href={`/admin/blog/${post.id}`}>
                        <PenSquare className="w-5 h-5" />
                      </Link>
                    </Button>
                    {post.status === "DRAFT" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-zinc-800 hover:text-green-400 transition-colors"
                        onClick={() => handlePublish(post.id)}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="hover:bg-zinc-800 hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
