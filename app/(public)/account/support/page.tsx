"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AccountSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/support/tickets")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Support tickets</h1>
      <p className="text-slate-600 mt-1">View and manage your support requests.</p>
      <Button asChild className="mt-4">
        <Link href="/account/support/new">New ticket</Link>
      </Button>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : tickets.length === 0 ? (
        <p className="mt-6 text-slate-500">You have no support tickets yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {tickets.map((t) => (
            <li key={t.id} className="border rounded-xl p-4 hover:bg-slate-50">
              <Link href={`/account/support/${t.id}`} className="block">
                <span className="font-mono text-sm text-slate-500">{t.ticketNumber}</span>
                <p className="font-medium text-slate-900 mt-0.5">{t.subject}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {t.status} · {new Date(t.createdAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
