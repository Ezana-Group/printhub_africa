"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CorporateApplyForm } from "./CorporateApplyForm";
import { Building2 } from "lucide-react";

export default function CorporateApplyPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-[#FF4D00]" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Apply for a Corporate Account</h1>
        <p className="text-slate-600 mb-6">
          You need to be signed in to apply. Create an account or log in, then return to this page.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login?callbackUrl=/corporate/apply">
            <span className="inline-flex items-center justify-center rounded-lg bg-[#FF4D00] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#e64500]">
              Log in
            </span>
          </Link>
          <Link href="/register?callbackUrl=/corporate/apply">
            <span className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Register
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Apply for a Corporate Account</h1>
        <p className="text-slate-600 max-w-xl mx-auto mb-3">
          Get dedicated pricing, credit terms, and a single dashboard for your organisation&apos;s printing needs.
        </p>
        <Link href="/corporate/apply/status" className="text-sm text-[#FF4D00] hover:underline">
          Already applied? Check your application status
        </Link>
      </div>
      <CorporateApplyForm />
    </div>
  );
}
