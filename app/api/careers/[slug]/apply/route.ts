import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getUploadUrl } from "@/lib/s3";
import { z } from "zod";
import {
  sendCareerApplicationConfirmationEmail,
  sendCareerApplicationNotificationToAdmin,
} from "@/lib/email";

const MAX_CV_MB = 5;

const applySchema = z.object({
  firstName: z.string().min(2, "First name at least 2 characters"),
  lastName: z.string().min(2, "Last name at least 2 characters"),
  email: z.string().email(),
  phone: z.string().regex(/^\+?254\d{9}$/, "Use Kenyan +254 format (e.g. +254712345678)"),
  location: z.string().optional(),
  coverLetter: z.string().min(100, "Cover letter at least 100 characters").max(2000),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  source: z.string().optional(),
  referredBy: z.string().optional(),
  consent: z.literal("true"),
  answers: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const job = await prisma.jobListing.findFirst({
      where: { slug, status: JobStatus.PUBLISHED },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      return NextResponse.json({ error: "Application deadline has passed" }, { status: 400 });
    }

    const formData = await req.formData();
    const cvFile = formData.get("cv") as File | null;
    if (!cvFile || !(cvFile instanceof File)) {
      return NextResponse.json({ error: "CV file is required" }, { status: 400 });
    }
    if (cvFile.size > MAX_CV_MB * 1024 * 1024) {
      return NextResponse.json({ error: `CV must be under ${MAX_CV_MB}MB` }, { status: 400 });
    }
    const ext = cvFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      return NextResponse.json({ error: "CV must be a PDF" }, { status: 400 });
    }

    const raw = {
      firstName: formData.get("firstName") ?? "",
      lastName: formData.get("lastName") ?? "",
      email: formData.get("email") ?? "",
      phone: formData.get("phone") ?? "",
      location: (formData.get("location") as string) || undefined,
      coverLetter: formData.get("coverLetter") ?? "",
      linkedinUrl: (formData.get("linkedinUrl") as string) || undefined,
      portfolioUrl: (formData.get("portfolioUrl") as string) || undefined,
      source: (formData.get("source") as string) || undefined,
      referredBy: (formData.get("referredBy") as string) || undefined,
      consent: formData.get("consent") ?? "",
      answers: (() => {
        const a = formData.get("answers");
        if (typeof a === "string") {
          try {
            return JSON.parse(a) as Record<string, unknown>;
          } catch {
            return undefined;
          }
        }
        return undefined;
      })(),
    };

    const parsed = applySchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      const first = Object.values(msg).flat()[0];
      return NextResponse.json(
        { error: typeof first === "string" ? first : "Validation failed" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const timestamp = Date.now();
    const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `careers/${job.id}/${timestamp}-${safeName}`;
    const contentType = "application/pdf";
    const uploadUrl = await getUploadUrl(key, contentType);
    let cvFileUrl: string;

    if (uploadUrl) {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: cvFile,
        headers: { "Content-Type": contentType },
      });
      if (!res.ok) {
        console.error("R2 careers CV upload failed:", res.status);
        return NextResponse.json({ error: "Upload failed" }, { status: 502 });
      }
      cvFileUrl = key; // store key for signed download
    } else {
      const buffer = Buffer.from(await cvFile.arrayBuffer());
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const dir = path.join(process.cwd(), "public", "uploads", "careers", job.id);
      await mkdir(dir, { recursive: true });
      const filename = `${timestamp}-${safeName}`;
      const filepath = path.join(dir, filename);
      await writeFile(filepath, buffer);
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
      cvFileUrl = `${base}/uploads/careers/${job.id}/${filename}`;
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobListingId: job.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        location: data.location ?? null,
        coverLetter: data.coverLetter,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        cvFileUrl,
        cvFileName: cvFile.name,
        answers: data.answers == null ? undefined : (data.answers as Prisma.InputJsonValue),
        source: data.source ?? null,
        referredBy: data.referredBy || null,
      },
    });

    const ref = `APP-${application.id.slice(-8).toUpperCase()}`;
    await sendCareerApplicationConfirmationEmail(
      data.email,
      data.firstName,
      job.title,
      ref
    ).catch((e) => console.error("Career confirmation email error:", e));

    const adminEmail = process.env.CAREERS_NOTIFICATION_EMAIL ?? process.env.FROM_EMAIL ?? "admin@printhub.africa";
    const toEmail = adminEmail.includes("<") ? adminEmail.replace(/^[^<]*<([^>]+)>.*$/, "$1") : adminEmail;
    await sendCareerApplicationNotificationToAdmin(
      toEmail,
      job.title,
      `${data.firstName} ${data.lastName}`,
      data.email,
      data.phone,
      new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
      application.id
    ).catch((e) => console.error("Career admin notification email error:", e));

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (e) {
    console.error("Careers apply error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
