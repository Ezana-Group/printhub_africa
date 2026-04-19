"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SyncFeedsButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing/social-export/sync", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Social syndication sync triggered!");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to trigger sync");
      }
    } catch (err) {
      toast.error("Error triggering sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={loading}
      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
    >
      {loading ? (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      Sync All Feeds Now
    </Button>
  );
}
