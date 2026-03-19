/**
 * POST /api/corporate/apply
 * Submit a corporate account application. User must be logged in and not already in a corporate account.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  sendCorporateApplicationReceivedEmail,
  sendCorporateApplicationNewAdminEmail,
} from "@/lib/email";
import type { CorporateIndustry, CompanySize, PaymentTerms } from "@prisma/client";

const KRA_PIN_REGEX = /^[PA]\d{9}[A-Z]$/i;
const PHONE_REGEX = /^\+?254[17]\d{8}$/;

const applySchema = z.object({
  companyName: z.string().min(1).max(300),
  tradingName: z.string().max(300).optional(),
  kraPin: z.string().min(1).max(20),
  vatNumber: z.string().max(50).optional(),
  industry: z.string() as z.ZodType<CorporateIndustry>,
  companySize: z.string() as z.ZodType<CompanySize>,
  website: z.string().url().optional().or(z.literal("")),
  contactPerson: z.string().min(1).max(200),
  contactPhone: z.string().min(1),
  contactEmail: z.string().email(),
  billingAddress: z.string().min(1),
  billingCity: z.string().min(1),
  billingCounty: z.string().min(1),
  estimatedMonthlySpend: z.string().min(1),
  creditRequested: z.number().int().min(0).optional(),
  paymentTermsRequested: z.string().optional() as z.ZodType<PaymentTerms | undefined>,
  additionalNotes: z.string().max(2000).optional(),
  termsAccepted: z.literal(true).optional(), // frontend sends when checkbox checked
});

function normalizeKraPin(value: string): string {
  const upper = value.trim().toUpperCase();
  if (upper.length === 11 && /^[PA]\d{9}[A-Z]$/.test(upper)) return upper;
  return value.trim();
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  return value;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be logged in to apply" }, { status: 401 });
  }

  // User must not already be in an approved corporate account
  const existing = await prisma.corporateTeamMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { corporate: { select: { status: true } } },
  });
  if (existing?.corporate?.status === "APPROVED") {
    return NextResponse.json(
      { error: "You already belong to an approved corporate account" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const kraPin = normalizeKraPin(parsed.data.kraPin);
  if (!KRA_PIN_REGEX.test(kraPin)) {
    return NextResponse.json(
      { error: "Invalid KRA PIN. Use format: P or A, 9 digits, then a letter (e.g. P051234567X)" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(parsed.data.contactPhone);
  if (!PHONE_REGEX.test(phone)) {
    return NextResponse.json(
      { error: "Invalid phone. Use a valid Kenyan number (e.g. +254 7XX XXX XXX)" },
      { status: 400 }
    );
  }

  const now = new Date();
  const application = await prisma.corporateApplication.create({
    data: {
      applicantUserId: session.user.id,
      companyName: parsed.data.companyName.trim(),
      tradingName: parsed.data.tradingName?.trim() || null,
      kraPin,
      vatNumber: parsed.data.vatNumber?.trim() || null,
      industry: parsed.data.industry,
      companySize: parsed.data.companySize,
      website: parsed.data.website?.trim() || null,
      contactPerson: parsed.data.contactPerson.trim(),
      contactPhone: phone,
      contactEmail: parsed.data.contactEmail.trim().toLowerCase(),
      billingAddress: parsed.data.billingAddress.trim(),
      billingCity: parsed.data.billingCity.trim(),
      billingCounty: parsed.data.billingCounty.trim(),
      estimatedMonthlySpend: parsed.data.estimatedMonthlySpend.trim(),
      creditRequested: parsed.data.creditRequested ?? null,
      paymentTermsRequested: parsed.data.paymentTermsRequested ?? null,
      additionalNotes: parsed.data.additionalNotes?.trim() || null,
      status: "PENDING",
      acceptedCorporateTermsAt: now,
      corporateTermsVersion: "1.0",
    },
  });

  const applicationRef = `APP-${application.id.slice(-8).toUpperCase()}`;
  const applicantName = session.user.name ?? session.user.email ?? "there";

  try {
    await sendCorporateApplicationReceivedEmail(
      parsed.data.contactEmail,
      applicantName,
      parsed.data.companyName,
      applicationRef
    );
  } catch (e) {
    console.error("Corporate application confirmation email error:", e);
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.NOTIFY_EMAIL;
  if (adminEmail) {
    sendCorporateApplicationNewAdminEmail(
      adminEmail,
      parsed.data.companyName,
      parsed.data.contactPerson
    ).catch((e) => console.error("Corporate application admin email error:", e));
  }

  return NextResponse.json({
    applicationId: application.id,
    applicationRef,
    message: "Application submitted successfully. We'll respond within 1 business day.",
  });
}
