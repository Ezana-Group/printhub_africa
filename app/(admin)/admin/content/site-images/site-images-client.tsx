"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FileUploader } from "@/components/upload/FileUploader";
import type { UploadedFileResult } from "@/components/upload/FileUploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, RotateCcw, ImageIcon, LayoutGrid, Users, Home } from "lucide-react";
import type { SiteImageTabId } from "@/lib/site-images";

export type SiteImageSlotRow = {
  key: string;
  tab: SiteImageTabId;
  /** Secondary grouping inside a tab (e.g. per-service). */
  group: string | null;
  label: string;
  description: string;
  imagePath: string;
  defaultPath: string;
  isOverridden: boolean;
  alt: string | null;
  updatedAt: string | null;
};

const TAB_CONFIG: Record<SiteImageTabId, { label: string; icon: typeof Home }> = {
  services: { label: "Services page", icon: LayoutGrid },
  about: { label: "About page", icon: Users },
  homepage: { label: "Homepage", icon: Home },
};

function getPublicUrl(file: UploadedFileResult): string {
  if (file.publicUrl) return file.publicUrl;
  const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_R2_PUBLIC_URL : "";
  return base && file.storageKey ? `${base}/${file.storageKey}` : file.storageKey;
}

export function SiteImagesClient({ initialSlots }: { initialSlots: SiteImageSlotRow[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState<SiteImageSlotRow[]>(initialSlots);
  const [activeTab, setActiveTab] = useState<SiteImageTabId>("homepage");
  const [activeGroup, setActiveGroup] = useState<string>("All");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const slotsByTab = useMemo(() => {
    const map: Record<SiteImageTabId, SiteImageSlotRow[]> = {
      services: [],
      about: [],
      homepage: [],
    };
    for (const slot of slots) {
      map[slot.tab].push(slot);
    }
    return map;
  }, [slots]);

  const currentSlots = slotsByTab[activeTab];
  const groupOptions = useMemo(() => {
    if (activeTab !== "services") return [];
    const set = new Set<string>();
    currentSlots.forEach((s) => {
      if (s.group && s.group.trim()) set.add(s.group.trim());
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [activeTab, currentSlots]);

  const visibleSlots = useMemo(() => {
    if (activeTab !== "services") return currentSlots;
    if (activeGroup === "All") return currentSlots;
    return currentSlots.filter((s) => (s.group ?? "") === activeGroup);
  }, [activeTab, activeGroup, currentSlots]);

  const updateSlotPath = useCallback((key: string, imagePath: string | null) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.key === key
          ? {
              ...s,
              imagePath: imagePath ?? s.defaultPath,
              isOverridden: !!imagePath,
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, []);

  const handleUploadComplete = useCallback(
    async (files: UploadedFileResult[], key: string) => {
      const file = files[0];
      if (!file) return;
      const url = getPublicUrl(file);
      if (!url) {
        setUploadError("Could not get image URL. Check R2_PUBLIC_URL is set.");
        return;
      }
      setUploadError(null);
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/content/site-images/${key}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePath: url }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to save");
        }
        updateSlotPath(key, url);
        setEditingKey(null);
        router.refresh();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [updateSlotPath, router]
  );

  const handleReset = useCallback(
    async (key: string) => {
      if (!confirm("Reset this image to the default?")) return;
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/content/site-images/${key}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePath: null }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to reset");
        }
        const slot = slots.find((s) => s.key === key);
        updateSlotPath(key, slot?.defaultPath ?? null);
        router.refresh();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Failed to reset");
      } finally {
        setSaving(false);
      }
    },
    [slots, updateSlotPath, router]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {(Object.keys(TAB_CONFIG) as SiteImageTabId[]).map((tabId) => {
          const config = TAB_CONFIG[tabId];
          const Icon = config.icon;
          const count = slotsByTab[tabId].length;
          return (
            <Button
              key={tabId}
              variant={activeTab === tabId ? "default" : "outline"}
              size="sm"
              className="rounded-lg gap-2"
              onClick={() => {
                setActiveTab(tabId);
                setActiveGroup("All");
              }}
            >
              <Icon className="h-4 w-4" />
              {config.label}
              <span className="text-xs opacity-80">({count})</span>
            </Button>
          );
        })}
      </div>

      {activeTab === "services" && groupOptions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groupOptions.map((g) => (
            <Button
              key={g}
              variant={activeGroup === g ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => setActiveGroup(g)}
              disabled={saving}
            >
              {g}
            </Button>
          ))}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {visibleSlots.map((slot) => (
        <Card key={slot.key} className="overflow-hidden">
          <CardHeader className="pb-2">
            <h3 className="font-semibold text-slate-900">{slot.label}</h3>
            <p className="text-xs text-slate-500">{slot.description}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {slot.imagePath ? (
                slot.imagePath.startsWith("http") ? (
                  // External (R2) URL — use img to avoid Next image domain config
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slot.imagePath}
                    alt={slot.alt ?? slot.label}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={slot.imagePath}
                    alt={slot.alt ?? slot.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                className="rounded-lg"
                onClick={() => setEditingKey(slot.key)}
                disabled={saving}
              >
                Change image
              </Button>
              {slot.isOverridden && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => handleReset(slot.key)}
                  disabled={saving}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset to default
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>

      <Dialog open={editingKey !== null} onOpenChange={(open) => !open && setEditingKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? slots.find((s) => s.key === editingKey)?.label : "Upload image"}
            </DialogTitle>
            <DialogDescription>
              Upload a new image. It will replace the current one for this slot. Use a photo relevant to your printing business (e.g. large format prints, 3D prints, banners).
            </DialogDescription>
          </DialogHeader>
          {editingKey && (
            <div className="space-y-3">
              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}
              <FileUploader
                context="ADMIN_SITE_IMAGE"
                accept={["image/jpeg", "image/png", "image/webp"]}
                maxSizeMB={10}
                maxFiles={1}
                hint="JPEG, PNG or WebP · Max 10MB"
                onUploadComplete={(files) => handleUploadComplete(files, editingKey)}
                onUploadError={(err) => setUploadError(err)}
              />
              {saving && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
