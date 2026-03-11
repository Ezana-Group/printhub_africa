"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Download,
  Plus,
  AlertTriangle,
  Layers,
  CheckCircle,
  Clock,
  PauseCircle,
  Search,
  MoreHorizontal,
  Pencil,
  Image as ImageIcon,
  FolderUp,
  DollarSign,
  Send,
  Check,
  Archive,
  ExternalLink,
  Trash2,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CatalogueItemRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  licenseType: string;
  category: { id: string; name: string; slug: string };
  photos: { url: string }[];
  availableMaterials: { materialCode: string; materialName: string; priceModifierKes: number; isDefault: boolean }[];
  basePriceKes: number | null;
  priceOverrideKes: number | null;
  designer: { name: string } | null;
}

interface Stats {
  total: number;
  draft: number;
  pendingReview: number;
  live: number;
  paused: number;
  retired: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "⏳ Pending Review",
  LIVE: "● Live",
  PAUSED: "⏸ Paused",
  RETIRED: "Retired",
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  LIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-orange-100 text-orange-800",
  RETIRED: "bg-red-100 text-red-800",
};

const LICENSE_LABELS: Record<string, string> = {
  CC0: "CC0",
  CC_BY: "CC BY",
  CC_BY_SA: "CC BY-SA",
  PARTNERSHIP: "Partner",
  ORIGINAL: "Original",
};

const LICENSE_CLASS: Record<string, string> = {
  CC0: "bg-green-100 text-green-800",
  CC_BY: "bg-blue-100 text-blue-800",
  CC_BY_SA: "bg-blue-100 text-blue-800",
  PARTNERSHIP: "bg-orange-100 text-orange-800",
  ORIGINAL: "bg-purple-100 text-purple-800",
};

export function AdminCatalogueClient() {
  const router = useRouter();
  const [data, setData] = useState<{
    items: CatalogueItemRow[];
    total: number;
    stats: Stats;
    page: number;
    perPage: number;
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCatalogue = useCallback(() => {
    const params = new URLSearchParams();
    if (statusTab !== "all") params.set("status", statusTab);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (licenseFilter !== "all") params.set("license", licenseFilter);
    if (search.trim()) params.set("q", search.trim());
    params.set("page", String(page));
    params.set("perPage", "25");
    fetch(`/api/admin/catalogue?${params}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [statusTab, categoryFilter, licenseFilter, search, page]);

  useEffect(() => {
    setLoading(true);
    fetchCatalogue();
  }, [fetchCatalogue]);

  useEffect(() => {
    fetch("/api/admin/catalogue/categories")
      .then((r) => r.json())
      .then((list: Category[]) => setCategories(Array.isArray(list) ? list : []))
      .catch(() => setCategories([]));
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/catalogue/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchCatalogue();
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    const res = await fetch(`/api/admin/catalogue/${id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.ok) fetchCatalogue();
  };

  if (loading && !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const stats = data?.stats ?? { total: 0, draft: 0, pendingReview: 0, live: 0, paused: 0, retired: 0 };
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const categoryOptions: SelectOption[] = [
    { value: "all", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const licenseOptions: SelectOption[] = [
    { value: "all", label: "All Licenses" },
    { value: "CC0", label: "CC0 — Public Domain" },
    { value: "CC_BY", label: "CC BY" },
    { value: "ORIGINAL", label: "Original" },
    { value: "PARTNERSHIP", label: "Partnership" },
  ];

  const tabs = [
    { label: "All", value: "all", count: stats.total },
    { label: "Live", value: "LIVE", count: stats.live },
    { label: "Pending Review", value: "PENDING_REVIEW", count: stats.pendingReview },
    { label: "Draft", value: "DRAFT", count: stats.draft },
    { label: "Paused", value: "PAUSED", count: stats.paused },
    { label: "Retired", value: "RETIRED", count: stats.retired },
  ];

  const kpiCards = [
    { label: "Total Items", value: stats.total, color: "" },
    { label: "Live", value: stats.live, color: "text-green-600" },
    { label: "Pending Review", value: stats.pendingReview, color: "text-amber-600" },
    { label: "Paused", value: stats.paused, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Print-on-demand items · {stats.total} total
            {stats.pendingReview > 0 && (
              <span className="text-amber-600 font-medium ml-1">
                · {stats.pendingReview} awaiting approval
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/catalogue/import")}>
            <Download className="w-4 h-4 mr-2" />
            Import from Printables
          </Button>
          <Button
            className="bg-[#FF4D00] hover:bg-[#e64400] text-white"
            onClick={() => router.push("/admin/catalogue/new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Amber warning banner */}
      {stats.pendingReview > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-800 font-medium">
              {stats.pendingReview} item{stats.pendingReview > 1 ? "s" : ""} awaiting your approval
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => router.push("/admin/catalogue/queue")}
          >
            Review now →
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusTab(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              statusTab === tab.value
                ? "bg-[#FF4D00] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categoryOptions}
          placeholder="Category"
          className="w-40"
        />
        <Select
          value={licenseFilter}
          onChange={(e) => setLicenseFilter(e.target.value)}
          options={licenseOptions}
          placeholder="License"
          className="w-36"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-3 font-medium text-gray-700 w-20">Photo</th>
                <th className="text-left p-3 font-medium text-gray-700">Name</th>
                <th className="text-left p-3 font-medium text-gray-700">Category</th>
                <th className="text-left p-3 font-medium text-gray-700">Materials</th>
                <th className="text-left p-3 font-medium text-gray-700">Price</th>
                <th className="text-left p-3 font-medium text-gray-700">License</th>
                <th className="text-left p-3 font-medium text-gray-700">Status</th>
                <th className="text-right p-3 font-medium text-gray-700 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => {
                  const primaryPhoto = item.photos?.[0];
                  const price = item.priceOverrideKes ?? item.basePriceKes;
                  const materials = item.availableMaterials ?? [];
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="p-3">
                        <div
                          className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0"
                          title={!primaryPhoto ? "No photos — required before going live" : ""}
                        >
                          {primaryPhoto?.url ? (
                            <Image
                              src={primaryPhoto.url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-gray-400">
                              <ImageOff className="w-6 h-6" />
                            </span>
                          )}
                          {!primaryPhoto && (
                            <span className="absolute inset-0 bg-amber-100/80 flex items-center justify-center opacity-0 hover:opacity-100 transition text-amber-700 text-xs text-center px-1">
                              No photos
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-900 block">{item.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{item.slug}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="rounded-md">
                          {item.category.name}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {materials.length > 0 ? (
                            materials.slice(0, 3).map((m) => (
                              <Badge
                                key={m.materialCode}
                                variant="secondary"
                                className="rounded-md text-xs"
                              >
                                {m.materialName}
                              </Badge>
                            ))
                          ) : (
                            <Badge className="rounded-md bg-amber-100 text-amber-800 text-xs">
                              None set
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {price != null ? (
                          <span>From KSh {Math.round(price).toLocaleString()}</span>
                        ) : (
                          <Badge className="rounded-md bg-amber-100 text-amber-800 text-xs">
                            Price not set
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            LICENSE_CLASS[item.licenseType] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {LICENSE_LABELS[item.licenseType] ?? "No license"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                            STATUS_CLASS[item.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/catalogue/${item.id}/edit`)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/catalogue/${item.id}/edit`)}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Manage photos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/catalogue/${item.id}/edit`)}
                            >
                              <FolderUp className="w-4 h-4 mr-2" />
                              Upload STL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/sales/calculator?item=${item.id}`)}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Calculate price
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {item.status === "DRAFT" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "PENDING_REVIEW")}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Submit for review
                              </DropdownMenuItem>
                            )}
                            {item.status === "PENDING_REVIEW" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "LIVE")}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Approve — Set Live
                              </DropdownMenuItem>
                            )}
                            {item.status === "LIVE" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "PAUSED")}
                              >
                                <PauseCircle className="w-4 h-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {item.status === "PAUSED" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(item.id, "LIVE")}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Unpause
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(item.id, "RETIRED")}
                              className="text-orange-600"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Retire
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {item.status === "LIVE" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(`/catalogue/${item.slug}`, "_blank")
                                }
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on site
                              </DropdownMenuItem>
                            )}
                            {(item.status === "DRAFT" || item.status === "RETIRED") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setDeleteId(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <p className="text-gray-500 mb-4">
                      No catalogue items yet. Add items manually or import from Printables.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        onClick={() => router.push("/admin/catalogue/new")}
                        variant="default"
                        size="sm"
                        className="rounded-lg bg-[#FF4D00] hover:bg-[#e64400]"
                      >
                        Add item manually
                      </Button>
                      <Button
                        onClick={() => router.push("/admin/catalogue/import")}
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                      >
                        Import from Printables
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-500">{total} items total</p>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the catalogue item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
