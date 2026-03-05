"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CategoryFormSheet } from "@/components/admin/category-form-sheet";
import type { CategoryForForm } from "@/components/admin/category-form-sheet";

type CategoryRow = {
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
  _count: { products: number };
  parent: { id: string; name: string; slug: string } | null;
};

type AdminCategoriesClientProps = {
  initialCategories: CategoryRow[];
  parentOptions: { id: string; name: string; slug: string; parentId: string | null }[];
  initialEditId?: string | null;
};

export function AdminCategoriesClient({
  initialCategories,
  parentOptions,
  initialEditId = null,
}: AdminCategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryForForm | null>(null);
  const hasAppliedEditId = useRef(false);

  useEffect(() => {
    if (!initialEditId || hasAppliedEditId.current || categories.length === 0) return;
    const cat = categories.find((c) => c.id === initialEditId);
    if (cat) {
      hasAppliedEditId.current = true;
      setEditingCategory({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        parent: cat.parent,
      });
      setSheetOpen(true);
    }
  }, [initialEditId, categories]);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");

  const refreshCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  }, []);

  const handleEdit = (cat: CategoryRow) => {
    setEditingCategory({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      parentId: cat.parentId,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      metaTitle: cat.metaTitle,
      metaDescription: cat.metaDescription,
      parent: cat.parent,
    });
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setSheetOpen(true);
  };

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setEditingCategory(null);
    refreshCategories();
  };

  const handleStatusToggle = async (cat: CategoryRow, checked: boolean) => {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: checked }),
    });
    if (res.ok) refreshCategories();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to delete");
        return;
      }
      setDeleteTarget(null);
      refreshCategories();
    } finally {
      setDeleteLoading(false);
    }
  };

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenByParent = categories.reduce<Record<string, CategoryRow[]>>((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Shop products are grouped by category. Add or edit here; assign when creating products.
            </p>
          </div>
          <Button onClick={handleAdd}>Add category</Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            Table view
          </Button>
          <Button
            variant={viewMode === "tree" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("tree")}
          >
            Tree view
          </Button>
        </div>

        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium w-12">Image</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Parent</th>
                  <th className="text-left p-3 font-medium">Slug</th>
                  <th className="text-left p-3 font-medium w-20">Products</th>
                  <th className="text-left p-3 font-medium w-24">Status</th>
                  <th className="text-left p-3 font-medium w-16">Sort</th>
                  <th className="text-left p-3 font-medium w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                        {cat.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={cat.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {cat.parent ? cat.parent.name : "—"}
                    </td>
                    <td className="p-3 font-mono text-xs">{cat.slug}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/products?category=${cat.slug}`}
                        className="text-primary hover:underline"
                      >
                        {cat._count.products}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={(checked) => handleStatusToggle(cat, checked)}
                        aria-label={`Toggle ${cat.name} active`}
                      />
                    </td>
                    <td className="p-3 text-muted-foreground">{cat.sortOrder}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-primary"
                          onClick={() => handleEdit(cat)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {categories.length === 0 && (
              <p className="p-8 text-center text-muted-foreground">
                No categories. Add one above or run db:seed.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <ul className="space-y-1">
              {topLevel.map((cat) => (
                <li key={cat.id}>
                  <div className="flex items-center gap-2 rounded py-1.5 px-2 hover:bg-muted/50">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">({cat._count.products} products)</span>
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => handleEdit(cat)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive"
                        onClick={() => setDeleteTarget(cat)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {childrenByParent[cat.id]?.length ? (
                    <ul className="ml-6 border-l border-muted pl-3">
                      {childrenByParent[cat.id].map((child) => (
                        <li key={child.id} className="py-1">
                          <div className="flex items-center gap-2 rounded py-1 px-2 hover:bg-muted/50">
                            <span className="text-sm">{child.name}</span>
                            <span className="text-xs text-muted-foreground">({child._count.products})</span>
                            <div className="ml-auto flex gap-1">
                              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => handleEdit(child)}>
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-destructive"
                                onClick={() => setDeleteTarget(child)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            {categories.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No categories.</p>
            )}
          </div>
        )}
      </div>

      <CategoryFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        category={editingCategory}
        parentOptions={parentOptions}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget._count.products > 0 ? (
                <>
                  This category has <strong>{deleteTarget._count.products} product(s)</strong>. You cannot
                  delete it until you reassign or remove those products.
                </>
              ) : deleteTarget ? (
                <>This will permanently delete &quot;{deleteTarget.name}&quot;. This action cannot be undone.</>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteLoading || (deleteTarget?._count.products ?? 0) > 0}
              onClick={handleDeleteConfirm}
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
