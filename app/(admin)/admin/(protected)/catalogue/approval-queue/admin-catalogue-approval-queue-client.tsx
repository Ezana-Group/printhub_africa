"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Archive, 
  RefreshCcw, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

type TabType = "DRAFT" | "PENDING_REVIEW" | "REJECTED" | "LIVE" | "ARCHIVED";

interface CatalogueItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
  importedAt: string | null;
  archivedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  category: { name: string; slug: string } | null;
  importedBy?: { name: string | null; email: string | null } | null;
  approvedBy?: { name: string | null; email: string | null } | null;
  archivedBy?: { name: string | null; email: string | null } | null;
  rejectedBy?: { name: string | null; email: string | null } | null;
  photos: { id: string; url: string; isPrimary: boolean }[];
  isImport?: boolean; // Added flag from API
}

export function AdminCatalogueApprovalQueueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "PENDING_REVIEW"
  );
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [counts, setCounts] = useState<{ DRAFT: number; PENDING_REVIEW: number; REJECTED: number; LIVE: number; ARCHIVED: number }>({
    DRAFT: 0,
    PENDING_REVIEW: 0,
    REJECTED: 0,
    LIVE: 0,
    ARCHIVED: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/catalogue/approval-queue/count");
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to fetch counts", err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        search,
        platform: platform === "All" ? "" : platform,
        page: page.toString(),
        limit: "20",
      });
      const res = await fetch(`/api/admin/catalogue/approval-queue?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, platform, page]);

  useEffect(() => {
    fetchCounts();
    fetchItems();
  }, [fetchCounts, fetchItems]);

  const handleAction = async (id: string, action: string, reason?: string) => {
    try {
      // Determine the correct endpoint based on item type and action
      const item = items.find(i => i.id === id);
      const endpoint = item?.isImport 
        ? `/api/admin/import/${id}/${action}` // We'll need to check if these exist
        : `/api/admin/catalogue/approval-queue/${id}/${action}`;

      const res = await fetch(endpoint, {
        method: item?.isImport && action === "approve" ? "POST" : "PATCH", // Approve on import is usually POST
        headers: { "Content-Type": "application/json" },
        body: reason ? JSON.stringify({ reason }) : undefined,
      });

      if (res.ok) {
        toast.success(`Item ${action}ed successfully`);
        fetchCounts();
        fetchItems();
        router.refresh();
      } else {
        toast.error(`Failed to ${action} item`);
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this item?")) return;
    try {
      const item = items.find(i => i.id === id);
      const endpoint = item?.isImport 
        ? `/api/admin/import/${id}` 
        : `/api/admin/catalogue/approval-queue/${id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item deleted");
        fetchCounts();
        fetchItems();
        router.refresh();
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error occurred");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    
    let reason = "";
    if (action === "reject") {
      reason = prompt("Reason for rejection:") || "";
      if (!reason) return;
    }

    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/admin/catalogue/approval-queue/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action, reason }),
      });
      if (res.ok) {
        toast.success(`Bulk ${action} successful`);
        setSelectedIds([]);
        fetchCounts();
        fetchItems();
        router.refresh();
      } else {
        toast.error(`Bulk ${action} failed`);
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: "DRAFT", label: "Drafts", count: counts.DRAFT },
          { id: "PENDING_REVIEW", label: "Needs Review", count: counts.PENDING_REVIEW },
          { id: "REJECTED", label: "Rejected", count: counts.REJECTED },
          { id: "LIVE", label: "Approved", count: counts.LIVE },
          { id: "ARCHIVED", label: "Archived", count: counts.ARCHIVED },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType);
              setPage(1);
            }}
            className={cn(
              "px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === tab.id ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option>All Sources</option>
            <option>Manual</option>
            <option>Import</option>
            <option>Thingiverse</option>
            <option>Printables</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-primary/5 p-1 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <span className="text-xs font-semibold px-2 text-primary">
              {selectedIds.length} selected
            </span>
            <div className="h-4 w-px bg-primary/20 mx-1" />
            {activeTab === "PENDING_REVIEW" && (
              <>
                <button
                  onClick={() => handleBulkAction("approve")}
                  disabled={isBulkLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction("reject")}
                  disabled={isBulkLoading}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Selected
                </button>
              </>
            )}
            {activeTab === "LIVE" && (
              <button
                onClick={() => handleBulkAction("archive")}
                disabled={isBulkLoading}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 disabled:opacity-50"
              >
                Archive Selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="p-4 font-semibold text-slate-700">Preview</th>
              <th className="p-4 font-semibold text-slate-700">Item Details</th>
              <th className="p-4 font-semibold text-slate-700">Source</th>
              <th className="p-4 font-semibold text-slate-700">Submitted By</th>
              <th className="p-4 font-semibold text-slate-700">Date</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  <td className="p-4"><div className="h-4 w-4 bg-slate-100 rounded" /></td>
                  <td className="p-4"><div className="h-12 w-12 bg-slate-100 rounded-lg" /></td>
                  <td className="p-4"><div className="space-y-2"><div className="h-4 w-32 bg-slate-100 rounded" /><div className="h-3 w-20 bg-slate-50 rounded" /></div></td>
                  <td className="p-4"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                  <td className="p-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                  <td className="p-4"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                  <td className="p-4"></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-20 text-center text-slate-500">
                  <Layers className="h-12 w-12 mx-auto text-slate-200 mb-4 stroke-1" />
                  <p className="font-medium text-slate-900">No items in {activeTab.replace("_", " ").toLowerCase()}</p>
                  <p className="text-xs mt-1">Try adjusting your filters or switching tabs.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const primaryPhoto = item.photos.find(p => p.isPrimary) || item.photos[0];
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200 shadow-sm">
                        {primaryPhoto && primaryPhoto.url ? (
                          <Image src={primaryPhoto.url} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 bg-slate-50 font-bold">
                            N/A
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 line-clamp-1">{item.name}</span>
                        <span className="text-xs text-slate-500">{item.category?.name || "Uncategorized"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        item.sourceType === "THINGIVERSE" ? "bg-blue-50 text-blue-600" :
                        item.sourceType === "PRINTABLES" ? "bg-orange-50 text-orange-600" :
                        item.isImport ? "bg-purple-50 text-purple-600" :
                        "bg-slate-50 text-slate-600"
                      )}>
                        {item.sourceType || (item.isImport ? "IMPORT" : "MANUAL")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700">{item.importedBy?.name || "System"}</span>
                        <span className="text-[10px] text-slate-400">Collaborator</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700">{format(new Date(item.updatedAt || item.createdAt), "MMM d, yyyy")}</span>
                        <span className="text-[10px] text-slate-400">{format(new Date(item.updatedAt || item.createdAt), "HH:mm")}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                         {item.status === "PENDING_REVIEW" && (
                          <>
                            <button
                              onClick={() => handleAction(item.id, "approve")}
                              title="Approve"
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const r = prompt("Reason for rejection:");
                                if (r) handleAction(item.id, "reject", r);
                              }}
                              title="Reject"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem asChild>
                                {item.isImport ? (
                                  <Link href={`/admin/catalogue/import/${item.id}/review`} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>Review Import</span>
                                  </Link>
                                ) : (
                                  <Link href={`/admin/catalogue/${item.id}/edit`} className="cursor-pointer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    <span>Edit Item</span>
                                  </Link>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 rounded hover:bg-white disabled:opacity-40 transition-colors shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
