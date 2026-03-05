"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  type SelectOption,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import {
  getProductTypeLabel,
  getProductTypeDotColor,
} from "@/lib/admin-utils";
import { ProductFormSheet } from "@/components/admin/product-form-sheet";
import {
  MoreHorizontal,
  Search,
  Plus,
  Package,
  ExternalLink,
  Copy,
  Archive,
  Trash2,
  Box,
} from "lucide-react";

type ProductType = "READYMADE_3D" | "LARGE_FORMAT" | "CUSTOM";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  categoryId: string;
  category: { id: string; name: string };
  productType: ProductType;
  basePrice: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  createdAt: Date;
  _variantsCount?: number;
};

function StockBadge({ stock, productType }: { stock: number; productType: ProductType }) {
  const isService = productType === "LARGE_FORMAT" || productType === "CUSTOM";
  if (isService && stock === 0) {
    return <Badge variant="secondary" className="font-mono text-xs bg-[#F3F4F6] text-[#6B7280]">Service</Badge>;
  }
  if (stock === 0) return <Badge className="bg-[#EF4444] text-white border-0">Out of Stock</Badge>;
  if (stock <= 5) return <Badge className="bg-[#F59E0B] text-white border-0">Low: {stock}</Badge>;
  if (stock < 20) return <Badge variant="secondary" className="bg-[#F3F4F6] text-[#6B7280]">In Stock: {stock}</Badge>;
  return <Badge className="bg-[#10B981] text-white border-0">{stock}</Badge>;
}

export function ProductsAdminClient({
  products: initialProducts,
  categories,
}: {
  products: ProductRow[];
  categories: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const categoryOptions: SelectOption[] = useMemo(
    () => [{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories]
  );
  const typeOptions: SelectOption[] = [
    { value: "", label: "All types" },
    { value: "READYMADE_3D", label: "Ready-made 3D" },
    { value: "LARGE_FORMAT", label: "Large Format" },
    { value: "CUSTOM", label: "3D Service" },
  ];
  const statusOptions: SelectOption[] = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const filteredAndSorted = useMemo(() => {
    let list = [...initialProducts];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q)) ||
          (p.description?.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) list = list.filter((p) => p.categoryId === categoryFilter);
    if (typeFilter) list = list.filter((p) => p.productType === typeFilter);
    if (statusFilter === "active") list = list.filter((p) => p.isActive);
    if (statusFilter === "inactive") list = list.filter((p) => !p.isActive);
    if (sorting.length) {
      const [s] = sorting;
      const key = s.id as keyof ProductRow;
      const dir = s.desc ? -1 : 1;
      list.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === "string" && typeof bv === "string") return dir * av.localeCompare(bv);
        if (typeof av === "number" && typeof bv === "number") return dir * (av - bv);
        if (av instanceof Date && bv instanceof Date) return dir * (av.getTime() - bv.getTime());
        return 0;
      });
    }
    return list;
  }, [initialProducts, search, categoryFilter, typeFilter, statusFilter, sorting]);

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !isActive }),
        });
        if (res.ok) router.refresh();
      } catch {
        // ignore
      }
    },
    [router]
  );

  const columns: ColumnDef<ProductRow>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => {
              if (e.target.checked) setSelected(new Set(filteredAndSorted.map((p) => p.id)));
              else setSelected(new Set());
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={selected.has(row.original.id)}
            onChange={(e) => {
              e.stopPropagation();
              const next = new Set(selected);
              if (next.has(row.original.id)) next.delete(row.original.id);
              else next.add(row.original.id);
              setSelected(next);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
          />
        ),
        size: 40,
      },
      {
        accessorKey: "images",
        header: "",
        size: 56,
        cell: ({ row }) => {
          const imgs = row.original.images;
          const src = Array.isArray(imgs) && imgs[0] ? imgs[0] : null;
          return (
            <div className="h-12 w-12 rounded-md bg-[#F3F4F6] overflow-hidden shrink-0 flex items-center justify-center">
              {src ? (
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <Box className="h-5 w-5 text-[#9CA3AF]" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(p);
                  setSheetOpen(true);
                }}
                className="text-left font-semibold text-sm text-[#111] hover:text-primary hover:underline truncate block"
              >
                {p.name}
              </button>
              <div className="text-[12px] text-[#6B7280] font-mono">
                {p.sku ? `SKU: ${p.sku}` : "No SKU"}
              </div>
              {p._variantsCount && p._variantsCount > 0 && (
                <span className="text-[11px] text-[#6B7280]">{p._variantsCount} variants</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal bg-[#F3F4F6] text-[#6B7280]">
            {row.original.category.name}
          </Badge>
        ),
      },
      {
        accessorKey: "productType",
        header: "Type",
        cell: ({ row }) => {
          const t = row.original.productType;
          const color = getProductTypeDotColor(t);
          return (
            <span className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {getProductTypeLabel(t)}
            </span>
          );
        },
      },
      {
        accessorKey: "basePrice",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-semibold text-sm text-[#111]">
            {formatPrice(row.original.basePrice)}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => (
          <StockBadge stock={row.original.stock} productType={row.original.productType} />
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <Switch
              checked={p.isActive}
              onCheckedChange={() => toggleActive(p.id, p.isActive)}
              onClick={(e) => e.stopPropagation()}
              className="data-[state=checked]:bg-[#10B981]"
            />
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* AUDIT FIX: View on site uses correct public URL /shop/[slug] */}
                <DropdownMenuItem asChild>
                  <Link href={`/shop/${p.slug}`} target="_blank" rel="noopener">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingProduct(p);
                    setSheetOpen(true);
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Edit product
                </DropdownMenuItem>
                {/* AUDIT FIX: Duplicate opens form pre-filled; form submits as POST (create) */}
                <DropdownMenuItem
                  onClick={() => {
                    setEditingProduct({ ...p, id: "new", name: p.name, slug: p.slug });
                    setSheetOpen(true);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate product
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => toggleActive(p.id, p.isActive)}
                  disabled={!p.isActive}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    if (!confirm("Delete this product? This cannot be undone.")) return;
                    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
                    if (res.ok) router.refresh();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 56,
      },
    ],
    [selected, filteredAndSorted, toggleActive, router]
  );

  const table = useReactTable({
    data: filteredAndSorted,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setSheetOpen(true);
  };

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <AdminBreadcrumbs items={[{ label: "Products" }]} />
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#111]">Products</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Showing {filteredAndSorted.length} of {initialProducts.length} products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Import ▾
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem disabled className="text-muted-foreground">Import from CSV (coming soon)</DropdownMenuItem>
              <DropdownMenuItem disabled className="text-muted-foreground">Download CSV Template (coming soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select
          options={categoryOptions}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-[180px] h-9"
        />
        <Select
          options={typeOptions}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-[160px] h-9"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[120px] h-9"
        />
      </div>

      <Card className="mt-6 border-[#E5E7EB] bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredAndSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Box className="h-12 w-12 text-[#9CA3AF] mb-4" />
                <p className="text-base font-medium text-[#111]">No products found</p>
                <p className="text-sm text-[#6B7280] mt-1 text-center max-w-sm">
                  Add your first product or adjust your search filters.
                </p>
                <Button onClick={handleAddProduct} className="mt-4 bg-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#F3F4F6] border-b border-[#E5E7EB]">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="text-left px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider"
                          style={{ width: h.getSize() || undefined }}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] h-14 transition-colors cursor-pointer"
                      onClick={() => {
                        setEditingProduct(row.original);
                        setSheetOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-0 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {selected.size > 0 && (
        <div className="fixed bottom-0 left-56 right-0 z-20 flex items-center justify-between border-t border-[#E5E7EB] bg-white px-6 py-3 shadow-lg">
          <span className="text-sm text-[#6B7280]">
            {selected.size} product{selected.size === 1 ? "" : "s"} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                for (const id of selected) {
                  await fetch(`/api/admin/products/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: true }),
                  });
                }
                setSelected(new Set());
                router.refresh();
              }}
            >
              Set Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                for (const id of selected) {
                  await fetch(`/api/admin/products/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: false }),
                  });
                }
                setSelected(new Set());
                router.refresh();
              }}
            >
              Set Inactive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
                for (const id of selected) {
                  await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
                }
                setSelected(new Set());
                router.refresh();
              }}
            >
              Delete
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelected(new Set())}>×</Button>
          </div>
        </div>
      )}

      <ProductFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        product={editingProduct}
        categories={categories}
        onSuccess={() => {
          router.refresh();
          setSheetOpen(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
}
