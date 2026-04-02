"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function SectionError({
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
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="font-bold text-gray-900 mb-1">Couldn&apos;t load this section</h2>
        <p className="text-sm text-gray-500 mb-4">
          Something went wrong. Our team has been notified.
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto text-sm text-[#FF4D00] hover:underline"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    </div>
  );
}
