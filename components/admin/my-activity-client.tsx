"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { formatRelativeTime } from "@/lib/admin-utils";

type AuditEvent = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  timestamp: string;
};

type MyActivityResponse = {
  events: AuditEvent[];
  sessions: unknown[];
};

export function MyActivityClient() {
  const [data, setData] = useState<MyActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings/my-activity")
      .then((res) => res.json())
      .then((body) => {
        if (body.events) setData(body);
        else setData({ events: [], sessions: [] });
      })
      .catch(() => setData({ events: [], sessions: [] }))
      .finally(() => setLoading(false));
  }, []);

  const events = data?.events ?? [];
  const ref = (e: AuditEvent) =>
    e.entityId ? `${e.entity} ${e.entityId}` : e.entity;

  return (
    <SectionCard
      title="Recent actions"
      description="Last 100 admin actions. Timestamp, action, and reference."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground py-8">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-[#E5E7EB]">
          {events.map((item) => (
            <li
              key={item.id}
              className="py-3 first:pt-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
            >
              <span className="text-muted-foreground shrink-0">
                {formatRelativeTime(new Date(item.timestamp))}
              </span>
              <span className="font-medium">{item.action}</span>
              {ref(item) !== item.entity && (
                <span className="text-muted-foreground">{ref(item)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
