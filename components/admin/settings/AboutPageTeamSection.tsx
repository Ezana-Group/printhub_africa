"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

type StaffItem = {
  id: string;
  name: string | null;
  staff: {
    showOnAboutPage: boolean;
    publicName: string | null;
    publicRole: string | null;
  } | null;
};

export function AboutPageTeamSection({
  staff,
  visibleOnAbout,
  totalStaff,
}: {
  staff: StaffItem[];
  visibleOnAbout: number;
  totalStaff: number;
}) {
  const router = useRouter();

  const handleToggle = async (userId: string, showOnAboutPage: boolean) => {
    try {
      const res = await fetch(`/api/admin/staff/${userId}/public-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnAboutPage }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <div className="bg-orange-50 border border-primary/20 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-[#111]">About Page — Team Section</h3>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {visibleOnAbout} of {totalStaff} staff members shown on /about
          </p>
        </div>
        <a
          href="/about#team"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Preview on site <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(s.staff?.publicName ?? s.name ?? "S").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#111] truncate">
                {s.staff?.publicName ?? s.name ?? "—"}
              </p>
              <p className="text-xs text-[#6B7280] truncate">
                {s.staff?.publicRole ?? "No public role set"}
              </p>
            </div>
            {s.staff != null ? (
              <button
                type="button"
                onClick={() => {
                  const st = s.staff;
                  if (st) handleToggle(s.id, !st.showOnAboutPage);
                }}
                className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${
                  s.staff.showOnAboutPage ? "bg-primary" : "bg-gray-200"
                }`}
                aria-label={s.staff.showOnAboutPage ? "Hide from about page" : "Show on about page"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    s.staff.showOnAboutPage ? "translate-x-5" : ""
                  }`}
                />
              </button>
            ) : (
              <span className="text-xs text-[#6B7280]">—</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-[#6B7280] mt-3">
        Click the toggle to show/hide each person. Edit their public name, title, and photo by opening
        their profile (Staff → click row).
      </p>
    </div>
  );
}
