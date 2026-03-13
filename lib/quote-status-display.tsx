/**
 * Quote status display helpers for account and admin UIs.
 * Uses Quote model statuses: new | reviewing | quoted | accepted | rejected | in_production | completed | cancelled
 */

import type React from "react";
import {
  FileText,
  Eye,
  Tag,
  CheckCircle,
  Printer,
  CheckCircle2,
  Undo2,
  X,
} from "lucide-react";

export type QuoteStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "rejected"
  | "in_production"
  | "completed"
  | "cancelled";

export function getStatusBadgeStyle(status: string): {
  bg: string;
  text: string;
  label: string;
} {
  const map: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    new: { bg: "bg-blue-100", text: "text-blue-700", label: "New" },
    reviewing: { bg: "bg-purple-100", text: "text-purple-700", label: "Under Review" },
    quoted: { bg: "bg-amber-100", text: "text-amber-700", label: "Quoted — Action needed" },
    accepted: { bg: "bg-green-100", text: "text-green-700", label: "Accepted" },
    in_production: { bg: "bg-blue-100", text: "text-blue-700", label: "In Production" },
    completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-500", label: "Withdrawn" },
    rejected: { bg: "bg-gray-100", text: "text-gray-500", label: "Declined" },
  };
  return map[status] ?? { bg: "bg-gray-100", text: "text-gray-500", label: status };
}

export function getStatusIcon(status: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    new: <FileText className="h-4 w-4 text-blue-600" />,
    reviewing: <Eye className="h-4 w-4 text-purple-600" />,
    quoted: <Tag className="h-4 w-4 text-amber-600" />,
    accepted: <CheckCircle className="h-4 w-4 text-green-600" />,
    in_production: <Printer className="h-4 w-4 text-blue-600" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    cancelled: <Undo2 className="h-4 w-4 text-gray-400" />,
    rejected: <X className="h-4 w-4 text-gray-400" />,
  };
  return map[status] ?? <FileText className="h-4 w-4 text-gray-400" />;
}

export function getStatusIconBg(status: string): string {
  const map: Record<string, string> = {
    new: "bg-blue-100",
    reviewing: "bg-purple-100",
    quoted: "bg-amber-100",
    accepted: "bg-green-100",
    in_production: "bg-blue-100",
    completed: "bg-green-100",
    cancelled: "bg-gray-100",
    rejected: "bg-gray-100",
  };
  return map[status] ?? "bg-gray-100";
}

/** Customer can withdraw/cancel only before production starts. */
export function canCustomerWithdraw(status: string): boolean {
  return ["new", "reviewing", "quoted", "accepted"].includes(status);
}
