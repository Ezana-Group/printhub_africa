"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfitabilityData = {
  period: string;
  totalRevenue: number;
  totalProductionCost: number;
  totalProfit: number;
  averageMarginPct: number;
  jobCount: number;
  byMaterial: {
    materialCode: string;
    materialName: string;
    sqmPrinted: number;
    revenue: number;
    materialCost: number;
    profit: number;
    marginPct: number;
    jobCount: number;
  }[];
};

function formatKes(n: number) {
  return `KES ${n.toLocaleString()}`;
}

export function LFProfitabilityCard() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reports/lf-profitability?period=${period}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Large format profitability</CardTitle>
        <CardDescription>
          From saved calculator history. Revenue vs production cost and profit by material.
        </CardDescription>
        <div className="flex gap-2 mt-2">
          {(["all", "30d", "90d"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === "all" ? "All time" : p === "30d" ? "Last 30 days" : "Last 90 days"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatKes(data.totalRevenue)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Production cost</p>
                <p className="text-xl font-bold">{formatKes(data.totalProductionCost)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Profit</p>
                <p className="text-xl font-bold text-green-600">{formatKes(data.totalProfit)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Avg margin / Jobs</p>
                <p className="text-xl font-bold">{data.averageMarginPct}%</p>
                <p className="text-xs text-muted-foreground">{data.jobCount} jobs</p>
              </div>
            </div>
            {data.byMaterial.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">By material</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2">Material</th>
                        <th className="text-right p-2">m²</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Cost</th>
                        <th className="text-right p-2">Profit</th>
                        <th className="text-right p-2">Margin</th>
                        <th className="text-right p-2">Jobs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byMaterial.map((row) => (
                        <tr key={row.materialCode} className="border-b">
                          <td className="p-2 font-medium">{row.materialName}</td>
                          <td className="p-2 text-right">{row.sqmPrinted.toFixed(1)}</td>
                          <td className="p-2 text-right">{formatKes(row.revenue)}</td>
                          <td className="p-2 text-right">{formatKes(row.materialCost)}</td>
                          <td className="p-2 text-right text-green-600">{formatKes(row.profit)}</td>
                          <td className="p-2 text-right">{row.marginPct}%</td>
                          <td className="p-2 text-right">{row.jobCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {data.jobCount === 0 && (
              <p className="text-sm text-muted-foreground">
                No LF jobs in history yet. Save jobs from Admin → Quotes → Calculator → Large format → Save to history.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
