"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Users,
  Check,
  X,
  AlertTriangle,
  Building,
} from "lucide-react";

const PRESET_COLOURS = [
  "#FF4D00",
  "#0A0A0A",
  "#7C3AED",
  "#059669",
  "#2563EB",
  "#D97706",
  "#DB2777",
  "#0891B2",
  "#64748B",
  "#B45309",
  "#DC2626",
  "#0D9488",
];

interface Department {
  id: string;
  name: string;
  description: string | null;
  colour: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { staff: number };
}

export function DepartmentsManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColour, setNewColour] = useState("#FF4D00");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColour, setEditColour] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetch("/api/admin/departments")
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data.departments ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load departments");
        setLoading(false);
      });
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc || undefined, colour: newColour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setDepartments((ds) => [...ds, { ...data.department, _count: { staff: 0 } }]);
      setNewName("");
      setNewDesc("");
      setNewColour("#FF4D00");
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (dept: Department) => {
    setEditId(dept.id);
    setEditName(dept.name);
    setEditDesc(dept.description ?? "");
    setEditColour(dept.colour ?? "#FF4D00");
    setSaveError("");
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDesc || null, colour: editColour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setDepartments((ds) =>
        ds.map((d) =>
          d.id === id ? { ...d, name: editName, description: editDesc || null, colour: editColour } : d
        )
      );
      setEditId(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (dept: Department) => {
    const res = await fetch(`/api/admin/departments/${dept.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !dept.isActive }),
    });
    if (res.ok) {
      setDepartments((ds) =>
        ds.map((d) => (d.id === dept.id ? { ...d, isActive: !d.isActive } : d))
      );
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setDepartments((ds) => ds.filter((d) => d.id !== id));
      setDeleteId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const ColourDot = ({ colour }: { colour: string }) => (
    <span
      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
      style={{ background: colour }}
    />
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Departments</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage departments that appear in the staff invite and edit forms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setAddError("");
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-xl text-sm font-medium hover:bg-[#e04400] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {showAddForm && (
        <div className="bg-orange-50 border border-[#FF4D00]/20 rounded-2xl p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">New Department</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Department name <span className="text-red-500">*</span>
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                placeholder="e.g. Finishing, Accounts, HR..."
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What does this department do?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Badge colour</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLOURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColour(c)}
                    className={`w-7 h-7 rounded-lg transition-all ${
                      newColour === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                    }`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  value={newColour}
                  onChange={(e) => setNewColour(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 overflow-hidden p-0"
                  title="Custom colour"
                />
              </div>
            </div>
          </div>
          {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewName("");
                setNewDesc("");
              }}
              className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || adding}
              className="flex-1 bg-[#FF4D00] text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-40 hover:bg-[#e04400]"
            >
              {adding ? "Adding…" : "Add Department"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {departments.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-gray-400">
            <Building className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No departments yet. Add one above.</p>
          </div>
        )}

        {departments.map((dept) => (
          <div
            key={dept.id}
            className={`bg-white border rounded-2xl transition-all ${
              !dept.isActive ? "border-gray-100 opacity-60" : "border-gray-100 hover:border-gray-200"
            }`}
          >
            {editId === dept.id ? (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Optional description"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-2">Badge colour</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLOURS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColour(c)}
                        className={`w-6 h-6 rounded-lg transition-all ${
                          editColour === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={editColour}
                      onChange={(e) => setEditColour(e.target.value)}
                      className="w-6 h-6 rounded-lg cursor-pointer border border-gray-200"
                    />
                  </div>
                </div>
                {saveError && <p className="text-xs text-red-600 mb-2">{saveError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(dept.id)}
                    disabled={!editName.trim() || saving}
                    className="px-4 py-1.5 bg-[#FF4D00] text-white rounded-xl text-sm font-medium disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : deleteId === dept.id ? (
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delete &quot;{dept.name}&quot;?</p>
                    {dept._count.staff > 0 ? (
                      <p className="text-xs text-red-600 mt-1">
                        This department has {dept._count.staff} staff member
                        {dept._count.staff !== 1 ? "s" : ""}. Reassign them first, or deactivate instead.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        This department has no staff and will be permanently removed.
                      </p>
                    )}
                  </div>
                </div>
                {deleteError && <p className="text-xs text-red-600 mb-2">{deleteError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteId(null);
                      setDeleteError("");
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-600"
                  >
                    Cancel
                  </button>
                  {dept._count.staff === 0 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(dept.id)}
                      disabled={deleting}
                      className="px-4 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-40"
                    >
                      {deleting ? "Deleting…" : "Delete permanently"}
                    </button>
                  )}
                  {dept._count.staff > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleActive(dept);
                        setDeleteId(null);
                      }}
                      className="px-4 py-1.5 bg-amber-500 text-white rounded-xl text-sm font-medium"
                    >
                      Deactivate instead
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                <ColourDot colour={dept.colour ?? "#888"} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        dept.isActive ? "text-gray-900" : "text-gray-400 line-through"
                      }`}
                    >
                      {dept.name}
                    </span>
                    {!dept.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {dept.description && (
                    <p className="text-xs text-gray-400 truncate">{dept.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  <span>{dept._count.staff}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(dept)}
                    title={dept.isActive ? "Deactivate" : "Activate"}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    {dept.isActive ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(dept)}
                    title="Edit"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteId(dept.id);
                      setDeleteError("");
                    }}
                    title="Delete"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {departments.length > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          Departments appear in the staff invite form and staff profile. Deactivating hides from new
          selections but keeps existing assignments intact.
        </p>
      )}
    </div>
  );
}
