"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Admin Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm mx-auto max-w-2xl mt-12">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Admin Error</h2>
      <p className="text-slate-600 mb-6 max-w-md">
        An unexpected error occurred while rendering this page. This has been logged for the developers.
      </p>

      <div className="w-full text-left bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8">
        <p className="text-sm font-semibold text-slate-700 mb-1">Error Message:</p>
        <p className="text-sm text-slate-600 font-mono break-all mb-4">
          {error.message || "Unknown error"}
        </p>
        
        {error.digest && (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-1">Digest:</p>
            <p className="text-xs text-slate-500 font-mono break-all">
              {error.digest}
            </p>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = "/admin/dashboard"}
        >
          Back to Dashboard
        </Button>
        <Button 
          onClick={() => reset()}
          className="bg-[#CC3D00] hover:bg-[#E64500] text-white"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}
