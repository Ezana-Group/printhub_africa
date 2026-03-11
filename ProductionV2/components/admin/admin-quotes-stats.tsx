"use client";

import { Card, CardContent } from "@/components/ui/card";

export type QuoteStats = {
  total: number;
  newCount: number;
  quotedAwaiting: number;
  acceptedThisMonth: number;
  totalValueKes: number;
};

export function AdminQuotesStats({ stats }: { stats: QuoteStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Quotes</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">{stats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New / Unread</p>
          <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-[#111]">
            {stats.newCount}
            {stats.newCount > 0 && (
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" title="Needs attention" aria-hidden />
            )}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quoted Awaiting Response</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">{stats.quotedAwaiting}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accepted This Month</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">{stats.acceptedThisMonth}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Value KES Won</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">
            {stats.totalValueKes >= 0 ? `KES ${stats.totalValueKes.toLocaleString()}` : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
