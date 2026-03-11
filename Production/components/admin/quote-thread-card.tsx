"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Use fixed locale so server and client render the same (avoids hydration mismatch). */
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function QuoteThreadCard({
  createdAt,
  quotedAt,
  acceptedAt,
  status,
  adminNotes,
}: {
  createdAt: string;
  quotedAt: string | null;
  acceptedAt: string | null;
  status: string;
  adminNotes: string | null;
}) {
  const events: { label: string; at: string }[] = [
    { label: "Submitted", at: createdAt },
  ];
  if (quotedAt) events.push({ label: "Quote sent to customer", at: quotedAt });
  if (acceptedAt) events.push({ label: "Customer accepted", at: acceptedAt });
  if (status === "in_production" || status === "completed") {
    events.push({ label: `Status: ${status.replace("_", " ")}`, at: "" });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Quote thread / activity</h2>
        <p className="text-xs text-muted-foreground">Key events. Add internal notes in the panel on the right.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-sm">
          {events.map((e, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">{e.at ? formatDate(e.at) : "—"}</span>
              <span>{e.label}</span>
            </li>
          ))}
        </ul>
        {adminNotes && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">Latest internal note</p>
            <p className="text-sm whitespace-pre-wrap">{adminNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
