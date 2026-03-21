"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatsData {
  totalOrders: number | null;
  totalClients: number | null;
  yearsInBusiness: number | null;
  totalMachines: number | null;
  staffCount: number | null;
}

interface BusinessStatsProps {
  variant?: "full" | "compact";
  className?: string;
}

export function BusinessStats({ variant = "full", className }: BusinessStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/public");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (mounted) {
          setStats(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchStats();
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (error || (!loading && !stats)) {
    return null;
  }

  if (loading) {
    return (
      <div className={cn("flex flex-wrap gap-8", className)}>
        {[1, 2, 3, 4].slice(0, variant === "compact" ? 3 : 4).map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-8 w-24 bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-16 bg-white/5 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    { value: stats.yearsInBusiness, suffix: "+ Years", label: "In Business" },
    { value: stats.totalOrders, suffix: "+", label: "Orders Fulfilled" },
    { value: stats.totalClients, suffix: "+", label: "Clients Served" },
    { value: stats.totalMachines, suffix: "+", label: "Machines Operated" },
    { value: stats.staffCount, suffix: "+", label: "Expert Staff" },
  ].filter((item) => item.value !== null && item.value !== undefined);

  if (items.length === 0) return null;

  if (variant === "compact") {
    // Show only 3 key stats for compact variant
    const compactItems = items.slice(0, 3);
    return (
      <div className={cn("flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-slate-400 mt-16", className)}>
        {compactItems.map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {/* STAT: DO NOT HARDCODE */}
            {item.value?.toLocaleString()}{item.suffix} {item.label.toLowerCase()}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Nairobi based
        </span>
      </div>
    );
  }

  // Full grid for about page
  return (
    <div className={cn("flex flex-wrap gap-10 md:gap-16 mt-12", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex flex-col">
          <span className="font-display font-extrabold text-3xl md:text-4xl text-white transition-all duration-700 animate-in fade-in slide-in-from-bottom-2">
            {/* STAT: DO NOT HARDCODE */}
            {item.value?.toLocaleString()}{item.suffix}
          </span>
          <span className="font-body text-sm text-white/50 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
