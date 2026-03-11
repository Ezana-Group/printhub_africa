"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableToolbar, type FilterConfig } from "@/components/admin/ui/TableToolbar";
import { TableEmptyState } from "@/components/admin/ui/TableEmptyState";
import { useTableUrlState } from "@/hooks/useTableUrlState";
import { Package, Plus } from "lucide-react";

export type ShopProductRow = {
  id: string;
  name: string;
  sku: string | null;
  category: { name: string } | null;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  isActive: boolean;
};

function getStockStatus(p: ShopProductRow): "in_stock" | "low_stock" | "out_of_stock" | "not_tracked" | "service" {
  if (p.lowStockThreshold <= 0) return "not_tracked";
  if (p.stock <= 0) return "out_of_stock";
  if (p.stock < p.lowStockThreshold) return "low_stock";
  return "in_stock";
}

function StockBadge({ stock, lowStockThreshold }: { stock: number; lowStockThreshold: number }) {
  if (lowStockThreshold <= 0) {
    return <span className="text-muted-foreground/80 text-sm" title="Service product — stock not tracked">Not tracked</span>;
  }
  if (stock <= 0) {
    return <Badge variant="destructive" className="font-medium">Out of Stock</Badge>;
  }
  if (stock < lowStockThreshold) {
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Low ({stock})</Badge>;
  }
  return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{stock} units</Badge>;
}

export function ShopProductsInventorySection({ products }: { products: ShopProductRow[] }) {
  const url = useTableUrlState({ defaultPerPage: 50 });
  const categoryFilter = url.get("category", "");
  const stockStatusFilter = url.get("stockStatus", "");

  const filtered = useMemo(() => {
    let list = [...products];
    const q = url.q.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q)) ||
          (p.category?.name?.toLowerCase().includes(q))
      );
    }
    if (categoryFilter) list = list.filter((p) => (p.category?.name ?? "") === categoryFilter);
    if (stockStatusFilter) {
      list = list.filter((p) => getStockStatus(p) === stockStatusFilter);
    }
    const sortField = url.sort || "name";
    const dir = url.dir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      if (sortField === "name") return dir * (a.name.localeCompare(b.name));
      if (sortField === "stock") return dir * (a.stock - b.stock);
      if (sortField === "category") return dir * ((a.category?.name ?? "").localeCompare(b.category?.name ?? ""));
      return 0;
    });
    return list;
  }, [products, url.q, categoryFilter, stockStatusFilter, url.sort, url.dir]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.category?.name) set.add(p.category!.name); });
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filters: FilterConfig[] = useMemo(
    () => [
      {
        key: "category",
        label: "Category",
        options: categories.map((c) => ({ value: c === "All" ? "" : c, label: c })),
        value: categoryFilter,
        onChange: (v) => url.set({ category: v || undefined, page: 1 }),
      },
      {
        key: "stockStatus",
        label: "Stock status",
        options: [
          { value: "", label: "All" },
          { value: "in_stock", label: "In Stock" },
          { value: "low_stock", label: "Low Stock" },
          { value: "out_of_stock", label: "Out of Stock" },
          { value: "not_tracked", label: "Not Tracked" },
        ],
        value: stockStatusFilter,
        onChange: (v) => url.set({ stockStatus: v || undefined, page: 1 }),
      },
    ],
    [categories, categoryFilter, stockStatusFilter, url]
  );

  const hasActiveFilters = url.q !== "" || categoryFilter !== "" || stockStatusFilter !== "";

  const lowCount = products.filter((p) => p.lowStockThreshold > 0 && p.stock > 0 && p.stock < p.lowStockThreshold).length;
  const outOfStockCount = products.filter((p) => p.lowStockThreshold > 0 && p.stock <= 0).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Unit counts of finished products for the shop. Stock deducts when shop orders are confirmed. Raw materials for print services are under Print Materials.
      </p>
      {(lowCount > 0 || outOfStockCount > 0) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-amber-800 dark:text-amber-200 text-sm font-medium">
              {lowCount + outOfStockCount} product(s) need attention: {lowCount} low, {outOfStockCount} out of stock.
            </span>
            <Button variant="link" size="sm" className="text-amber-800 dark:text-amber-200 h-auto p-0" asChild>
              <Link href="/admin/products">View products</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <TableToolbar
          searchPlaceholder="Search products, SKU..."
          searchValue={url.q}
          onSearch={url.setSearch}
          filters={filters}
          sortOptions={[{ label: "Product", value: "name" }, { label: "In stock", value: "stock" }, { label: "Category", value: "category" }]}
          currentSort={url.sort || "name"}
          currentSortDir={url.dir}
          onSortChange={url.setSort}
          totalCount={products.length}
          filteredCount={filtered.length}
          onClearFilters={url.clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">In stock</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => window.location.href = `/admin/products/${p.id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          <div className="relative h-10 w-10 rounded border bg-muted shrink-0 overflow-hidden">
                            <Image src={p.images[0]} alt="" fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded border bg-muted shrink-0 flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-muted-foreground">{p.sku ?? "—"}</td>
                    <td className="p-4 text-muted-foreground">{p.category?.name ?? "—"}</td>
                    <td className="p-4">
                      <StockBadge stock={p.stock} lowStockThreshold={p.lowStockThreshold} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!p.isActive && <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}
                      </div>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                          <Link href={`/admin/products/${p.id}`}><Plus className="mr-1 h-3 w-3" /> Add Stock</Link>
                        </Button>
                        <Link href={`/admin/products/${p.id}`} className="text-primary hover:underline text-sm">
                          Edit product →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <TableEmptyState
              icon={Package}
              title={products.length === 0 ? "No shop products yet" : "No products match your filters"}
              description={products.length === 0 ? "Add products in Admin → Products to track their stock here." : "Try adjusting your filters or search."}
              actionLabel={products.length === 0 ? "Go to Products" : hasActiveFilters ? "Clear filters" : undefined}
              onAction={products.length === 0 ? () => { window.location.href = "/admin/products"; } : hasActiveFilters ? url.clearFilters : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
