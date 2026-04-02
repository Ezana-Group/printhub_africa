"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CalendarDay {
  date: string;
  posts: {
    platform: string;
    content: string;
    hashtags?: string;
  }[];
}

interface Props {
  weekStarting: string;
  days: CalendarDay[];
  strategy: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  facebook: "👥",
  tiktok: "🎵",
  linkedin: "💼",
  twitter: "🐦",
  telegram: "✈️",
  youtube: "📺",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ContentCalendarView({ weekStarting, days, strategy }: Props) {
  const [editing, setEditing] = useState<{ dayIdx: number; postIdx: number } | null>(null);
  const [editContent, setEditContent] = useState("");
  const [posting, setPosting] = useState<string | null>(null);
  const [showStrategy, setShowStrategy] = useState(false);
  const router = useRouter();

  const handleEdit = (dayIdx: number, postIdx: number, content: string) => {
    setEditing({ dayIdx, postIdx });
    setEditContent(content);
  };

  const handlePostNow = async (platform: string, content: string) => {
    setPosting(`${platform}-${content.slice(0, 10)}`);
    await new Promise((r) => setTimeout(r, 1500)); // simulate
    setPosting(null);
    alert(`Posted to ${platform}! (Configure via n8n webhook)`);
  };

  if (days.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No content calendar for this week yet. It will be generated Monday 7AM EAT.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Week of {new Date(weekStarting).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => setShowStrategy((s) => !s)}
          className="text-xs text-primary hover:underline"
        >
          {showStrategy ? "Hide" : "Show"} weekly strategy
        </button>
      </div>

      {showStrategy && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap text-muted-foreground max-h-48 overflow-y-auto">
          {strategy}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {DAYS.map((dayName, dayIdx) => {
          const day = days[dayIdx];
          const dayDate = new Date(weekStarting);
          dayDate.setDate(dayDate.getDate() + dayIdx);

          return (
            <div key={dayName} className="rounded-lg border bg-card">
              <div className="p-2 border-b bg-muted/50 rounded-t-lg">
                <p className="text-xs font-semibold">{dayName}</p>
                <p className="text-xs text-muted-foreground">
                  {dayDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="p-2 space-y-2">
                {day?.posts?.map((post, postIdx) => {
                  const postKey = `${dayIdx}-${postIdx}-${post.platform}`;
                  const isEditing = editing?.dayIdx === dayIdx && editing?.postIdx === postIdx;
                  return (
                    <div key={postIdx} className="text-xs border rounded p-1.5 space-y-1 bg-background">
                      <div className="flex items-center gap-1">
                        <span>{PLATFORM_ICONS[post.platform] ?? "📢"}</span>
                        <span className="font-medium capitalize">{post.platform}</span>
                      </div>
                      {isEditing ? (
                        <div className="space-y-1">
                          <textarea
                            className="w-full text-xs border rounded px-1 py-1 resize-none bg-background"
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditing(null)}
                              className="flex-1 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="py-0.5 px-2 rounded bg-muted text-muted-foreground hover:bg-muted/80"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-muted-foreground leading-relaxed line-clamp-3">{post.content}</p>
                          <div className="flex gap-1 pt-0.5">
                            <button
                              onClick={() => handleEdit(dayIdx, postIdx, post.content)}
                              className="flex-1 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handlePostNow(post.platform, post.content)}
                              disabled={posting === postKey}
                              className="flex-1 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {posting === postKey ? "…" : "Post"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {(!day?.posts || day.posts.length === 0) && (
                  <p className="text-xs text-muted-foreground/60 py-2 text-center">Rest day</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
