"use client";

import { useState, useEffect } from "react";
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
import { CategoryCascadingSelect } from "@/components/admin/CategoryCascadingSelect";
import { Switch } from "@/components/ui/switch";
import type { ProductRow } from "@/components/admin/products-admin-client";
import { ProductImagesTab } from "@/components/admin/product-images-tab";
import { SmartTextEditor } from "@/components/admin/smart-text-editor";

type ProductType = "READYMADE_3D" | "LARGE_FORMAT" | "CUSTOM" | "PRINT_ON_DEMAND" | "SERVICE";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductRow | null;
  categories: { id: string; name: string; slug: string }[];
  onSuccess: () => void;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: ProductFormSheetProps) {
  // AUDIT FIX: Treat product.id === 'new' as duplicate (create) mode so form POSTs instead of PATCH
  const isEdit = !!product && product.id !== "new";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "images" | "seo">("details");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState<ProductType>("READYMADE_3D");
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imagesStr, setImagesStr] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.id === "new" ? `${product.name} (Copy)` : product.name);
      setSlug(product.id === "new" ? `${product.slug}-copy` : product.slug);
      setDescription(product.description ?? "");
      setShortDescription("");
      setCategoryId(product.categoryId);
      setProductType(product.productType);
      setBasePrice(String(product.basePrice));
      setComparePrice(product.comparePrice != null ? String(product.comparePrice) : "");
      setStock(String(product.stock));
      setIsActive(product.isActive);
      setIsFeatured(product.isFeatured ?? false);
      setImagesStr(Array.isArray(product.images) ? product.images.join("\n") : "");
      setMetaTitle("");
      setMetaDescription("");
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setShortDescription("");
      setCategoryId(categories[0]?.id ?? "");
      setProductType("READYMADE_3D");
      setBasePrice("");
      setComparePrice("");
      setStock("0");
      setIsActive(true);
      setIsFeatured(false);
      setImagesStr("");
      setMetaTitle("");
      setMetaDescription("");
    }
  }, [product, categories]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEdit) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const images = isEdit ? undefined : (imagesStr.trim() ? imagesStr.split(/\n/).map((s) => s.trim()).filter(Boolean) : []);
    const payload: Record<string, unknown> = {
      name,
      slug: slug || undefined,
      description: description || undefined,
      shortDescription: shortDescription || undefined,
      categoryId: categoryId || categories[0]?.id,
      productType,
      basePrice: parseFloat(basePrice) || 0,
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      // SKU is auto-generated on create; omit so API generates it
      ...(isEdit && product && product.id !== "new" && (product as { sku?: string }).sku && { sku: (product as { sku: string }).sku }),
      stock: parseInt(stock, 10) || 0,
      minOrderQty: 1,
      isActive,
      isFeatured,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      ...(images != null && { images }),
    };
    try {
      if (isEdit && product && product.id !== "new") {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Update failed");
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.slug?.[0] ?? data.error ?? "Create failed");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "details" as const, label: "Details" },
    { id: "pricing" as const, label: "Pricing" },
    { id: "images" as const, label: "Images" },
    { id: "seo" as const, label: "SEO" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[600px] overflow-y-auto bg-white border-[#E5E7EB]"
      >
        <SheetHeader>
          <SheetTitle className="text-[#111]">
            {isEdit ? "Edit product" : "Add product"}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex border-b border-[#E5E7EB] gap-1 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-[#6B7280] hover:text-[#111]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 py-6 overflow-y-auto">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4">
                {error}
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="productType">Product Type *</Label>
                  <select
                    id="productType"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as ProductType)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="READYMADE_3D">Ready-made 3D</option>
                    <option value="LARGE_FORMAT">Large Format</option>
                    <option value="CUSTOM">3D Service</option>
                    <option value="PRINT_ON_DEMAND">Print-On-Demand</option>
                    <option value="SERVICE">Other Service</option>
                  </select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <CategoryCascadingSelect
                    categories={categories}
                    value={categoryId}
                    onChange={(val) => setCategoryId(val || "")}
                  />
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
                <div>
                  <Label htmlFor="description">Description</Label>
                  <div className="mt-1">
                    <SmartTextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Detailed product description (HTML/Rich Text)"
                      minHeight="200px"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shortDescription">Short description (150 chars)</Label>
                  <Input
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    maxLength={150}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    <span className="text-sm">Featured</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="basePrice">Base Price (KES) *</Label>
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
                  <Label htmlFor="comparePrice">Compare-at price (KES)</Label>
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
            )}

            {activeTab === "images" && (
              <ProductImagesTab
                productId={isEdit && product && product.id !== "new" ? product.id : ""}
                initialImages={(Array.isArray(product?.images) ? product.images : []).map((url, i) => ({
                  url,
                  isMain: i === 0,
                  sortOrder: i,
                  source: "url" as const,
                }))}
                onSave={() => {}}
              />
            )}

            {activeTab === "seo" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta title ({metaTitle.length}/60)</Label>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={60}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta description ({metaDescription.length}/160)</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={160}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="border-t border-[#E5E7EB] pt-4 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? "Saving…" : "Save Product"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
