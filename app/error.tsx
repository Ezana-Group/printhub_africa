"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-display text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-600">We couldn’t load this page.</p>
      <div className="mt-6 flex gap-4">
        <Button onClick={reset} className="rounded-xl">Try again</Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
