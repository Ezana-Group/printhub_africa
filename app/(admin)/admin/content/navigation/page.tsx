"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  ChevronRight, 
  ChevronDown,
  Edit2,
  Save,
  X,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  href: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: NavItem[];
}

export default function NavigationManager() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<NavItem>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNavigation();
  }, []);

  const fetchNavigation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/navigation");
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (error) {
      toast.error("Failed to load navigation");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedIds(newExpanded);
  };

  const startEdit = (item: NavItem) => {
    setEditingId(item.id);
    setEditFormData(item);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editFormData }),
      });
      if (res.ok) {
        toast.success("Item updated");
        setEditingId(null);
        fetchNavigation();
      } else {
        toast.error("Failed to update item");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will also delete all sub-items.")) return;
    try {
      const res = await fetch(`/api/admin/navigation?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Item deleted");
        fetchNavigation();
      }
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleCreate = async (parentId: string | null = null) => {
    const label = prompt("Enter label:");
    if (!label) return;
    const href = prompt("Enter link (e.g. /shop):", "/");
    if (!href) return;

    try {
      const res = await fetch("/api/admin/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          href,
          parentId,
          sortOrder: 99,
          isActive: true
        }),
      });
      if (res.ok) {
        toast.success("Item created");
        fetchNavigation();
      }
    } catch (error) {
      toast.error("Failed to create item");
    }
  };

  const moveOrder = async (id: string, currentOrder: number, direction: 'up' | 'down') => {
    // Basic ordering logic: just increment/decrement and save
    const newOrder = direction === 'up' ? Math.max(0, currentOrder - 1) : currentOrder + 1;
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, sortOrder: newOrder }),
      });
      if (res.ok) fetchNavigation();
    } catch (error) {}
  };

  const renderItem = (item: NavItem, depth = 0) => {
    const isEditing = editingId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    return (
      <div key={item.id} className="space-y-2">
        <div className={cn(
          "flex items-center gap-3 p-3 bg-white border rounded-xl shadow-sm transition-all",
          !item.isActive && "opacity-60 grayscale-[0.5]",
          isEditing && "ring-2 ring-primary ring-offset-2"
        )}>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isEditing ? (
              <>
                <div className="space-y-1">
                  <Input 
                    value={editFormData.label} 
                    onChange={e => setEditFormData(p => ({ ...p, label: e.target.value }))}
                    className="h-8"
                    placeholder="Label"
                  />
                </div>
                <div className="space-y-1">
                  <Input 
                    value={editFormData.href} 
                    onChange={e => setEditFormData(p => ({ ...p, href: e.target.value }))}
                    className="h-8"
                    placeholder="URL"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={editFormData.isActive} 
                    onCheckedChange={(checked: boolean) => setEditFormData(p => ({ ...p, isActive: !!checked }))}
                  />
                  <Label className="text-xs uppercase font-bold text-slate-500">Active</Label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-2">
                    {item.label}
                    {depth === 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">Top Level</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> {item.href}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    item.isActive ? "bg-green-500" : "bg-slate-300"
                  )} />
                  <span className="text-xs uppercase font-bold text-slate-500">
                    {item.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleSave(item.id)}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => startEdit(item)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex flex-col gap-0.5">
                  <Button variant="ghost" size="icon" className="h-4 w-8" onClick={() => moveOrder(item.id, item.sortOrder, 'up')}>
                    <MoveUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-4 w-8" onClick={() => moveOrder(item.id, item.sortOrder, 'down')}>
                    <MoveDown className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="ml-8 border-l-2 border-slate-100 pl-4 space-y-2">
            {item.children?.map(child => renderItem(child, depth + 1))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-slate-400 hover:text-primary gap-2"
              onClick={() => handleCreate(item.id)}
            >
              <Plus className="h-3 w-3" /> Add Sub-item
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">Navigation Management</h1>
          <p className="text-slate-500 text-sm">Control the main menu dropdowns and links.</p>
        </div>
        <Button onClick={() => handleCreate(null)} className="rounded-xl gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Add Top-Level Link
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-slate-400 font-medium">Loading navigation...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => renderItem(item))}
          {items.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-slate-50/50">
              <p className="text-slate-400">No navigation items found. Click the button above to start.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800">
        <Plus className="h-5 w-5 shrink-0" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Pro Tip</p>
          <p>Links starting with / (e.g. <code>/shop</code>) will stay on the same site. External links (e.g. <code>https://google.com</code>) will open in a new tab.</p>
          <p>Sub-items will appear in the dropdown menu for Top-Level links.</p>
        </div>
      </div>
    </div>
  );
}
