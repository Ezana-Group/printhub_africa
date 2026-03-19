"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

type ThreadRow = {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED" | "SPAM";
  customerName: string | null;
  customerEmail: string;
  updatedAt: string;
  hasUnread: boolean;
  mailbox: { id: string; label: string; address: string };
  latestSnippet: string | null;
};

type Mailbox = { id: string; label: string; address: string };

export function EmailInboxClient({
  threads,
  mailboxes,
}: {
  threads: ThreadRow[];
  mailboxes: Mailbox[];
}) {
  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email inbox
        </h1>
        <p className="text-muted-foreground text-sm">
          Staff-managed messages for <span className="font-mono">@printhub.africa</span> ({mailboxes.length} mailboxes configured).
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          No open threads.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {threads.map((t) => (
            <Link key={t.id} href={`/admin/email/thread/${t.id}`} className="block">
              <Card
                className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                  t.hasUnread ? "border-primary/40" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="pt-2">
                      {t.hasUnread ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent inline-block" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium truncate" title={t.customerName ?? t.customerEmail}>
                          {t.customerName ?? t.customerEmail}
                        </p>
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {t.mailbox.label}
                        </Badge>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {t.status}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground truncate" title={t.subject}>
                        <span className="font-medium text-foreground">{t.subject}</span>
                        {t.latestSnippet ? ` — ${t.latestSnippet}` : ""}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.updatedAt).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

