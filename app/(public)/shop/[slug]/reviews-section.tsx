"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl focus:outline-none ${value >= n ? "text-amber-500" : "text-slate-300"}`}
          aria-label={`${n} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ProductReviewsSection({ productSlug }: { productSlug: string }) {
  const { status } = useSession();
  const [data, setData] = useState<{
    reviews: Array<{ id: string; rating: number; title: string | null; body: string | null; userName: string; createdAt: string; isVerified: boolean }>;
    summary: { averageRating: number | null; totalCount: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitRating, setSubmitRating] = useState(5);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitBody, setSubmitBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchReviews = useCallback(() => {
    setLoading(true);
    fetch(`/api/products/${productSlug}/reviews?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews) setData(d);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productSlug, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: submitRating,
          title: submitTitle.trim() || undefined,
          body: submitBody.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.error?.message ?? json.error ?? "Failed to submit");
        return;
      }
      setShowForm(false);
      setSubmitTitle("");
      setSubmitBody("");
      setSubmitRating(5);
      fetchReviews();
    } finally {
      setSubmitting(false);
    }
  };

  const summary = data?.summary;
  const reviews = data?.reviews ?? [];

  return (
    <div className="mt-12 border-t border-slate-200 pt-12">
      <h2 className="font-display text-xl font-bold text-slate-900">Reviews</h2>
      {summary && (
        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="flex text-2xl text-amber-500">
              {summary.averageRating != null
                ? [...Array(5)].map((_, i) => (
                    <span key={i}>{i < Math.round(summary.averageRating ?? 0) ? "★" : "☆"}</span>
                  ))
                : "—"}
            </span>
            {summary.averageRating != null && (
              <span className="text-slate-600">{summary.averageRating} · {summary.totalCount} review{summary.totalCount !== 1 ? "s" : ""}</span>
            )}
          </div>
          {status === "authenticated" && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="rounded-xl">
              Write a review
            </Button>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmitReview} className="mt-6 p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
          <div>
            <Label>Your rating</Label>
            <Stars value={submitRating} onChange={setSubmitRating} />
          </div>
          <div>
            <Label htmlFor="review-title">Title (optional)</Label>
            <Input id="review-title" value={submitTitle} onChange={(e) => setSubmitTitle(e.target.value)} placeholder="Summary" className="mt-1 max-w-md" />
          </div>
          <div>
            <Label htmlFor="review-body">Review (optional)</Label>
            <Textarea id="review-body" value={submitBody} onChange={(e) => setSubmitBody(e.target.value)} placeholder="Share your experience..." className="mt-1 max-w-md min-h-[80px]" />
          </div>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="rounded-xl">{submitting ? "Submitting…" : "Submit review"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-slate-500">No reviews yet. Be the first to review!</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-slate-100 pb-6 last:border-0">
              <div className="flex items-center gap-2">
                <span className="flex text-amber-500">{[...Array(r.rating)].map((_, i) => <span key={i}>★</span>)}</span>
                {r.title && <span className="font-medium">{r.title}</span>}
                <span className="text-sm text-slate-500">{r.userName} · {new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.body && <p className="mt-2 text-slate-700">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
      {data && data.summary.totalCount > 10 && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
