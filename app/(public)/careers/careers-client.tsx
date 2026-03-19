"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const DEPARTMENTS = ["All", "Production", "Design", "Sales", "Operations", "Tech", "Other"];
const TYPES = ["All", "Full-time", "Part-time", "Contract", "Internship", "Attachment"];

const TYPE_MAP: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  ATTACHMENT: "Attachment",
};

type Job = {
  id: string;
  title: string;
  slug: string;
  department: string;
  type: string;
  location: string;
  isRemote: boolean;
  description: string;
  applicationDeadline: string | null;
};

export function CareersClient({ initialJobs }: { initialJobs: Job[] }) {
  const [department, setDepartment] = useState("All");
  const [type, setType] = useState("All");

  const filtered = useMemo(() => {
    return initialJobs.filter((j) => {
      if (department !== "All" && j.department !== department) return false;
      if (type !== "All" && TYPE_MAP[j.type] !== type) return false;
      return true;
    });
  }, [initialJobs, department, type]);

  if (initialJobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4" aria-hidden>💼</div>
        <h3 className="font-display text-xl text-white">No open positions right now.</h3>
        <p className="font-body text-white/60 mt-2">
          We&apos;re always interested in talented people. Send us your CV.
        </p>
        <Link
          href="/careers/speculative-application"
          className="inline-flex items-center gap-2 mt-6 text-primary font-medium hover:underline"
        >
          Send Speculative Application →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-[#1A1A1A] border border-white/10 text-white rounded-lg px-4 py-2 font-body text-sm"
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All departments" : d}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-[#1A1A1A] border border-white/10 text-white rounded-lg px-4 py-2 font-body text-sm"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "All types" : t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {filtered.map((job) => (
          <Link
            key={job.id}
            href={`/careers/${job.slug}`}
            className="block bg-[#1A1A1A] border border-white/[0.07] rounded-lg p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">
                {job.department}
              </span>
              <span className="text-xs text-white/50 px-2 py-0.5 rounded bg-white/10">
                {TYPE_MAP[job.type] ?? job.type}
              </span>
            </div>
            <h3 className="font-display text-xl text-white">{job.title}</h3>
            <p className="font-body text-sm text-white/50 mt-1">
              {job.location}
              {job.isRemote ? " · Remote option" : " · On-site"}
            </p>
            <p className="font-body text-sm text-white/60 mt-3 line-clamp-2">
              {job.description}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              <span className="font-body text-xs text-white/40">
                {job.applicationDeadline
                  ? `Closes: ${new Date(job.applicationDeadline).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}`
                  : "Open until filled"}
              </span>
              <span className="text-primary font-medium text-sm">Apply Now →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
