"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Image as ImageIcon,
  Box,
  Send,
  CheckCircle,
  Pause,
  Play,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface CatalogueItemRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  category: { id: string; name: string; slug: string };
  photos: { url: string }[];
  availableMaterials: { materialCode: string; materialName: string }[];
  basePriceKes: number | null;
  priceOverrideKes: number | null;
}

export function AdminCatalogueClient() {
  const router = useRouter();
  const [data, setData] = useState<{
    items: CatalogueItemRow[];
    total: number;
    pendingReviewCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const refetch = useCallback(() => {
    fetch("/api/admin/catalogue?limit=50")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ items: [], total: 0, pendingReviewCount: 0 }));
  }, []);

  useEffect(() => {
    fetch("/api/admin/catalogue?limit=50")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ items: [], total: 0, pendingReviewCount: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const submitForReview = async (id: string) => {
    const res = await fetch(`/api/admin/catalogue/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING_REVIEW" }),
    });
    if (res.ok) {
      setToast("Submitted for review");
      refetch();
    } else setToast("Failed to submit");
  };

  const approveItem = async (id: string) => {
    const res = await fetch(`/api/admin/catalogue/${id}/approve`, { method: "POST" });
    if (res.ok) {
      setToast("Item approved and live!");
      refetch();
    } else setToast("Failed to approve");
  };

  const pauseItem = async (id: string) => {
    await fetch(`/api/admin/catalogue/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAUSED" }),
    });
    refetch();
  };

  const unpauseItem = async (id: string) => {
    await fetch(`/api/admin/catalogue/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LIVE" }),
    });
    refetch();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/catalogue/${id}`, { method: "DELETE" });
    if (res.ok) {
      setToast("Item deleted");
      refetch();
    } else setToast("Failed to delete");
  };

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const statusVariant: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
    DRAFT: "secondary",
    PENDING_REVIEW: "default",
    LIVE: "default",
    PAUSED: "outline",
    RETIRED: "destructive",
  };

  return (
    <div className="space-y-4">
      {data?.pendingReviewCount ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {data.pendingReviewCount} item(s) awaiting approval.{" "}
          <Link href="/admin/catalogue/approval-queue" className="font-medium underline">
            Review now →
          </Link>
        </div>
      ) : null}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left p-3 font-medium text-slate-700">Photo</th>
                <th className="text-left p-3 font-medium text-slate-700">Name</th>
                <th className="text-left p-3 font-medium text-slate-700">Category</th>
                <th className="text-left p-3 font-medium text-slate-700">Materials</th>
                <th className="text-left p-3 font-medium text-slate-700">Price</th>
                <th className="text-left p-3 font-medium text-slate-700">Status</th>
                <th className="text-right p-3 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.length ? (
                data.items.map((item) => {
                  const primaryPhoto = item.photos?.[0];
                  const price = item.priceOverrideKes ?? item.basePriceKes;
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-slate-100">
                          {primaryPhoto?.url ? (
                            <Image src={primaryPhoto.url} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-slate-400 text-xs">No photo</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-900">{item.name}</span>
                        <p className="text-xs text-slate-500 font-mono">{item.slug}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="rounded-md">{item.category.name}</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {item.availableMaterials?.slice(0, 3).map((m) => (
                            <Badge key={m.materialCode} variant="secondary" className="rounded-md text-xs">
                              {m.materialName}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {price != null ? `From KSh ${Math.round(price).toLocaleString()}` : (
                          <Badge variant="outline" className="rounded-md bg-amber-50 text-amber-800">Price not set</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusVariant[item.status] ?? "secondary"} className="rounded-md">
                          {item.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {toast && (
                          <p className="text-xs text-green-600 mb-1">{toast}</p>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => router.push(`/admin/catalogue/${item.id}/edit`)}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/catalogue/${item.id}/edit?tab=photos`)}>
                              <ImageIcon className="w-4 h-4 mr-2" /> Manage photos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/catalogue/${item.id}/edit?tab=stl`)}>
                              <Box className="w-4 h-4 mr-2" /> Upload STL file
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {item.status === "DRAFT" && (
                              <DropdownMenuItem onClick={() => submitForReview(item.id)}>
                                <Send className="w-4 h-4 mr-2 text-blue-500" />
                                <span className="text-blue-600 font-medium">Submit for review</span>
                              </DropdownMenuItem>
                            )}
                            {item.status === "PENDING_REVIEW" && (
                              <DropdownMenuItem onClick={() => approveItem(item.id)}>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                <span className="text-green-600 font-medium">Approve → Live</span>
                              </DropdownMenuItem>
                            )}
                            {item.status === "LIVE" && (
                              <DropdownMenuItem onClick={() => pauseItem(item.id)}>
                                <Pause className="w-4 h-4 mr-2" /> Pause listing
                              </DropdownMenuItem>
                            )}
                            {item.status === "PAUSED" && (
                              <DropdownMenuItem onClick={() => unpauseItem(item.id)}>
                                <Play className="w-4 h-4 mr-2" /> Resume listing
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => window.open(`/catalogue/${item.slug}`, "_blank")}
                              disabled={item.status !== "LIVE"}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" /> View on site
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <p className="text-slate-500 mb-4">No catalogue items yet. Add items manually or import from Printables.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Button asChild variant="default" size="sm" className="rounded-lg">
                        <Link href="/admin/catalogue/new">Add item manually</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-lg">
                        <Link href="/admin/catalogue/import">Import from Printables</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-slate-500">{data?.total ?? 0} items total</p>
    </div>
  );
}
