"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CategoryImageField } from "@/components/admin/category-image-field";

export type CategoryForForm = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  parent?: { id: string; name: string; slug: string } | null;
};

type CategoryFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryForForm | null;
  parentOptions: { id: string; name: string; slug: string; parentId: string | null }[];
};

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  category,
  parentOptions,
}: CategoryFormSheetProps) {
  const router = useRouter();
  const isEdit = !!category;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | "">("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description ?? "");
      setParentId(category.parentId ?? "");
      setSortOrder(category.sortOrder);
      setIsActive(category.isActive);
      setImage(category.image ?? "");
      setMetaTitle(category.metaTitle ?? "");
      setMetaDescription(category.metaDescription ?? "");
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setParentId("");
      setSortOrder(0);
      setIsActive(true);
      setImage("");
      setMetaTitle("");
      setMetaDescription("");
    }
  }, [category, open]);

  const handleNameBlur = () => {
    if (!isEdit) setSlug((s) => (s === slugFromName(name) || !s ? slugFromName(name) : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        image: image || null,
        sortOrder,
        isActive,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      };
      if (isEdit && category) {
        const res = await fetch(`/api/admin/categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
          return;
        }
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
          return;
        }
      }
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const topLevelParents = parentOptions.filter((p) => !p.parentId && (!category || p.id !== category.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit category" : "Add category"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              required
              placeholder="e.g. Large Format Printing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug *</Label>
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="e.g. large-format"
            />
            <p className="text-xs text-muted-foreground">
              Used in URL: printhub.africa/shop/[slug]
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-parent">Parent category</Label>
            <select
              id="cat-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">None (top level)</option>
              {topLevelParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short description for the shop card"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-sort">Sort order</Label>
              <Input
                id="cat-sort"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              />
              <p className="text-xs text-muted-foreground">Lower = appears first</p>
            </div>
            <div className="flex flex-1 items-end gap-2 pb-2">
              <Switch
                id="cat-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="cat-active" className="cursor-pointer">
                Active (visible on shop)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <CategoryImageField
              categoryId={category?.id}
              currentImageUrl={image || null}
              onChange={(url) => setImage(url ?? "")}
            />
            <p className="text-xs text-muted-foreground">
              Shown on shop page cards. Recommended: 800×600px or 1200×630px. Upload or paste URL.
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">SEO (optional)</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="cat-meta-title">Meta title</Label>
                <Input
                  id="cat-meta-title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value.slice(0, 60))}
                  maxLength={60}
                  placeholder="Category name | PrintHub Kenya"
                />
                <p className="text-xs text-muted-foreground">{metaTitle.length}/60</p>
              </div>
              <div>
                <Label htmlFor="cat-meta-desc">Meta description</Label>
                <Textarea
                  id="cat-meta-desc"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                  maxLength={160}
                  rows={2}
                  placeholder="Leave blank to auto-generate from name + description"
                />
                <p className="text-xs text-muted-foreground">{metaDescription.length}/160</p>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save category" : "Add category"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
