"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface n8nHealth {
  status: "ok" | "degraded" | "down";
  responseMs: number;
}

export function N8nHealthCard() {
  const [health, setHealth] = useState<n8nHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/admin/system/n8n-health");
        const data = await res.json();
        setHealth(data);
      } catch (err) {
        setHealth({ status: "down", responseMs: 0 });
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Automations (n8n)</h2>
        </div>
        {!loading && health && (
          <Badge 
            variant={health.status === "ok" ? "default" : health.status === "degraded" ? "secondary" : "destructive"}
            className={cn(
              "capitalize",
              health.status === "ok" && "bg-green-500 hover:bg-green-600",
              health.status === "degraded" && "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            {health.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        ) : health ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Response Time</span>
              <span className="font-mono">{health.responseMs}ms</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {health.status === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span className={health.status === "down" ? "text-destructive font-medium" : "text-muted-foreground"}>
                {health.status === "ok" 
                  ? "All workflows operational" 
                  : health.status === "degraded" 
                    ? "Slight delay in processing" 
                    : "Instance unreachable"}
              </span>
            </div>
            <Link 
              href="/api/admin/n8n/sso" 
              target="_blank"
              className="mt-2 block text-center py-1.5 text-xs font-medium bg-primary/5 hover:bg-primary/10 text-primary rounded-md transition-colors"
            >
              Open n8n Dashboard
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Unable to fetch status</p>
        )}
      </CardContent>
    </Card>
  );
}
