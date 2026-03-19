"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { DeleteOrderButton } from "@/components/account/delete-order-button";
import { ShoppingBag } from "lucide-react";

export type RecentOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: unknown;
  createdAt: Date;
  items: unknown[];
};

function getStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "DELIVERED" || s === "SHIPPED") return "bg-emerald-100 text-emerald-800";
  if (s === "CANCELLED" || s === "REFUNDED") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="px-4 py-12 text-center sm:px-6">
        <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 text-slate-500">No orders yet</p>
        <Link
          href="/shop"
          className="mt-2 inline-block text-sm font-medium text-[#E8440A] hover:underline"
        >
          Start shopping →
        </Link>
      </div>
    );
  }

  return (
    <table className="w-full min-w-[600px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/80">
          <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Order #</th>
          <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Date</th>
          <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Items</th>
          <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Status</th>
          <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Total</th>
          <th className="px-4 py-3 font-medium text-slate-600 sm:px-6">Action</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr
            key={order.id}
            className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
          >
            <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">
              {order.orderNumber}
            </td>
            <td className="px-4 py-3 text-slate-600 sm:px-6">
              {new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-slate-600 sm:px-6">
              {Array.isArray(order.items) ? order.items.length : 0} item(s)
            </td>
            <td className="px-4 py-3 sm:px-6">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
              >
                {formatStatus(order.status)}
              </span>
            </td>
            <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">
              {formatPrice(Number(order.total))}
            </td>
            <td className="px-4 py-3 sm:px-6 flex items-center gap-2 flex-wrap">
              <DeleteOrderButton
                orderId={order.id}
                orderNumber={order.orderNumber}
                status={order.status}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
              />
              <Link
                href={`/account/orders/${order.id}`}
                className="font-medium text-[#E8440A] hover:underline"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
