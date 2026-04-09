"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUploader, type UploadedFileResult } from "@/components/upload/FileUploader";
import { Loader2, ShoppingCart } from "lucide-react";

interface HistoryEntry {
  id: string;
  jobName: string;
  parts: Array<{
    name: string;
    materialCode: string;
    weightGrams: number;
    printTimeHours: number;
    quantity: number;
    color?: string;
  }>;
  totalSellingPrice: number;
  marginPercent: number;
  isPrinted?: boolean;
}

interface ConvertToProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: HistoryEntry | null;
  isPrinted?: boolean; // Prop to override or set default
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ConvertToProductModal({
  isOpen,
  onClose,
  entry,
  isPrinted: isPrintedProp,
}: ConvertToProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [isPOD, setIsPOD] = useState(true);
  const [isPrinted, setIsPrinted] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entry) {
      setName(entry.jobName);
      setBasePrice(Math.round(entry.totalSellingPrice));
      setIsPrinted(isPrintedProp ?? entry.isPrinted ?? true);
      setIsPOD(isPrintedProp === false ? true : !!entry.isPrinted === false);
      
      // Auto-generate a basic description from parts
      const partsSummary = entry.parts.map(p => 
        `${p.quantity}x ${p.name} (${p.materialCode}${p.color ? ` in ${p.color}` : ""})`
      ).join(", ");
      setShortDescription(`3D printed ${entry.jobName}.`);
      setDescription(`Includes: ${partsSummary}. Printed with high-quality materials.`);
    }
  }, [entry]);

  useEffect(() => {
    if (isOpen) {
      setCategoriesLoading(true);
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          setCategories(data);
          if (data.length > 0 && !categoryId) {
            // Try to find a 3D related category or just pick the first
            const threeD = data.find((c: Category) => c.name.toLowerCase().includes("3d"));
            setCategoryId(threeD?.id || data[0].id);
          }
        })
        .finally(() => setCategoriesLoading(false));
    }
  }, [isOpen, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/products/from-calculation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId,
          basePrice,
          shortDescription,
          description,
          isPOD,
          excludeColor: !isPrinted,
          images,
          calculationData: { ...entry, isPrinted },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Success!
        window.location.href = `/admin/products/${data.productId}`;
      } else {
        setError(data.error || "Failed to create product");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (results: UploadedFileResult[]) => {
    const urls = results.map(r => r.publicUrl).filter(Boolean) as string[];
    setImages(urls);
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Push to Shop Products
          </DialogTitle>
          <DialogDescription>
            Convert this calculation into a listed shop product. Some details are pre-filled from your calculation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Minimalist Planter"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Shop Category</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                required
              >
                {categoriesLoading ? (
                  <option>Loading categories...</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price (KES)</Label>
              <Input
                id="basePrice"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                required
              />
            </div>
            <div className="flex items-end pb-2 gap-2">
              <Checkbox
                id="isPOD"
                checked={isPOD}
                onCheckedChange={(checked) => setIsPOD(!!checked)}
              />
              <Label htmlFor="isPOD" className="cursor-pointer">
                Mark as Print-on-Demand (POD)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary for list views"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product description"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Product Images (Optional)</Label>
            <FileUploader
              context="products/images"
              accept={["image/png", "image/jpeg", "image/webp"]}
              maxFiles={5}
              onUploadComplete={handleUploadComplete}
              hint="Upload photos of the physical print or renders"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || categoriesLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product & Publish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
