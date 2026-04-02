"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface MockupItem {
  id: string;
  productId: string;
  platform: string;
  imageUrl: string;
  generator: string;
  isApproved: boolean;
  createdAt: string;
  product: { name: string; slug: string };
}

interface VideoItem {
  id: string;
  productId: string;
  platform: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { name: string };
}

interface Props {
  mockups: MockupItem[];
  videos: VideoItem[];
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  variation: "Variation",
  youtube_shorts: "YT Shorts",
  instagram_reels: "IG Reels",
};

export function ContentQueueTable({ mockups, videos }: Props) {
  const [tab, setTab] = useState<"mockups" | "videos">("mockups");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleApprove = async (type: "mockup" | "video", id: string, approve: boolean) => {
    await fetch(`/api/admin/ai/content-approval`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, isApproved: approve }),
    });
    startTransition(() => router.refresh());
  };

  const handleApproveAll = async (type: "mockup" | "video") => {
    const items = type === "mockup" ? mockups : videos;
    await Promise.all(
      items
        .filter((i) => !i.isApproved)
        .map((i) => fetch("/api/admin/ai/content-approval", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id: i.id, isApproved: true }),
        }))
    );
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["mockups", "videos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "mockups" ? `Mockups (${mockups.filter((m) => !m.isApproved).length} pending)` : `Videos (${videos.filter((v) => !v.isApproved).length} pending)`}
          </button>
        ))}
      </div>

      {tab === "mockups" && (
        <div className="space-y-4">
          {mockups.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => handleApproveAll("mockup")}
                disabled={pending}
                className="px-4 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Approve All Mockups
              </button>
            </div>
          )}
          {mockups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No mockups pending approval</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockups.map((m) => (
                <div key={m.id} className="rounded-lg border overflow-hidden bg-card">
                  <div className="relative aspect-square">
                    <Image src={m.imageUrl} alt={m.product.name} fill className="object-cover" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {PLATFORM_LABELS[m.platform] ?? m.platform}
                      </span>
                      <span className="text-xs text-muted-foreground">{m.generator}</span>
                    </div>
                    <p className="text-xs font-medium truncate">{m.product.name}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove("mockup", m.id, true)}
                        disabled={pending || m.isApproved}
                        className="flex-1 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                      >
                        {m.isApproved ? "✓ Approved" : "Approve"}
                      </button>
                      <button
                        onClick={() => handleApprove("mockup", m.id, false)}
                        disabled={pending}
                        className="flex-1 py-1 text-xs font-medium rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "videos" && (
        <div className="space-y-4">
          {videos.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => handleApproveAll("video")}
                disabled={pending}
                className="px-4 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Approve All Videos
              </button>
            </div>
          )}
          {videos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No videos pending approval</p>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => (
                <div key={v.id} className="flex items-center gap-3 border rounded-lg p-3 bg-card">
                  {v.thumbnailUrl && (
                    <div className="relative w-16 h-16 rounded overflow-hidden shrink-0">
                      <Image src={v.thumbnailUrl} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.product.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {PLATFORM_LABELS[v.platform] ?? v.platform}
                      </span>
                      <a
                        href={v.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Preview ↗
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove("video", v.id, true)}
                      disabled={pending || v.isApproved}
                      className="px-3 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                    >
                      {v.isApproved ? "✓" : "Approve"}
                    </button>
                    <button
                      onClick={() => handleApprove("video", v.id, false)}
                      disabled={pending}
                      className="px-3 py-1 text-xs font-medium rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
