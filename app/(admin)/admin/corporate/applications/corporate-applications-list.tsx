"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Application = {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  status: string;
  createdAt: Date | string;
  applicant: { name: string | null; email: string | null };
};

export function CorporateApplicationsList({
  applications,
  countByStatus,
  currentStatusFilter,
}: {
  applications: Application[];
  countByStatus: Record<string, number>;
  currentStatusFilter?: string;
}) {
  const filters = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex border-b bg-muted/30 px-4 gap-2">
          {filters.map((f) => {
            const count = f.value ? countByStatus[f.value] ?? 0 : (countByStatus[""] ?? applications.length);
            const isActive = (currentStatusFilter ?? "") === f.value;
            return (
              <Link
                key={f.value || "all"}
                href={f.value ? `/admin/corporate/applications?status=${f.value}` : "/admin/corporate/applications"}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label} {count != null && `(${count})`}
              </Link>
            );
          })}
        </div>
        {applications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Company</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Applied</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-medium">{app.companyName}</td>
                    <td className="p-4">
                      {app.contactPerson}
                      <br />
                      <span className="text-muted-foreground text-xs">{app.contactEmail}</span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(app.createdAt).toLocaleDateString("en-KE", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          app.status === "PENDING" && "bg-amber-100 text-amber-800",
                          app.status === "APPROVED" && "bg-green-100 text-green-800",
                          app.status === "REJECTED" && "bg-red-100 text-red-800"
                        )}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/corporate/applications/${app.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
