import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    if (!post) return { title: "Post Not Found" };
    return {
      title: `${post.title} | PrintHub Africa Blog`,
      description: post.metaDescription || post.excerpt || "Expert insights on printing and branding in Kenya.",
      openGraph: {
        title: post.title,
        description: post.metaDescription || post.excerpt || "",
        type: "article",
        publishedTime: post.publishedAt?.toISOString(),
        tags: post.tags,
      },
    };
  } catch {
    return { title: "Blog | PrintHub Africa" };
  }
}

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="container max-w-4xl px-6 py-16 mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary mb-12 hover:opacity-80 transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Journal
          </Link>
          
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
                {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/10 shadow-inner">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-slate-900">PrintHub Editorial</span>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-300 pl-6">
                    <Calendar className="w-4 h-4 text-primary" />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-KE", { month: "long", day: "numeric", year: "numeric" }) : "Recently Published"}
                </div>
                <div className="flex items-center gap-2 border-l border-slate-300 pl-6">
                    <Clock className="w-4 h-4 text-primary" />
                    5 min read
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <main className="container max-w-4xl px-6 py-20 mx-auto">
        <div className="prose prose-slate lg:prose-xl max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-[32px] prose-img:shadow-2xl">
          <div dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
        </div>
        
        {/* Social Share Footer */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-wrap items-center justify-between gap-6">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                <Share2 className="w-4 h-4 text-primary" />
                Spread the knowledge
            </div>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="rounded-full border-slate-200 hover:bg-primary/5 hover:text-primary text-slate-600 transition-all font-bold tracking-tight">
                    <Facebook className="w-4 h-4 mr-2" /> Facebook
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-slate-200 hover:bg-primary/5 hover:text-primary text-slate-600 transition-all font-bold tracking-tight">
                    <Twitter className="w-4 h-4 mr-2" /> Twitter
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-slate-200 hover:bg-primary/5 hover:text-primary text-slate-600 transition-all font-bold tracking-tight">
                    <Linkedin className="w-4 h-4 mr-2" /> LinkedIn
                </Button>
            </div>
        </div>
      </main>

      {/* Recommended Footer */}
      <div className="bg-slate-50 border-t border-slate-200 py-20">
        <div className="container max-w-4xl px-6 mx-auto text-center">
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-none italic uppercase py-1">Ready for impact?</h3>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed opacity-80 decoration-primary/20 underline-offset-8">Experience professional-grade printing that brings your design ideas to life across East Africa.</p>
            <div className="flex justify-center gap-4">
                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 px-10 h-14" asChild>
                    <Link href="/catalogue">Explore Catalogue</Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-full border-slate-300 hover:bg-white text-slate-700 font-bold px-10 h-14" asChild>
                    <Link href="/contact">Request Custom Quote</Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
