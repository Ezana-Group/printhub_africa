import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { ApplicationForm } from "./application-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await prisma.jobListing.findFirst({
    where: { slug, status: JobStatus.PUBLISHED },
    select: { title: true, metaTitle: true, metaDescription: true },
  });
  if (!job) return { title: "Job Not Found" };
  return {
    title: job.metaTitle ?? `${job.title} | Careers | PrintHub`,
    description: job.metaDescription ?? `Apply for ${job.title} at PrintHub, Nairobi.`,
  };
}

async function getJob(slug: string) {
  const job = await prisma.jobListing.findFirst({
    where: { slug, status: JobStatus.PUBLISHED },
  });
  return job;
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const typeLabel =
    job.type === "FULL_TIME"
      ? "Full-time"
      : job.type === "PART_TIME"
        ? "Part-time"
        : job.type === "CONTRACT"
          ? "Contract"
          : job.type === "INTERNSHIP"
            ? "Internship"
            : "Attachment";

  const deadlineStr = job.applicationDeadline
    ? new Date(job.applicationDeadline).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const daysLeft =
    job.applicationDeadline &&
    Math.ceil((job.applicationDeadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <Link
          href="/careers"
          className="font-body text-sm text-white/60 hover:text-white mb-8 inline-block"
        >
          ← Back to Careers
        </Link>

        <div className="grid lg:grid-cols-[65%_35%] gap-12 lg:gap-16">
          {/* LEFT COLUMN */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">
                {job.department}
              </span>
              <span className="text-xs text-white/50 px-2 py-0.5 rounded bg-white/10">
                {typeLabel}
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-[52px] font-bold text-white leading-tight">
              {job.title}
            </h1>
            <p className="font-body text-white/50 mt-4 flex flex-wrap items-center gap-4">
              <span>📍 {job.location}</span>
              <span>·</span>
              <span>🕐 {typeLabel}</span>
              {deadlineStr && (
                <>
                  <span>·</span>
                  <span>📅 Closes {deadlineStr}</span>
                </>
              )}
            </p>
            {job.showSalary && job.salaryMin != null && job.salaryMax != null && (
              <p className="font-body text-white/70 mt-2">
                💰 KES {job.salaryMin.toLocaleString()} – {job.salaryMax.toLocaleString()} / month
              </p>
            )}

            <div className="mt-10 space-y-10">
              <section>
                <h2 className="font-display text-xl text-white mb-3">About this role</h2>
                <JobContent html={job.description} />
              </section>
              <section>
                <h2 className="font-display text-xl text-white mb-3">Your responsibilities</h2>
                <JobContent html={job.responsibilities} />
              </section>
              <section>
                <h2 className="font-display text-xl text-white mb-3">What we&apos;re looking for</h2>
                <JobContent html={job.requirements} />
              </section>
              {job.niceToHave && (
                <section>
                  <h2 className="font-display text-xl text-white mb-3">Nice to have</h2>
                  <JobContent html={job.niceToHave} />
                </section>
              )}
              {job.benefits.length > 0 && (
                <section>
                  <h2 className="font-display text-xl text-white mb-3">What we offer</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.benefits.map((b) => (
                      <span
                        key={b}
                        className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - STICKY */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-[#1A1A1A] border border-white/[0.07] rounded-lg p-6 mb-6">
              <h3 className="font-display text-lg text-white mb-2">Apply for this role</h3>
              <p className="font-body text-sm text-white/70">{job.title}</p>
              <p className="font-body text-xs text-white/50 mt-1">
                {job.location} · {typeLabel}
              </p>
              {deadlineStr && (
                <p className="font-body text-xs text-white/50 mt-2">
                  Closing: {deadlineStr}
                  {daysLeft != null && daysLeft > 0 && (
                    <span className="block mt-1">
                      <span className="text-primary">{daysLeft} days left</span>
                    </span>
                  )}
                </p>
              )}
              <a
                href="#apply"
                className="mt-4 inline-block w-full text-center rounded-lg bg-primary text-white font-medium py-3 hover:bg-primary/90 transition-colors"
              >
                Apply Now →
              </a>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="font-body text-xs text-white/50 mb-2">Share this role:</p>
                <div className="flex gap-2">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://printhub.africa"}/careers/${slug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white text-sm"
                    aria-label="Share on LinkedIn"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Check out this role at PrintHub: ${job.title}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 hover:text-white text-sm"
                    aria-label="Share on WhatsApp"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-[#1A1A1A] border border-white/[0.07] rounded-lg p-6">
              <h3 className="font-display text-sm text-white">About PrintHub</h3>
              <p className="font-body text-xs text-white/60 mt-1">
                Professional printing studio, Nairobi, Kenya.
              </p>
              <p className="font-body text-xs text-primary mt-2">printhub.africa</p>
            </div>
          </div>
        </div>

        {/* APPLICATION FORM SECTION */}
        <section id="apply" className="mt-20 pt-12 border-t border-white/10">
          <ApplicationForm job={job} />
        </section>
      </div>
    </div>
  );
}

function JobContent({ html }: { html: string }) {
  if (!html) return null;
  const isHtml = html.trimStart().startsWith("<");
  if (isHtml) {
    return (
      <div
        className="font-body text-[15px] text-white/70 leading-relaxed prose prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0 max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <div className="font-body text-[15px] text-white/70 leading-relaxed whitespace-pre-line">
      {html}
    </div>
  );
}
