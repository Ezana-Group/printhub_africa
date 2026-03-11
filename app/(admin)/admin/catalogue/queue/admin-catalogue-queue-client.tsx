"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface PendingItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  category: { name: string; slug: string };
  licenseType: string;
  basePriceKes: number | null;
  photos: { id: string; url: string; isPrimary: boolean }[];
  availableMaterials: { materialCode: string; materialName: string }[];
}

interface AdminCatalogueQueueClientProps {
  className?: string;
  initialItems?: PendingItem[];
}

export function AdminCatalogueQueueClient({ className, initialItems }: AdminCatalogueQueueClientProps) {
  const router = useRouter();
  const [data, setData] = useState<{ pendingReview: PendingItem[] } | null>(
    initialItems ? { pendingReview: initialItems } : null
  );
  const [loading, setLoading] = useState(!initialItems);
  const [expanded, setExpanded] = useState<string | null>(initialItems?.[0]?.id ?? null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (initialItems) return;
    fetch("/api/admin/catalogue/queue")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ pendingReview: [] }))
      .finally(() => setLoading(false));
  }, [initialItems]);

  const approve = async (id: string) => {
    const res = await fetch(`/api/admin/catalogue/${id}/approve`, { method: "POST" });
    if (res.ok) {
      setData((d) => ({
        pendingReview: d?.pendingReview.filter((i) => i.id !== id) ?? [],
      }));
      router.refresh();
    }
  };

  const reject = async (id: string) => {
    const res = await fetch(`/api/admin/catalogue/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.ok) {
      setData((d) => ({
        pendingReview: d?.pendingReview.filter((i) => i.id !== id) ?? [],
      }));
      setRejectId(null);
      setRejectReason("");
      router.refresh();
    }
  };

  useEffect(() => {
    if (data?.pendingReview?.length && expanded === null) {
      setExpanded(data.pendingReview[0].id);
    }
  }, [data?.pendingReview, expanded]);

  if (loading) return <Skeleton className={`h-48 rounded-xl ${className ?? ""}`} />;

  const items = data?.pendingReview ?? [];
  if (items.length === 0) {
    return (
      <div
        className={`rounded-xl border-2 border-dashed border-slate-200 p-16 text-center ${className ?? ""}`}
      >
        <p className="text-slate-500 font-medium">No items awaiting review</p>
        <p className="text-sm text-slate-400 mt-1">
          Items appear here when you click &quot;Submit for review&quot; on a DRAFT item
        </p>
        <a
          href="/admin/catalogue"
          className="mt-4 inline-block text-sm text-[#FF4D00] hover:underline"
        >
          ← Back to catalogue
        </a>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {items.map((item) => {
        const primaryPhoto = item.photos?.find((p) => p.isPrimary) ?? item.photos?.[0];
        const isExpanded = expanded === item.id;
        const showReject = rejectId === item.id;
        return (
          <div
            key={item.id}
            className="border border-slate-200 rounded-2xl overflow-hidden bg-white"
          >
            <button
              type="button"
              className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 text-left"
              onClick={() => setExpanded(isExpanded ? null : item.id)}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                {primaryPhoto?.url ? (
                  <Image
                    src={primaryPhoto.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                    No photo
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.category?.name} · {item.availableMaterials?.length ?? 0} materials
                </p>
                {item.basePriceKes != null ? (
                  <p className="text-sm font-medium text-[#FF4D00]">
                    KSh {Math.round(item.basePriceKes).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">No price set</p>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50">
                {item.photos && item.photos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Photos ({item.photos.length})
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {item.photos.map((p) => (
                        <div
                          key={p.id}
                          className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 relative"
                        >
                          <Image
                            src={p.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Before approving, verify:
                  </p>
                  <div className="space-y-1.5">
                    {[
                      {
                        label: "Has at least one photo",
                        ok: (item.photos?.length ?? 0) > 0,
                      },
                      { label: "Price is set", ok: item.basePriceKes != null },
                      {
                        label: "Description is complete",
                        ok: (item.description?.length ?? 0) > 20,
                      },
                      { label: "Category assigned", ok: !!item.category },
                      {
                        label: "At least one material",
                        ok: (item.availableMaterials?.length ?? 0) > 0,
                      },
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className={
                            check.ok ? "text-green-500" : "text-red-400"
                          }
                        >
                          {check.ok ? "✓" : "✗"}
                        </span>
                        <span
                          className={
                            check.ok
                              ? "text-slate-700"
                              : "text-red-600"
                          }
                        >
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {showReject ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      Reason for rejection
                    </p>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {[
                        "Missing photos",
                        "Price not set",
                        "Poor description",
                        "Wrong category",
                        "Quality concerns",
                      ].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRejectReason(r)}
                          className={`text-xs px-3 py-1 rounded-full border transition ${
                            rejectReason === r
                              ? "bg-red-500 text-white border-red-500"
                              : "border-red-200 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Or type a custom reason..."
                      className="w-full border border-red-200 rounded-lg p-2 text-sm mb-3 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectId(null);
                          setRejectReason("");
                        }}
                        className="flex-1 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(item.id)}
                        disabled={!rejectReason.trim()}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
                      >
                        Send back to DRAFT
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => approve(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve → Go Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectId(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <a
                      href={`/admin/catalogue/${item.id}/edit`}
                      className="px-4 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-slate-100 transition"
                      aria-label="Edit"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
