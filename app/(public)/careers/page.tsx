import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusinessPublic } from "@/lib/business-public";
import { JobStatus } from "@prisma/client";
import { CareersClient } from "./careers-client";

export async function generateMetadata() {
  const business = await getBusinessPublic();
  return {
    title: `Careers | ${business.businessName} — Build Kenya's Print Industry`,
    description: `Join ${business.businessName} in ${business.city}. We're growing and looking for people who take pride in their craft. Open roles in production, design, sales, and more.`,
  };
}

export const revalidate = 300;

async function getJobs() {
  const listings = await prisma.jobListing.findMany({
    where: { status: JobStatus.PUBLISHED },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      department: true,
      type: true,
      location: true,
      isRemote: true,
      description: true,
      applicationDeadline: true,
      isFeatured: true,
      showSalary: true,
      salaryMin: true,
      salaryMax: true,
    },
  });
  return listings.map((l) => ({
    ...l,
    description: l.description?.slice(0, 400) + (l.description && l.description.length > 400 ? "…" : ""),
    applicationDeadline: l.applicationDeadline?.toISOString() ?? null,
  }));
}

export default async function CareersPage() {
  const [jobs, business] = await Promise.all([getJobs(), getBusinessPublic()]);
  const openCount = jobs.length;

  return (
    <div className="bg-[#0A0A0A] text-white">
      {/* HERO */}
      <section className="px-4 md:px-6 lg:px-8 pt-24 pb-16 md:pt-28">
        <div className="container max-w-4xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
            CAREERS AT {business.businessName.toUpperCase()}
          </p>
          <h1 className="font-display font-extrabold text-[36px] md:text-[64px] leading-[1.1] text-white">
            Build Kenya&apos;s
            <br />
            Print Industry.
          </h1>
          <p className="font-body text-lg text-white/60 mt-6 max-w-xl">
            We&apos;re growing and we&apos;re looking for people who take pride in
            their craft. Join a team that&apos;s redefining what professional
            printing looks like in Kenya.
          </p>
          <div className="font-body text-sm text-white/50 mt-6">
            {openCount} Open Role{openCount !== 1 ? "s" : ""} · {business.city}, {business.country} ·
            Hybrid & On-site
          </div>
          <a
            href="#open-positions"
            className="inline-flex items-center gap-2 mt-8 text-white/70 hover:text-white font-body text-sm"
          >
            <span className="animate-bounce">↓</span> See open roles
          </a>
        </div>
      </section>

      {/* WHY WORK HERE */}
      <section className="bg-[#111111] py-20 px-4 md:px-6 lg:px-8">
        <div className="container max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-white mb-12">
            Why Join {business.businessName}?
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              {
                emoji: "🏆",
                title: "Grow with Us",
                body: "We're a fast-growing company. The people who join now will help shape what this business becomes.",
              },
              {
                emoji: "💰",
                title: "Competitive Pay",
                body: "KES-denominated salaries benchmarked to market. Performance bonuses for senior roles.",
              },
              {
                emoji: "🎨",
                title: "Creative Work",
                body: "Every day is different. You'll work across industries, brands, and project types.",
              },
              {
                emoji: "🇰🇪",
                title: "Kenyan-Built",
                body: "We're building something here. You'll be part of a team that takes that seriously.",
              },
            ].map((card) => (
              <div key={card.title} className="bg-[#1A1A1A] border border-white/[0.07] rounded-lg p-6">
                <span className="text-2xl" aria-hidden>{card.emoji}</span>
                <h3 className="font-display text-xl text-white mt-2">{card.title}</h3>
                <p className="font-body text-[15px] text-white/60 mt-2">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN ROLES */}
      <section id="open-positions" className="py-20 px-4 md:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
            OPEN POSITIONS
          </p>
          <CareersClient initialJobs={jobs} />
        </div>
      </section>

      {/* APPLICATION PROCESS */}
      <section className="bg-[#111111] py-20 px-4 md:px-6 lg:px-8">
        <div className="container max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-white mb-12">
            How We Hire.
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Apply Online", body: "Submit your CV and cover letter through our online form. Takes 5 minutes." },
              { num: "02", title: "Initial Review", body: "Our team reviews every application personally. You'll hear from us within 5 business days." },
              { num: "03", title: "Interview", body: "A conversation — not an interrogation. We want to understand your skills and ambitions." },
              { num: "04", title: "Offer & Onboarding", body: "If it's a good fit, we move fast. We'll have you up and running quickly." },
            ].map((step) => (
              <div key={step.num}>
                <span className="font-mono text-primary text-sm">{step.num}</span>
                <h3 className="font-display text-lg text-white mt-1">{step.title}</h3>
                <p className="font-body text-sm text-white/60 mt-2">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-primary py-16 px-4 md:px-6 lg:px-8">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-[40px] font-bold text-black">
            Don&apos;t See Your Role?
          </h2>
          <p className="font-body text-lg text-black/70 mt-4">
            We&apos;re growing fast. If you&apos;re talented and you believe in
            what we&apos;re building, reach out anyway.
          </p>
          <Link
            href="/get-a-quote"
            className="inline-flex items-center gap-2 mt-6 rounded-lg bg-black text-white px-6 py-3 font-medium hover:bg-black/90"
          >
            Send Your CV →
          </Link>
        </div>
      </section>
    </div>
  );
}
