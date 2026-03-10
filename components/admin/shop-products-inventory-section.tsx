"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function StockBadge({ stock, lowStockThreshold }: { stock: number; lowStockThreshold: number }) {
  if (lowStockThreshold <= 0) {
    return <span className="text-muted-foreground text-sm">Not tracked</span>;
  }
  if (stock <= 0) {
    return <Badge variant="destructive">Out of stock</Badge>;
  }
  if (stock < lowStockThreshold) {
    return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Low ({stock})</Badge>;
  }
  return <Badge variant="secondary" className="bg-green-100 text-green-800">In stock ({stock})</Badge>;
}

export function ShopProductsInventorySection({ products }: { products: ShopProductRow[] }) {
  const lowCount = products.filter(
    (p) => p.lowStockThreshold > 0 && p.stock > 0 && p.stock < p.lowStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.lowStockThreshold > 0 && p.stock <= 0).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Unit counts of finished products for the shop. Stock deducts when shop orders are confirmed. Raw materials for print services are under Print Materials.
      </p>
      {(lowCount > 0 || outOfStockCount > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3 px-4">
            <span className="text-amber-800 text-sm font-medium">
              {lowCount + outOfStockCount} product(s) need attention: {lowCount} low, {outOfStockCount} out of stock.
            </span>
            {" "}
            <Link href="/admin/products" className="text-primary hover:underline text-sm">
              View products
            </Link>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
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
                {products.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.images[0] ? (
                          <div className="relative h-10 w-10 rounded border bg-muted shrink-0 overflow-hidden">
                            <Image src={p.images[0]} alt="" fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded border bg-muted shrink-0" />
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-muted-foreground">{p.sku ?? "—"}</td>
                    <td className="p-4 text-muted-foreground">{p.category?.name ?? "—"}</td>
                    <td className="p-4">{p.stock}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StockBadge stock={p.stock} lowStockThreshold={p.lowStockThreshold} />
                        {!p.isActive && <Badge variant="outline">Inactive</Badge>}
                      </div>
                    </td>
                    <td className="p-4">
                      <Link href={`/admin/products/${p.id}`} className="text-primary hover:underline">
                        Edit product →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">
              No shop products yet. Add products in{" "}
              <Link href="/admin/products" className="text-primary hover:underline">Products</Link>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
