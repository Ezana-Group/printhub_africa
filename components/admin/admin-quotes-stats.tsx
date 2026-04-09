"use client";

import { Card, CardContent } from "@/components/ui/card";

export type QuoteStats = {
  total: number;
  newCount: number;
  quotedAwaiting: number;
  acceptedThisMonth: number;
  totalValueKes: number;
  potentialValueKes?: number;
};

export function AdminQuotesStats({ stats }: { stats: QuoteStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <Card>
        <CardContent className="pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Quotes</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">{stats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drafts / New</p>
          <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-[#111]">
            {stats.newCount}
            {stats.newCount > 0 && (
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" title="Needs attention" aria-hidden />
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 border-l-2 border-orange-500">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quoted (Sent)</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">{stats.quotedAwaiting}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Potential (Sent)</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            KES {(stats.potentialValueKes || 0).toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 border-l-2 border-green-500">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accepted This Month</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">{stats.acceptedThisMonth}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 bg-green-50">
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Total Value Won</p>
          <p className="mt-1 text-2xl font-bold text-green-900 font-mono">
            {stats.totalValueKes >= 0 ? `KES ${stats.totalValueKes.toLocaleString()}` : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
