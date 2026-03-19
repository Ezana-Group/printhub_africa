"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, MessageCircle } from "lucide-react";

export default function GlobalError({
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
    <html>
      <body className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-2">
            An unexpected error occurred. Our team has been automatically notified.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-gray-400 mb-6">Error ID: {error.digest}</p>
          )}

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#e64400] text-white py-3 rounded-xl font-medium transition"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Error boundary: Link component may not work */}
            <a
              href="/"
              className="w-full flex items-center justify-center py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition"
            >
              Back to home
            </a>

            <a
              href={`https://wa.me/254727410320?text=${encodeURIComponent(
                `Hi PrintHub, I encountered an error on the website. Error ID: ${error.digest ?? "unknown"}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-green-200 text-green-700 hover:bg-green-50 font-medium transition"
            >
              <MessageCircle className="w-4 h-4" />
              Report on WhatsApp
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
