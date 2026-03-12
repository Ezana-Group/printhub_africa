"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProductImagesTab } from "@/components/admin/product-images-tab";

type ProductType = "READYMADE_3D" | "LARGE_FORMAT" | "CUSTOM";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    categoryId: string;
    productType: ProductType;
    basePrice: number;
    comparePrice: number | null;
    sku: string | null;
    stock: number;
    minOrderQty: number;
    maxOrderQty: number | null;
    images: string[];
    materials: string[];
    colors: string[];
    isActive: boolean;
    isFeatured: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
  };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [description, setDescription] = useState(product?.description ?? "");
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [productType, setProductType] = useState<ProductType>(product?.productType ?? "READYMADE_3D");
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? 0));
  const [comparePrice, setComparePrice] = useState(product?.comparePrice != null ? String(product.comparePrice) : "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [minOrderQty, setMinOrderQty] = useState(String(product?.minOrderQty ?? 1));
  const [maxOrderQty, setMaxOrderQty] = useState(product?.maxOrderQty != null ? String(product.maxOrderQty) : "");
  const [imagesStr, setImagesStr] = useState((product?.images ?? []).join("\n"));
  const [materialsStr, setMaterialsStr] = useState((product?.materials ?? []).join(", "));
  const [colorsStr, setColorsStr] = useState((product?.colors ?? []).join(", "));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [metaTitle, setMetaTitle] = useState(product?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "");

  const handleNameChange = (v: string) => {
    setName(v);
    if (autoSlug) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const images = isEdit ? undefined : (imagesStr.trim() ? imagesStr.split(/\n/).map((s) => s.trim()).filter(Boolean) : []);
    const materials = materialsStr.trim() ? materialsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const colors = colorsStr.trim() ? colorsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const payload: Record<string, unknown> = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      shortDescription: shortDescription || undefined,
      categoryId,
      productType,
      basePrice: parseFloat(basePrice) || 0,
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      stock: parseInt(stock, 10) || 0,
      minOrderQty: parseInt(minOrderQty, 10) || 1,
      maxOrderQty: maxOrderQty ? parseInt(maxOrderQty, 10) : undefined,
      materials,
      colors,
      isActive,
      isFeatured,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      ...(images != null && { images }),
    };
    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Update failed");
        router.push("/admin/products");
        router.refresh();
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Create failed");
        router.push("/admin/products");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Basic info</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-from-name"
              />
              {!isEdit && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSlug}
                    onChange={(e) => setAutoSlug(e.target.checked)}
                  />
                  Auto
                </label>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="shortDescription">Short description</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="productType">Product type</Label>
              <select
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="READYMADE_3D">Ready-made 3D</option>
                <option value="LARGE_FORMAT">Large format</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="stock">Quantity (stock)</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Pricing</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="basePrice">Base price (KES) *</Label>
              <Input
                id="basePrice"
                type="number"
                min={0}
                step={0.01}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="comparePrice">Compare at price (KES)</Label>
              <Input
                id="comparePrice"
                type="number"
                min={0}
                step={0.01}
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrderQty">Min order qty</Label>
              <Input
                id="minOrderQty"
                type="number"
                min={1}
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxOrderQty">Max order qty</Label>
              <Input
                id="maxOrderQty"
                type="number"
                min={1}
                value={maxOrderQty}
                onChange={(e) => setMaxOrderQty(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Media & attributes</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEdit && product?.id ? (
            <ProductImagesTab
              productId={product.id}
              initialImages={(product.images ?? []).map((url, i) => ({
                url,
                isMain: i === 0,
                sortOrder: i,
                source: "url" as const,
              }))}
            />
          ) : (
            <>
              <div>
                <Label className="mb-1 block">Upload images</Label>
                <p className="text-xs text-muted-foreground mb-2">JPEG, PNG, WebP · Max 8 · First = featured</p>
                <FileUploader
                  context="ADMIN_PRODUCT_IMAGE"
                  accept={["image/jpeg", "image/png", "image/webp"]}
                  maxSizeMB={20}
                  maxFiles={8}
                  hint="Uploaded images will be added below. You can also paste URLs."
                  onUploadComplete={(files) => {
                    const base = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_R2_PUBLIC_URL : "";
                    const urls = files.map((f) => f.publicUrl ?? (base && f.storageKey ? `${base}/${f.storageKey}` : f.storageKey));
                    setImagesStr((prev) => (prev ? `${prev}\n${urls.join("\n")}` : urls.join("\n")));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="images">Image URLs (one per line)</Label>
                <Textarea
                  id="images"
                  value={imagesStr}
                  onChange={(e) => setImagesStr(e.target.value)}
                  rows={3}
                  placeholder="https://... or upload above"
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">First URL = featured. Max 8. JPG/PNG/WEBP.</p>
              </div>
            </>
          )}
          <div>
            <Label htmlFor="materials">Materials (comma-separated)</Label>
            <Input
              id="materials"
              value={materialsStr}
              onChange={(e) => setMaterialsStr(e.target.value)}
              placeholder="PLA, Resin"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="colors">Colors (comma-separated)</Label>
            <Input
              id="colors"
              value={colorsStr}
              onChange={(e) => setColorsStr(e.target.value)}
              placeholder="White, Black"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Status & SEO</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured
            </label>
          </div>
          <div>
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="metaDescription">Meta description</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update product" : "Create product"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
