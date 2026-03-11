"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  Camera,
  Upload,
  FileBox,
  Trash2,
  Star,
  Loader2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, type SelectOption } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Photo {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Material {
  id?: string;
  materialCode: string;
  materialName: string;
  availableColours: string[];
  priceModifierKes: number;
  isDefault: boolean;
  isAvailable: boolean;
}

interface CatalogueItemFull {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  tags: string[];
  designerId: string | null;
  designer: { id: string; name: string } | null;
  sourceUrl: string | null;
  licenseType: string;
  designerCredit: string | null;
  sourceType: string;
  stlFileUrl: string | null;
  stlFileName: string | null;
  stlFileSizeBytes: number | null;
  weightGrams: number | null;
  printTimeHours: number | null;
  supportsRequired: boolean;
  printDifficulty: string;
  buildVolumeX: number | null;
  buildVolumeY: number | null;
  buildVolumeZ: number | null;
  basePriceKes: number | null;
  priceOverrideKes: number | null;
  minQuantity: number;
  maxQuantity: number;
  status: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isStaffPick: boolean;
  isPopular: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  internalNotes: string | null;
  approvedAt: string | null;
  photos: Photo[];
  availableMaterials: Material[];
}

interface CatalogueItemFormFullProps {
  item: CatalogueItemFull;
  categories: Category[];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const LICENSE_OPTIONS: SelectOption[] = [
  { value: "CC0", label: "CC0 — Public Domain" },
  { value: "CC_BY", label: "CC BY" },
  { value: "CC_BY_SA", label: "CC BY-SA" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "ORIGINAL", label: "PrintHub Original" },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: "MANUAL", label: "Manual upload" },
  { value: "PRINTABLES", label: "Printables" },
  { value: "THINGIVERSE", label: "Thingiverse" },
  { value: "PARTNER", label: "Partner" },
  { value: "ORIGINAL", label: "PrintHub Original" },
];

const DIFFICULTY_OPTIONS: SelectOption[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "MODERATE", label: "Moderate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function CatalogueItemFormFull({ item, categories }: CatalogueItemFormFullProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(item.name);
  const [slug, setSlug] = useState(item.slug);
  const [shortDescription, setShortDescription] = useState(item.shortDescription ?? "");
  const [description, setDescription] = useState(item.description);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [tags, setTags] = useState<string[]>(item.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [licenseType, setLicenseType] = useState(item.licenseType);
  const [sourceType, setSourceType] = useState(item.sourceType ?? "MANUAL");
  const [designerCredit, setDesignerCredit] = useState(item.designerCredit ?? "");
  const [sourceUrl, setSourceUrl] = useState(item.sourceUrl ?? "");
  const [basePriceKes, setBasePriceKes] = useState<string>(
    item.basePriceKes != null ? String(item.basePriceKes) : ""
  );
  const [priceOverrideKes, setPriceOverrideKes] = useState<string>(
    item.priceOverrideKes != null ? String(item.priceOverrideKes) : ""
  );
  const [minQuantity, setMinQuantity] = useState(String(item.minQuantity));
  const [maxQuantity, setMaxQuantity] = useState(String(item.maxQuantity));
  const [weightGrams, setWeightGrams] = useState<string>(
    item.weightGrams != null ? String(item.weightGrams) : ""
  );
  const [printTimeHours, setPrintTimeHours] = useState<string>(
    item.printTimeHours != null ? String(item.printTimeHours) : ""
  );
  const [supportsRequired, setSupportsRequired] = useState(item.supportsRequired);
  const [printDifficulty, setPrintDifficulty] = useState(item.printDifficulty ?? "STANDARD");
  const [buildVolumeX, setBuildVolumeX] = useState(item.buildVolumeX != null ? String(item.buildVolumeX) : "");
  const [buildVolumeY, setBuildVolumeY] = useState(item.buildVolumeY != null ? String(item.buildVolumeY) : "");
  const [buildVolumeZ, setBuildVolumeZ] = useState(item.buildVolumeZ != null ? String(item.buildVolumeZ) : "");
  const [internalNotes, setInternalNotes] = useState(item.internalNotes ?? "");
  const [isFeatured, setIsFeatured] = useState(item.isFeatured);
  const [isNewArrival, setIsNewArrival] = useState(item.isNewArrival);
  const [isStaffPick, setIsStaffPick] = useState(item.isStaffPick);
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [metaTitle, setMetaTitle] = useState(item.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(item.metaDescription ?? "");

  const [photos, setPhotos] = useState<Photo[]>(item.photos ?? []);
  const [stlFileName, setStlFileName] = useState(item.stlFileName ?? null);
  const [stlFileSizeBytes, setStlFileSizeBytes] = useState(item.stlFileSizeBytes ?? null);
  const [priceCalc, setPriceCalc] = useState<{
    breakdown: Record<string, number>;
    suggestedPriceRounded: number;
    materialUsed: string;
  } | null>(null);
  const [priceCalcLoading, setPriceCalcLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [stlUploading, setStlUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const stlInputRef = useRef<HTMLInputElement>(null);

  const updateSlugFromName = () => {
    if (!slug || slug === item.slug) setSlug(slugify(name));
  };

  const categoryOptions: SelectOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const checklist = [
    { label: "Name & description", done: !!name.trim() && !!description.trim() },
    { label: "Category set", done: !!categoryId },
    { label: "License set", done: !!licenseType },
    { label: "At least 1 material", done: (item.availableMaterials?.length ?? 0) > 0 },
    { label: "Price set", done: basePriceKes !== "" && !Number.isNaN(Number(basePriceKes)) },
    { label: "At least 1 photo", done: photos.length > 0 },
    { label: "STL file uploaded", done: !!(stlFileName ?? item.stlFileName ?? null) },
    { label: "Print specs filled", done: !!(weightGrams && printTimeHours) },
  ];
  const completedCount = checklist.filter((c) => c.done).length;
  const allComplete = completedCount === 8;
  const isReadyForReview = allComplete;

  const buildPayload = () => ({
    name: name.trim(),
    slug: slug.trim() || slugify(name),
    shortDescription: shortDescription.trim() || null,
    description: description.trim(),
    categoryId,
    tags,
    licenseType,
    sourceType,
    designerCredit: designerCredit.trim() || null,
    sourceUrl: sourceUrl.trim() || null,
    basePriceKes: basePriceKes === "" ? null : Number(basePriceKes),
    priceOverrideKes: priceOverrideKes === "" ? null : Number(priceOverrideKes),
    minQuantity: Math.max(1, parseInt(minQuantity, 10) || 1),
    maxQuantity: Math.max(1, parseInt(maxQuantity, 10) || 50),
    weightGrams: weightGrams === "" ? null : Number(weightGrams),
    printTimeHours: printTimeHours === "" ? null : Number(printTimeHours),
    supportsRequired,
    printDifficulty,
    buildVolumeX: buildVolumeX === "" ? null : Number(buildVolumeX),
    buildVolumeY: buildVolumeY === "" ? null : Number(buildVolumeY),
    buildVolumeZ: buildVolumeZ === "" ? null : Number(buildVolumeZ),
    internalNotes: internalNotes.trim() || null,
    isFeatured,
    isNewArrival,
    isStaffPick,
    sortOrder: parseInt(sortOrder, 10) || 0,
    metaTitle: metaTitle.trim() || null,
    metaDescription: metaDescription.trim() || null,
  });

  const saveForm = async (newStatus?: string) => {
    setError(null);
    setSaving(true);
    try {
      const payload = buildPayload();
      if (newStatus) {
        await fetch(`/api/admin/catalogue/${item.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      }
      const res = await fetch(`/api/admin/catalogue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message ?? data?.error ?? "Failed to save");
        return;
      }
      if (newStatus === "PENDING_REVIEW") {
        router.push("/admin/catalogue/queue");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/catalogue/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append("file", files[i]);
      const res = await fetch(`/api/admin/catalogue/${item.id}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.photos?.length) {
        const newPhotos = data.photos.map((p: { id: string; url: string; isPrimary: boolean; sortOrder: number }) => ({
          id: p.id,
          url: p.url,
          altText: null,
          isPrimary: p.isPrimary,
          sortOrder: p.sortOrder,
        }));
        setPhotos((prev) => [...prev, ...newPhotos].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    const res = await fetch(`/api/admin/catalogue/${item.id}/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrimary: true }),
    });
    if (res.ok) {
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, isPrimary: p.id === photoId }))
      );
    }
  };

  const deletePhoto = async (photoId: string) => {
    const res = await fetch(`/api/admin/catalogue/${item.id}/photos/${photoId}`, {
      method: "DELETE",
    });
    if (res.ok) setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleStlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStlUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/catalogue/${item.id}/stl`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStlFileName(data.stlFileName ?? file.name);
        setStlFileSizeBytes(data.stlFileSizeBytes ?? file.size);
      }
    } finally {
      setStlUploading(false);
      e.target.value = "";
    }
  };

  const deleteStl = async () => {
    const res = await fetch(`/api/admin/catalogue/${item.id}/stl`, {
      method: "DELETE",
    });
    if (res.ok) {
      setStlFileName(null);
      setStlFileSizeBytes(null);
    }
  };

  const handleCalculatePrice = async () => {
    setPriceCalcLoading(true);
    setPriceCalc(null);
    try {
      const res = await fetch(`/api/admin/catalogue/${item.id}/calculate-price`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) setPriceCalc(data);
      else setError(data.error ?? "Could not calculate price.");
    } catch {
      setError("Could not calculate price.");
    } finally {
      setPriceCalcLoading(false);
    }
  };

  const applySuggestedPrice = () => {
    if (priceCalc?.suggestedPriceRounded != null) {
      setBasePriceKes(String(priceCalc.suggestedPriceRounded));
      setPriceCalc(null);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString() : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      {/* Left: Form */}
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Section 1: Basic details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Item name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={updateSlugFromName}
                placeholder="e.g. Honeycomb Lamp Shade"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="honeycomb-lamp-shade"
                className="mt-1 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">/catalogue/{slug || "…"}</p>
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={categoryOptions}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tags (press Enter to add)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                  >
                    {t} ×
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag"
                  className="w-24 inline-flex"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>
            <div>
              <Label>Short description (150 chars, for card) *</Label>
              <Input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={150}
                className="mt-1"
              />
              <p className="text-xs text-gray-500">{shortDescription.length}/150</p>
            </div>
            <div>
              <Label>Full description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Designer & License */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Designer & license</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Source type</Label>
              <Select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                options={SOURCE_OPTIONS}
                className="mt-1"
              />
            </div>
            <div>
              <Label>License *</Label>
              <Select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                options={LICENSE_OPTIONS}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Designer credit (public)</Label>
              <Input
                value={designerCredit}
                onChange={(e) => setDesignerCredit(e.target.value)}
                placeholder='e.g. Designed by @user on Printables'
                className="mt-1"
              />
            </div>
            <div>
              <Label>Source URL</Label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://printables.com/..."
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mb-2"
                onClick={handleCalculatePrice}
                disabled={priceCalcLoading || !weightGrams || !printTimeHours}
              >
                {priceCalcLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4 mr-2" />
                )}
                Calculate suggested price
              </Button>
              {priceCalc && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                  <p className="font-medium text-gray-800">Price breakdown</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-gray-600">Material cost:</span>
                    <span>KSh {priceCalc.breakdown.materialCost?.toLocaleString()}</span>
                    <span className="text-gray-600">Machine time:</span>
                    <span>KSh {(priceCalc.breakdown.electricityCost ?? 0) + (priceCalc.breakdown.depreciationCost ?? 0) + (priceCalc.breakdown.maintenanceCost ?? 0)}</span>
                    <span className="text-gray-600">Labour:</span>
                    <span>KSh {priceCalc.breakdown.laborCost?.toLocaleString()}</span>
                    <span className="text-gray-600">Overhead:</span>
                    <span>KSh {priceCalc.breakdown.overheadCost?.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Suggested price (rounded):</span>
                    <span className="font-semibold">KSh {priceCalc.suggestedPriceRounded?.toLocaleString()}</span>
                  </div>
                  <Button type="button" size="sm" className="w-full mt-2 bg-[#FF4D00] hover:bg-[#e64400] text-white" onClick={applySuggestedPrice}>
                    Use this price: KSh {priceCalc.suggestedPriceRounded?.toLocaleString()}
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>Base price (KSh) *</Label>
              <Input
                type="number"
                min={0}
                value={basePriceKes}
                onChange={(e) => setBasePriceKes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Override price (KSh) — optional</Label>
              <Input
                type="number"
                min={0}
                value={priceOverrideKes}
                onChange={(e) => setPriceOverrideKes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Max quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Print specs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Print specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Est. weight (grams) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Est. print time (hours) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={printTimeHours}
                  onChange={(e) => setPrintTimeHours(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="supports"
                checked={supportsRequired}
                onCheckedChange={setSupportsRequired}
              />
              <Label htmlFor="supports">Supports required</Label>
            </div>
            <div>
              <Label>Print difficulty</Label>
              <Select
                value={printDifficulty}
                onChange={(e) => setPrintDifficulty(e.target.value)}
                options={DIFFICULTY_OPTIONS}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>X (mm)</Label>
                <Input
                  type="number"
                  value={buildVolumeX}
                  onChange={(e) => setBuildVolumeX(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Y (mm)</Label>
                <Input
                  type="number"
                  value={buildVolumeY}
                  onChange={(e) => setBuildVolumeY(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Z (mm)</Label>
                <Input
                  type="number"
                  value={buildVolumeZ}
                  onChange={(e) => setBuildVolumeZ(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Internal notes (staff only)</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Display & SEO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Display & SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label htmlFor="featured">Featured on homepage</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="new" checked={isNewArrival} onCheckedChange={setIsNewArrival} />
                <Label htmlFor="new">Mark as New Arrival</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="staff" checked={isStaffPick} onCheckedChange={setIsStaffPick} />
                <Label htmlFor="staff">Staff Pick</Label>
              </div>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1 w-24"
              />
            </div>
            <div>
              <Label>Meta title</Label>
              <Input
                value={metaTitle || name}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={60}
                className="mt-1"
              />
              <p className="text-xs text-gray-500">{(metaTitle || name).length}/60</p>
            </div>
            <div>
              <Label>Meta description</Label>
              <Textarea
                value={metaDescription || shortDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={160}
                rows={2}
                className="mt-1"
              />
              <p className="text-xs text-gray-500">{(metaDescription || shortDescription).length}/160</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => saveForm()} disabled={saving} variant="outline">
            Save changes
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/catalogue">Cancel</Link>
          </Button>
        </div>
      </div>

      {/* Right: Status + Photos + STL + Checklist */}
      <div className="space-y-4 lg:sticky lg:top-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current</span>
              <Badge
                className={
                  item.status === "LIVE"
                    ? "bg-green-100 text-green-800"
                    : item.status === "PENDING_REVIEW"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-700"
                }
              >
                {item.status.replace("_", " ")}
              </Badge>
            </div>
            {item.status === "DRAFT" && (
              <>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => saveForm()}
                  disabled={saving}
                >
                  Save as Draft
                </Button>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => saveForm("PENDING_REVIEW")}
                  disabled={saving || !isReadyForReview}
                >
                  Submit for Review
                </Button>
                {!isReadyForReview && (
                  <p className="text-xs text-amber-600">
                    Complete all 8 checklist items below to submit for review.
                  </p>
                )}
              </>
            )}
            {item.status === "PENDING_REVIEW" && (
              <>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateStatus("LIVE")}
                  disabled={saving}
                >
                  Approve — Set Live
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus("DRAFT")}
                  disabled={saving}
                >
                  Return to Draft
                </Button>
              </>
            )}
            {item.status === "LIVE" && (
              <>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Live {item.approvedAt ? `since ${formatDate(item.approvedAt)}` : ""}
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/catalogue/${item.slug}`, "_blank")}
                >
                  View on site
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus("PAUSED")}
                  disabled={saving}
                >
                  Pause item
                </Button>
              </>
            )}
            {item.status === "PAUSED" && (
              <Button
                className="w-full bg-green-600 text-white"
                onClick={() => updateStatus("LIVE")}
                disabled={saving}
              >
                Unpause — Set Live
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Photos
              <span className="text-sm font-normal text-gray-500">{photos.length}/5</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No photos yet</p>
                <p className="text-xs text-amber-600 mt-1">Required before going live</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded overflow-hidden bg-gray-100 group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.altText ?? ""}
                      className="w-full h-full object-cover"
                    />
                    {photo.isPrimary && (
                      <div className="absolute top-1 left-1 bg-[#FF4D00] text-white text-[10px] px-1 rounded">
                        Primary
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-white h-7 w-7"
                        onClick={() => setPrimaryPhoto(photo.id)}
                        title="Set as primary"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-white h-7 w-7"
                        onClick={() => deletePhoto(photo.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-3"
              size="sm"
              disabled={photoUploading || photos.length >= 5}
              onClick={() => photoInputRef.current?.click()}
            >
              {photoUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload photos
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <p className="text-xs text-gray-400 mt-1">Upload your print photos — not designer renders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">STL file</CardTitle>
          </CardHeader>
          <CardContent>
            {(stlFileName ?? item.stlFileName) ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileBox className="w-8 h-8 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{stlFileName ?? item.stlFileName}</p>
                  <p className="text-xs text-gray-500">
                    {stlFileSizeBytes != null || item.stlFileSizeBytes != null
                      ? `${(((stlFileSizeBytes ?? item.stlFileSizeBytes) ?? 0) / 1024).toFixed(1)} KB`
                      : ""}
                  </p>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={deleteStl} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">No STL file</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-3"
              size="sm"
              disabled={stlUploading}
              onClick={() => stlInputRef.current?.click()}
            >
              {stlUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {(stlFileName ?? item.stlFileName) ? "Replace STL" : "Upload STL"}
            </Button>
            <input
              ref={stlInputRef}
              type="file"
              accept=".stl,.obj,.3mf"
              className="hidden"
              onChange={handleStlUpload}
            />
            <p className="text-xs text-gray-400 mt-1">STL, OBJ, 3MF · Max 200MB · Private</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Go-live checklist</CardTitle>
          </CardHeader>
          <CardContent>
            {checklist.map((check) => (
              <div key={check.label} className="flex items-center gap-2 py-1">
                {check.done ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${check.done ? "text-gray-600" : "text-gray-400"}`}
                >
                  {check.label}
                </span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{completedCount}/8 complete</span>
                <span className={allComplete ? "text-green-600" : "text-amber-600"}>
                  {allComplete ? "Ready to go live" : "Complete all to publish"}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div
                  className="bg-[#FF4D00] h-1.5 rounded-full transition-all"
                  style={{ width: `${(completedCount / 8) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
