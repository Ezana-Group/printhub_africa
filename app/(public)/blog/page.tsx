import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | PrintHub Africa - Design & Print Insights",
  description: "Stay updated with the latest trends in custom printing, branding, and design across East Africa.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <div className="relative py-24 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent)]" />
        <div className="container relative px-6 mx-auto text-center">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 py-1 px-4 text-xs font-bold uppercase tracking-widest leading-none rounded-full">
               PrintHub Insights
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                The <span className="text-primary italic">Creative</span> Journal
            </h1>
            <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                Expert tips on branding, custom apparel, and high-impact printing for Kenyan businesses and individuals.
            </p>
        </div>
      </div>

      <div className="container px-6 py-20 mx-auto">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-500">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">Our journal is currently being curated.</h2>
            <p className="text-slate-500">Check back soon for expert printing insights and creative branding tips.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group h-full flex flex-col">
                <Card className="flex flex-col h-full border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/10 rounded-[32px] overflow-hidden transition-all duration-500 group-hover:-translate-y-2">
                  <div className="relative h-56 bg-slate-200 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-4 right-4 z-20">
                    {post.tags.slice(0, 1).map((tag) => (
                      <Badge key={tag} className="bg-white/90 backdrop-blur-sm text-slate-900 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                        {tag}
                      </Badge>
                    ))}
                    </div>
                  </div>
                  
                  <CardHeader className="pt-8 pb-4 px-8">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" }) : "Coming Soon"}
                      </div>
                      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        5 min read
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors duration-300">
                      {post.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="px-8 pb-8 flex-1">
                    <p className="text-slate-500 line-clamp-3 text-sm font-medium leading-relaxed opacity-80">
                      {post.excerpt || "Dive into our latest insights on modern printing technologies and high-impact branding strategies for the East African market."}
                    </p>
                  </CardContent>

                  <CardFooter className="px-8 pb-10 pt-0">
                    <div className="w-full flex items-center justify-between group/btn">
                      <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        Read Full Story
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
