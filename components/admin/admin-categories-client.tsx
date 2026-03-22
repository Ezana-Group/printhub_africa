"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { CategoryFormSheet } from "@/components/admin/category-form-sheet";
import type { CategoryForForm } from "@/components/admin/category-form-sheet";
import { TableToolbar, type FilterConfig } from "@/components/admin/ui/TableToolbar";
import { TableEmptyState } from "@/components/admin/ui/TableEmptyState";
import { useTableUrlState } from "@/hooks/useTableUrlState";
import { Search, Camera, Copy } from "lucide-react";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  showInNav: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  _count: { products: number };
  parent: { id: string; name: string; slug: string } | null;
  children: CategoryRow[];
};

type AdminCategoriesClientProps = {
  initialCategories: CategoryRow[]; // This will now be the tree roots
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
    
    // Find category in tree (recursive)
    function findInTree(nodes: CategoryRow[], id: string): CategoryRow | undefined {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children?.length) {
          const found = findInTree(n.children, id);
          if (found) return found;
        }
      }
      return undefined;
    }

    const cat = findInTree(categories, initialEditId);
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
        showInNav: cat.showInNav,
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
      showInNav: cat.showInNav,
      metaTitle: cat.metaTitle,
      metaDescription: cat.metaDescription,
      parent: cat.parent,
    });
    setSheetOpen(true);
  };

  const handleAdd = (parentId?: string | null) => {
    setEditingCategory(parentId ? { parentId } as CategoryForForm : null);
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

  const handleNavToggle = async (cat: CategoryRow, checked: boolean) => {
    // Flatten tree to check nav limit
    function flatten(nodes: CategoryRow[]): CategoryRow[] {
      return nodes.reduce((acc, n) => [...acc, n, ...flatten(n.children || [])], [] as CategoryRow[]);
    }
    const flat = flatten(categories);

    if (checked) {
      const currentNavCount = flat.filter((c) => c.showInNav && c.id !== cat.id).length;
      if (currentNavCount >= 8) {
        alert("Navigation limit reached. Disable another category first (max 8 in nav).");
        return;
      }
    }
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showInNav: checked }),
    });
    if (res.ok) {
      refreshCategories();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to toggle navigation status");
    }
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

  const url = useTableUrlState({ defaultPerPage: 50 });
  const parentFilter = url.get("parent", "");
  const statusFilter = url.get("status", "");
  const sortField = url.get("sort", "name");
  const sortDir = url.dir === "desc" ? -1 : 1;

  const filteredAndSorted = useMemo(() => {
    // Helper to flatten local tree for table view
    function flatten(nodes: CategoryRow[]): CategoryRow[] {
      return nodes.reduce((acc, n) => [...acc, n, ...flatten(n.children || [])], [] as CategoryRow[]);
    }
    let list = flatten(categories);
    const q = url.q.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q))
      );
    }
    if (parentFilter === "top") list = list.filter((c) => !c.parentId);
    else if (parentFilter) list = list.filter((c) => c.parentId === parentFilter);
    if (statusFilter === "active") list = list.filter((c) => c.isActive);
    if (statusFilter === "inactive") list = list.filter((c) => !c.isActive);
    list.sort((a, b) => {
      if (sortField === "name") return sortDir * a.name.localeCompare(b.name);
      if (sortField === "products") return sortDir * (a._count.products - b._count.products);
      if (sortField === "sortOrder") return sortDir * (a.sortOrder - b.sortOrder);
      return 0;
    });
    return list;
  }, [categories, url.q, parentFilter, statusFilter, sortField, sortDir]);

  const parentFilterOptions = useMemo(() => {
    const opts = [{ value: "", label: "All parents" }, { value: "top", label: "Top level" }];
    // Roots only for filter? Or keep it simple
    categories.forEach((p) => opts.push({ value: p.id, label: p.name }));
    return opts;
  }, [categories]);

  const filters: FilterConfig[] = useMemo(
    () => [
      {
        key: "parent",
        label: "Parent",
        options: parentFilterOptions,
        value: parentFilter,
        onChange: (v) => url.set({ parent: v || undefined, page: 1 }),
      },
      {
        key: "status",
        label: "Status",
        options: [
          { value: "", label: "All status" },
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
        value: statusFilter,
        onChange: (v) => url.set({ status: v || undefined, page: 1 }),
      },
    ],
    [parentFilterOptions, parentFilter, statusFilter, url]
  );

  const hasActiveFilters = url.q !== "" || parentFilter !== "" || statusFilter !== "";

  const copySlug = useCallback((slug: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://printhub.africa";
    const path = `/shop/${slug}`;
    void navigator.clipboard.writeText(`${base}${path}`);
  }, []);

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
          <Button onClick={() => handleAdd()}>Add category</Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
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
          {viewMode === "table" && (
            <div className="flex-1 min-w-[280px]">
              <TableToolbar
                searchPlaceholder="Search categories..."
                searchValue={url.q}
                onSearch={url.setSearch}
                filters={filters}
                sortOptions={[
                  { label: "Name", value: "name" },
                  { label: "Products", value: "products" },
                  { label: "Sort order", value: "sortOrder" },
                ]}
                currentSort={sortField}
                currentSortDir={url.dir}
                onSortChange={url.setSort}
                totalCount={categories.length}
                filteredCount={filteredAndSorted.length}
                onClearFilters={url.clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          )}
        </div>

        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium w-12">Image</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Parent</th>
                  <th className="text-left p-3 font-medium">Slug</th>
                  <th className="text-left p-3 font-medium w-20">Products</th>
                  <th className="text-left p-3 font-medium w-24">Status</th>
                  <th className="text-left p-3 font-medium w-24">In Nav</th>
                  <th className="text-left p-3 font-medium w-16">Sort</th>
                  <th className="text-left p-3 font-medium w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => handleEdit(cat)}>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div
                        className="relative h-10 w-10 overflow-hidden rounded bg-muted flex items-center justify-center"
                        title={cat.image ? undefined : "Click Edit to add a category image"}
                      >
                        {cat.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={cat.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Camera className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="font-medium">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{cat.parent ? cat.parent.name : "—"}</td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <span className="font-mono text-xs">{cat.slug}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copySlug(cat.slug);
                        }}
                        className="ml-1.5 inline-flex text-muted-foreground hover:text-foreground"
                        title={`printhub.africa/shop/${cat.slug}`}
                        aria-label="Copy URL"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/admin/products?category=${cat.id}`}
                        className={cat._count.products === 0 ? "text-amber-600 hover:underline" : "text-primary hover:underline"}
                      >
                        {cat._count.products}
                      </Link>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={(checked) => handleStatusToggle(cat, checked)}
                        aria-label={`Toggle ${cat.name} active`}
                      />
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={cat.showInNav}
                        onCheckedChange={(checked) => handleNavToggle(cat, checked)}
                        aria-label={`Toggle ${cat.name} navigation`}
                        title="Show this category in the site navigation dropdown"
                      />
                    </td>
                    <td className="p-3 text-muted-foreground">{cat.sortOrder}</td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-primary"
                          onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat); }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAndSorted.length === 0 && (
              <TableEmptyState
                icon={Search}
                title={hasActiveFilters ? `No categories match your search` : "No categories yet"}
                description={hasActiveFilters ? "Try adjusting your filters or search terms." : "Add a category above or run db:seed."}
                actionLabel={hasActiveFilters ? "Clear filters" : "Add category"}
                onAction={hasActiveFilters ? url.clearFilters : handleAdd}
              />
            )}
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <CategoryTree
              categories={categories}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onNavToggle={handleNavToggle}
              onAddSub={handleAdd}
            />
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

function CategoryTree({
  categories,
  onEdit,
  onDelete,
  onNavToggle,
  onAddSub,
  parentId = null,
  depth = 0,
}: {
  categories: CategoryRow[];
  onEdit: (cat: CategoryRow) => void;
  onDelete: (cat: CategoryRow) => void;
  onNavToggle: (cat: CategoryRow, checked: boolean) => void;
  onAddSub: (parentId: string) => void;
  parentId?: string | null;
  depth?: number;
}) {
  const nodes = parentId === null ? categories : categories.find(c => c.id === parentId)?.children ?? [];
  if (nodes.length === 0) return null;

  return (
    <ul className={depth > 0 ? "ml-6 border-l border-muted pl-3 space-y-1 mt-1" : "space-y-1"}>
      {nodes.map((cat) => (
        <CategoryNode
          key={cat.id}
          cat={cat}
          onEdit={onEdit}
          onDelete={onDelete}
          onNavToggle={onNavToggle}
          onAddSub={onAddSub}
          depth={depth}
        />
      ))}
    </ul>
  );
}

function CategoryNode({
  cat,
  onEdit,
  onDelete,
  onNavToggle,
  onAddSub,
  depth,
}: {
  cat: CategoryRow;
  onEdit: (cat: CategoryRow) => void;
  onDelete: (cat: CategoryRow) => void;
  onNavToggle: (cat: CategoryRow, checked: boolean) => void;
  onAddSub: (parentId: string) => void;
  depth: number;
}) {
  return (
    <li>
      <div className="flex items-center gap-2 rounded py-1.5 px-2 hover:bg-muted/50 transition-colors group">
        <span className={depth === 0 ? "font-semibold" : depth === 1 ? "text-sm font-medium" : "text-sm"}>
          {cat.name}
        </span>
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase font-mono">
          {cat.slug}
        </span>
        <span className="text-xs text-muted-foreground">({cat._count.products} products)</span>
        
        <div className="ml-auto flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 mr-3" title="Show in site navigation dropdown">
            <Label htmlFor={`nav-${cat.id}`} className="text-[10px] text-muted-foreground cursor-pointer uppercase font-semibold">In Nav</Label>
            <Switch id={`nav-${cat.id}`} checked={cat.showInNav} onCheckedChange={(checked) => onNavToggle(cat, checked)} className="scale-75" />
          </div>
          {depth < 2 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" onClick={() => onAddSub(cat.id)}>
              Add Sub
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(cat)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(cat)}
          >
            Delete
          </Button>
        </div>
      </div>
      {cat.children && cat.children.length > 0 && (
        <CategoryTree
          categories={cat.children}
          onEdit={onEdit}
          onDelete={onDelete}
          onNavToggle={onNavToggle}
          onAddSub={onAddSub}
          parentId={null} // Passing children as roots for recursive call
          depth={depth + 1}
        />
      )}
    </li>
  );
}
