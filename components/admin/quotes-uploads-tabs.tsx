"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateForDisplay } from "@/lib/admin-utils";
import { QuoteCalculatorTab } from "./quote-calculator-tab";
import type { QuoteRow } from "./admin-quotes-list";

type Upload = {
  id: string;
  originalName: string;
  fileType: string;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string };
};

export function QuotesUploadsTabs({
  uploads,
  quotes,
  staffList,
  quotesListComponent,
}: {
  uploads: Upload[];
  quotes?: QuoteRow[];
  staffList?: { id: string; name: string; email: string }[];
  quotesListComponent?: React.ReactNode;
}) {
  void quotes;
  void staffList;
  const [tab, setTab] = useState<"quotes" | "uploads" | "calculator">(quotesListComponent ? "quotes" : "uploads");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {quotesListComponent && (
          <button
            type="button"
            onClick={() => setTab("quotes")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "quotes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Quotes
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab("uploads")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "uploads"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Customer uploads
        </button>
        <button
          type="button"
          onClick={() => setTab("calculator")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "calculator"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Quote Calculator
        </button>
      </div>

      {tab === "quotes" && quotesListComponent}

      {tab === "uploads" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">File</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/30">
                      <td className="p-4 font-medium truncate max-w-[200px]">{u.originalName}</td>
                      <td className="p-4">{u.fileType}</td>
                      <td className="p-4">{u.user.email}</td>
                      <td className="p-4">{u.status}</td>
                      <td className="p-4 text-muted-foreground">
                        {formatDateForDisplay(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {uploads.length === 0 && (
              <p className="p-8 text-center text-muted-foreground">No customer uploads yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "calculator" && <QuoteCalculatorTab />}
    </div>
  );
}
