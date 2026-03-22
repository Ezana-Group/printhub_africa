"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { toast } from "sonner";

export type AuthPanelConfigState = {
  backgroundColor: string;
  backgroundImagePath: string | null;
  carouselIntervalSeconds: number;
  updatedAt: string | null;
};

export type AuthPanelSlideState = {
  id: string;
  sortOrder: number;
  subtitle: string | null;
  headline: string | null;
  body: string | null;
  imagePath: string | null;
  updatedAt: string;
};

type AuthPanelClientProps = {
  initialConfig: AuthPanelConfigState;
  initialSlides: AuthPanelSlideState[];
};

export function AuthPanelClient({
  initialConfig,
  initialSlides,
}: AuthPanelClientProps) {
  const router = useRouter();
  const [config, setConfig] = useState<AuthPanelConfigState>(initialConfig);
  const [slides, setSlides] = useState<AuthPanelSlideState[]>(initialSlides);
  const [configSaving, setConfigSaving] = useState(false);
  const [slideSaving, setSlideSaving] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<AuthPanelSlideState | null>(null);
  const [newSlideOpen, setNewSlideOpen] = useState(false);
  const [newSlide, setNewSlide] = useState({
    subtitle: "",
    headline: "",
    body: "",
    imagePath: "",
  });

  const [uploading, setUploading] = useState<string | null>(null);

  const fetchPanel = useCallback(async () => {
    const res = await fetch("/api/admin/content/auth-panel");
    if (!res.ok) return;
    const data = await res.json();
    if (data.config) setConfig(data.config);
    if (Array.isArray(data.slides)) setSlides(data.slides);
  }, []);

  useEffect(() => {
    fetchPanel();
  }, [fetchPanel]);

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await fetch("/api/admin/content/auth-panel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundColor: config.backgroundColor || "#E84A0C",
          backgroundImagePath: config.backgroundImagePath?.trim() || null,
          carouselIntervalSeconds: config.carouselIntervalSeconds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig((c) => ({
          ...c,
          backgroundColor: data.backgroundColor ?? c.backgroundColor,
          backgroundImagePath: data.backgroundImagePath ?? c.backgroundImagePath,
          carouselIntervalSeconds: data.carouselIntervalSeconds ?? c.carouselIntervalSeconds,
          updatedAt: data.updatedAt ?? c.updatedAt,
        }));
        router.refresh();
      }
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveSlide = async (slide: AuthPanelSlideState) => {
    setSlideSaving(slide.id);
    try {
      const res = await fetch(`/api/admin/content/auth-panel/slides/${slide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtitle: slide.subtitle || null,
          headline: slide.headline || null,
          body: slide.body || null,
          imagePath: slide.imagePath || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, ...data } : s))
        );
        setEditingSlide(null);
        router.refresh();
      }
    } finally {
      setSlideSaving(null);
    }
  };

  const handleAddSlide = async () => {
    setSlideSaving("new");
    try {
      const res = await fetch("/api/admin/content/auth-panel/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtitle: newSlide.subtitle.trim() || null,
          headline: newSlide.headline.trim() || null,
          body: newSlide.body.trim() || null,
          imagePath: newSlide.imagePath.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSlides((prev) => [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder));
        setNewSlideOpen(false);
        setNewSlide({ subtitle: "", headline: "", body: "", imagePath: "" });
        router.refresh();
      }
    } finally {
      setSlideSaving(null);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    const res = await fetch(`/api/admin/content/auth-panel/slides/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSlides((prev) => prev.filter((s) => s.id !== id));
      setEditingSlide(null);
      router.refresh();
    }
  };

  const handleImageUpload = async (file: File, isNew: boolean, slideId?: string) => {
    if (!file) return;
    const target = isNew ? "new" : slideId || "edit";
    setUploading(target);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/content/auth-panel/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (isNew) {
        setNewSlide((s) => ({ ...s, imagePath: data.url }));
      } else {
        setEditingSlide((s) => (s ? { ...s, imagePath: data.url } : s));
      }
      toast.success("Image uploaded successfully");
    } catch (e) {
      toast.error("Failed to upload image");
      console.error(e);
    } finally {
      setUploading(null);
    }
  };

  const moveSlide = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const reordered = [...slides];
    const a = reordered[index];
    const b = reordered[newIndex];
    reordered[index] = { ...b, sortOrder: a.sortOrder };
    reordered[newIndex] = { ...a, sortOrder: b.sortOrder };
    setSlides(reordered.sort((x, y) => x.sortOrder - y.sortOrder));
    // Persist: update both slides
    await Promise.all([
      fetch(`/api/admin/content/auth-panel/slides/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: b.sortOrder }),
      }),
      fetch(`/api/admin/content/auth-panel/slides/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: a.sortOrder }),
      }),
    ]);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Panel appearance</CardTitle>
          <CardDescription>
            Background and carousel timing for the left side of the login and register pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background colour</Label>
              <div className="flex gap-2">
                <input
                  id="backgroundColor"
                  type="color"
                  value={config.backgroundColor || "#E84A0C"}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, backgroundColor: e.target.value }))
                  }
                  className="h-10 w-14 rounded border border-input cursor-pointer"
                />
                <Input
                  value={config.backgroundColor || ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, backgroundColor: e.target.value }))
                  }
                  placeholder="#E84A0C"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundImagePath">Background image URL (optional)</Label>
              <Input
                id="backgroundImagePath"
                value={config.backgroundImagePath ?? ""}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, backgroundImagePath: e.target.value || null }))
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="carouselIntervalSeconds">Carousel auto-advance (seconds)</Label>
            <Input
              id="carouselIntervalSeconds"
              type="number"
              min={0}
              max={60}
              value={config.carouselIntervalSeconds}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  carouselIntervalSeconds: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Set to 0 to disable auto-advance (manual only via dots).
            </p>
          </div>
          <Button onClick={handleSaveConfig} disabled={configSaving}>
            {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save appearance"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Slides</CardTitle>
              <CardDescription>
                Each slide can show a subtitle, headline, body text, and optional image. Order determines display order.
              </CardDescription>
            </div>
            <Button onClick={() => setNewSlideOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add slide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {slides.map((slide, index) => (
              <li
                key={slide.id}
                className="flex items-center gap-4 rounded-lg border p-4 bg-muted/30"
              >
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveSlide(index, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveSlide(index, "down")}
                    disabled={index === slides.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {slide.headline || slide.subtitle || "(Untitled slide)"}
                  </p>
                  {slide.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditingSlide({ ...slide })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {slides.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              No slides yet. Add one to show content on the login panel. If there are no slides, a default message is shown.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit slide dialog */}
      <Dialog open={!!editingSlide} onOpenChange={(open) => !open && setEditingSlide(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit slide</DialogTitle>
          </DialogHeader>
          {editingSlide && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subtitle (small uppercase line)</Label>
                <Input
                  value={editingSlide.subtitle ?? ""}
                  onChange={(e) =>
                    setEditingSlide((s) => (s ? { ...s, subtitle: e.target.value } : s))
                  }
                  placeholder="e.g. PRINTHUB FOR TEAMS & CREATORS"
                />
              </div>
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={editingSlide.headline ?? ""}
                  onChange={(e) =>
                    setEditingSlide((s) => (s ? { ...s, headline: e.target.value } : s))
                  }
                  placeholder="e.g. Print experiences that get noticed."
                />
              </div>
              <div className="space-y-2">
                <Label>Body text</Label>
                <Input
                  value={editingSlide.body ?? ""}
                  onChange={(e) =>
                    setEditingSlide((s) => (s ? { ...s, body: e.target.value } : s))
                  }
                  placeholder="Short paragraph"
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={editingSlide.imagePath ?? ""}
                    onChange={(e) =>
                      setEditingSlide((s) => (s ? { ...s, imagePath: e.target.value } : s))
                    }
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="edit-slide-image"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, false, editingSlide.id);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      asChild
                      disabled={uploading === editingSlide.id}
                    >
                      <label htmlFor="edit-slide-image" className="cursor-pointer">
                        {uploading === editingSlide.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </label>
                    </Button>
                  </div>
                </div>
                {editingSlide.imagePath && (
                   <div className="mt-2 relative aspect-video w-full rounded border overflow-hidden bg-slate-100">
                     <img src={editingSlide.imagePath} alt="Preview" className="object-cover w-full h-full" />
                   </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlide(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingSlide && handleSaveSlide(editingSlide)}
              disabled={!editingSlide || slideSaving === editingSlide?.id}
            >
              {slideSaving === editingSlide?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New slide dialog */}
      <Dialog open={newSlideOpen} onOpenChange={setNewSlideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add slide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subtitle (small uppercase line)</Label>
              <Input
                value={newSlide.subtitle}
                onChange={(e) => setNewSlide((s) => ({ ...s, subtitle: e.target.value }))}
                placeholder="e.g. PRINTHUB FOR TEAMS & CREATORS"
              />
            </div>
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={newSlide.headline}
                onChange={(e) => setNewSlide((s) => ({ ...s, headline: e.target.value }))}
                placeholder="e.g. Print experiences that get noticed."
              />
            </div>
            <div className="space-y-2">
              <Label>Body text</Label>
              <Input
                value={newSlide.body}
                onChange={(e) => setNewSlide((s) => ({ ...s, body: e.target.value }))}
                placeholder="Short paragraph"
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={newSlide.imagePath}
                  onChange={(e) => setNewSlide((s) => ({ ...s, imagePath: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1"
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="new-slide-image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, true);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                    disabled={uploading === "new"}
                  >
                    <label htmlFor="new-slide-image" className="cursor-pointer">
                      {uploading === "new" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </label>
                  </Button>
                </div>
              </div>
              {newSlide.imagePath && (
                 <div className="mt-2 relative aspect-video w-full rounded border overflow-hidden bg-slate-100">
                   <img src={newSlide.imagePath} alt="Preview" className="object-cover w-full h-full" />
                 </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSlideOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlide} disabled={slideSaving === "new"}>
              {slideSaving === "new" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add slide"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
