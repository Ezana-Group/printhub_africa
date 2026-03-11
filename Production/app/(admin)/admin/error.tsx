"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold mb-4">Something went wrong</h1>
      <Card>
        <CardHeader>
          <p className="text-destructive font-medium">The admin page could not load.</p>
          <p className="text-sm text-muted-foreground">
            You may have been logged out, or there was a temporary error. Try again or go back to the dashboard.
          </p>
        </CardHeader>
        <CardContent className="flex gap-4">
          <button
            type="button"
            onClick={reset}
            className="text-primary hover:underline font-medium"
          >
            Try again
          </button>
          <Link href="/admin/dashboard" className="text-primary hover:underline font-medium">
            Dashboard
          </Link>
          <Link href="/login" className="text-muted-foreground hover:underline text-sm">
            Sign in again
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
