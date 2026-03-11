"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ImageOff,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface PendingItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  category: { name: string; slug: string };
  licenseType: string;
  sourceUrl: string | null;
  sourceType: string | null;
  designerCredit: string | null;
  photos: { id: string; url: string; isPrimary: boolean }[];
  availableMaterials: { materialCode: string; materialName: string }[];
  basePriceKes: number | null;
  stlFileName: string | null;
  weightGrams: number | null;
  internalNotes: string | null;
  createdAt: string;
  addedByUser?: { name: string } | null;
}

const REJECT_REASONS = [
  "License unclear",
  "No photos uploaded",
  "Price not set",
  "No STL file",
  "Print specs missing",
  "Poor quality / unprintable",
  "Duplicate item",
];

function formatRelativeDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function AdminCatalogueQueueClient({ className }: { className?: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    pendingReview: PendingItem[];
    draftCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Record<string, Record<string, boolean>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetch("/api/admin/catalogue/queue")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ pendingReview: [], draftCount: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const updateChecklist = (itemId: string, key: string, value: boolean) => {
    setChecklist((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? {}), [key]: value },
    }));
  };

  const setNotesForItem = (itemId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [itemId]: value }));
  };

  const approvalChecks = [
    { key: "license", label: "License verified as commercially safe on source platform", warning: (i: PendingItem) => (!i.sourceUrl ? "No source URL provided — verify manually" : null) },
    { key: "stl", label: "STL file uploaded", warning: (i: PendingItem) => (!i.stlFileName ? "⚠ No STL file — required for production" : null) },
    { key: "photos", label: "Real print photos uploaded (not designer renders)", warning: (i: PendingItem) => (i.photos?.length === 0 ? "⚠ No photos uploaded" : null) },
    { key: "price", label: "Price set and makes sense for production cost", warning: (i: PendingItem) => (!i.basePriceKes ? "⚠ Price not set" : null) },
    { key: "materials", label: "Material options configured with colours", warning: (i: PendingItem) => ((i.availableMaterials?.length ?? 0) === 0 ? "⚠ No materials set" : null) },
    { key: "specs", label: "Print specs filled (weight, time, difficulty)", warning: (i: PendingItem) => (!i.weightGrams ? "⚠ Print specs incomplete" : null) },
  ];

  const allChecklistComplete = (itemId: string) => {
    const item = data?.pendingReview?.find((i) => i.id === itemId);
    if (!item) return false;
    return approvalChecks.every((c) => checklist[itemId]?.[c.key] === true);
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/admin/catalogue/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LIVE" }),
    });
    if (res.ok) {
      setData((d) => ({
        ...d!,
        pendingReview: d!.pendingReview.filter((i) => i.id !== id),
      }));
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingItemId(id);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingItemId || !rejectionReason.trim()) return;
    const res = await fetch(`/api/admin/catalogue/${rejectingItemId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT", rejectionReason: rejectionReason.trim() }),
    });
    if (res.ok) {
      setData((d) => ({
        ...d!,
        pendingReview: d!.pendingReview.filter((i) => i.id !== rejectingItemId),
      }));
      setRejectModalOpen(false);
      setRejectingItemId(null);
      setRejectionReason("");
    }
  };

  if (loading) return <Skeleton className={`h-48 rounded-xl ${className ?? ""}`} />;

  const pending = data?.pendingReview ?? [];
  const draftCount = data?.draftCount ?? 0;

  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      {/* Tabs placeholder — single "Pending Review" view */}
      {pending.length === 0 && draftCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 {draftCount} item{draftCount > 1 ? "s are" : " is"} in Draft status. Complete the
            checklist on each item and submit for review.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => router.push("/admin/catalogue?status=DRAFT")}
          >
            View draft items →
          </Button>
        </div>
      )}

      {pending.length === 0 && draftCount === 0 && (
        <div className="text-center py-16 rounded-xl border border-gray-200 bg-gray-50">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700">All clear!</h3>
          <p className="text-gray-500 mt-1">No items are waiting for review.</p>
          <Button
            className="mt-4 bg-[#FF4D00] hover:bg-[#e64400] text-white"
            onClick={() => router.push("/admin/catalogue/new")}
          >
            + Add a new item
          </Button>
        </div>
      )}

      {pending.length > 0 &&
        pending.map((item) => {
          const primaryPhoto = item.photos?.find((p) => p.isPrimary) ?? item.photos?.[0];
          return (
            <div
              key={item.id}
              className="border border-amber-200 rounded-xl p-5 bg-white space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {primaryPhoto?.url ? (
                    <Image
                      src={primaryPhoto.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-gray-300">
                      <ImageOff className="w-8 h-8" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <Badge className="bg-amber-100 text-amber-800">⏳ Pending Review</Badge>
                    <Badge variant="outline" className="rounded-full">
                      {item.licenseType.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.category.name} · Added {formatRelativeDate(item.createdAt)}
                    {item.addedByUser?.name && ` by ${item.addedByUser.name}`}
                  </p>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View source on {item.sourceType ?? "platform"}
                    </a>
                  )}
                  {item.designerCredit && (
                    <p className="text-xs text-gray-400 mt-1">{item.designerCredit}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500">
                    {item.availableMaterials?.length ?? 0} material
                    {(item.availableMaterials?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                  <p
                    className={
                      item.basePriceKes ? "text-gray-700 font-medium" : "text-amber-600"
                    }
                  >
                    {item.basePriceKes
                      ? `KSh ${item.basePriceKes.toLocaleString()}`
                      : "No price"}
                  </p>
                  <p className="text-gray-500">
                    {item.photos?.length ?? 0} photo{(item.photos?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Approval checklist — tick each after verifying
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {approvalChecks.map((check) => {
                    const warning = check.warning(item);
                    return (
                      <label
                        key={check.key}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={checklist[item.id]?.[check.key] ?? false}
                          onChange={(e) =>
                            updateChecklist(item.id, check.key, e.target.checked)
                          }
                          className="mt-0.5 accent-[#FF4D00]"
                        />
                        <div>
                          <span className="text-sm text-gray-700">{check.label}</span>
                          {warning && (
                            <p className="text-xs text-amber-600 mt-0.5">{warning}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">
                  Internal notes (optional — visible to staff only)
                </label>
                <textarea
                  value={notes[item.id] ?? item.internalNotes ?? ""}
                  onChange={(e) => setNotesForItem(item.id, e.target.value)}
                  placeholder="Add approval notes, print instructions, etc."
                  className="w-full mt-1 text-sm border rounded-lg p-2 resize-none h-16"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/catalogue/${item.id}/edit`)}
                >
                  ✏ Edit item
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => openRejectModal(item.id)}
                  >
                    ✗ Reject
                  </Button>
                  <Button
                    size="sm"
                    className={
                      allChecklistComplete(item.id)
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }
                    disabled={!allChecklistComplete(item.id)}
                    onClick={() => handleApprove(item.id)}
                  >
                    ✓ Approve — Set Live
                  </Button>
                </div>
              </div>
              {!allChecklistComplete(item.id) && (
                <p className="text-xs text-center text-amber-600">
                  Tick all checklist items above to enable approval
                </p>
              )}
            </div>
          );
        })}

      <AlertDialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this item</AlertDialogTitle>
            <AlertDialogDescription>
              The item will be returned to Draft status. The team member who submitted it
              can be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 my-4">
            <label className="text-sm font-medium">Reason (required)</label>
            <div className="flex flex-wrap gap-2">
              {REJECT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${
                    rejectionReason === reason
                      ? "bg-red-100 border-red-300 text-red-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Or type a custom reason..."
              className="w-full border rounded-lg p-3 text-sm resize-none h-20"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectionReason.trim()}
              onClick={handleReject}
            >
              Reject item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
