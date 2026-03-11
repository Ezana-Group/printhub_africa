"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditableSectionContext } from "@/components/admin/editable-section-context";

export type EditableSectionField = {
  label: string;
  value: string | number | null | undefined;
  /** When in edit mode, this is rendered. Parent should pass a controlled input that updates local state. */
  editNode: React.ReactNode;
};

export interface EditableSectionProps {
  id: string;
  title: string;
  description?: string;
  /** When false, Edit button is hidden or disabled with tooltip "You don't have permission to edit this" */
  canEdit?: boolean;
  /** View mode: rows of label + value. Pass same length as fields for custom view, or use default. */
  fields?: EditableSectionField[];
  /** Custom view content (use when fields array is not enough). If provided, used instead of default fields view. */
  viewContent?: React.ReactNode;
  /** Custom edit content. If provided, used instead of default fields edit. Receives setHasChanges so form can report dirty state. */
  editContent?: (props: { setHasChanges: (v: boolean) => void }) => React.ReactNode;
  /** Called when user clicks Save. Should persist and then re-fetch/update parent state. */
  onSave: () => Promise<void>;
  /** Optional class for the card */
  className?: string;
}

const defaultFormatValue = (v: string | number | null | undefined): string => {
  if (v == null || v === "") return "—";
  return String(v);
};

export function EditableSection({
  id,
  title,
  description,
  canEdit = true,
  fields = [],
  viewContent,
  editContent,
  onSave,
  className,
}: EditableSectionProps) {
  const ctx = useEditableSectionContext();
  const [localEditing, setLocalEditing] = useState(false);
  const isEditingFromContext = ctx?.activeSectionId === id;
  const isEditing = ctx ? isEditingFromContext : localEditing;
  const [hasChanges, setHasChangesState] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // AUDIT FIX: brief success feedback after save (no toast lib in project)
  const [saveSuccess, setSaveSuccess] = useState(false);
  const setHasChangesRef = useRef(setHasChangesState);
  setHasChangesRef.current = setHasChangesState;

  const setHasChanges = (v: boolean) => {
    setHasChangesRef.current(v);
    setHasChangesState(v);
  };

  useEffect(() => {
    if (!isEditing) setHasChangesState(false);
  }, [isEditing]);

  // Keep section state in context up to date while editing (no cleanup here so hasChanges/title updates don't close the section)
  useEffect(() => {
    if (!ctx || !isEditing) return;
    ctx.registerSection(id, { hasChanges: hasChanges, title });
  }, [ctx, id, isEditing, hasChanges, title]);

  // Unregister only when leaving edit mode or unmounting (cleanup must not depend on hasChanges/title or typing closes the section)
  useEffect(() => {
    if (!ctx || !isEditing) return;
    return () => ctx.unregisterSection(id);
  }, [ctx, id, isEditing]);

  useEffect(() => {
    if (!isEditing || !hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditing, hasChanges]);

  const handleEditClick = () => {
    if (!canEdit) return;
    if (ctx) {
      const ok = ctx.requestEdit(id, title, hasChanges);
      if (!ok) return;
    } else {
      setLocalEditing(true);
    }
  };

  const handleCancel = () => {
    setHasChanges(false);
    setError(null);
    if (ctx) ctx.closeSection(id);
    else setLocalEditing(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      await onSave();
      setHasChanges(false);
      setSaveSuccess(true);
      if (ctx) ctx.closeSection(id);
      else setLocalEditing(false);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const showView = !isEditing;
  const showEdit = isEditing;

  return (
    <Card
      id={id}
      className={cn(
        "transition-all duration-200 ease-out overflow-hidden",
        showView && "border border-border bg-card",
        showEdit && "border-l-4 border-l-orange-500 border-t border-r border-b border-orange-200/60 bg-[#FFFAF7] shadow-sm",
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {showEdit && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                Editing
              </span>
            )}
          </div>
          {description && <CardDescription className="mt-1 text-muted-foreground">{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showView && canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-300"
              aria-label={`Edit ${title}`}
            >
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          )}
          {showView && !canEdit && (
            <span className="text-xs text-muted-foreground" title="You don't have permission to edit this">
              View only
            </span>
          )}
          {showEdit && (
            <div className="flex items-center gap-2 rounded-md border border-orange-200/80 bg-white/60 p-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1"
              >
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Save changes
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        {saveSuccess && (
          <p className="text-sm text-green-600 font-medium rounded-md bg-green-50 dark:bg-green-950/30 px-3 py-2" role="status">
            Saved.
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive font-medium rounded-md bg-destructive/10 px-3 py-2" role="alert">
            {error}
          </p>
        )}
        {showView && viewContent !== undefined && viewContent}
        {showView && viewContent === undefined && fields.length > 0 && (
          <div className="space-y-0 rounded-md">
            {fields.map((f, i) => (
              <div
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 px-2 -mx-2 border-b border-border/40 last:border-0 hover:bg-muted/40 rounded transition-colors"
              >
                <span className="text-sm text-muted-foreground">{f.label}</span>
                <span className="text-sm font-medium text-foreground tabular-nums">{defaultFormatValue(f.value)}</span>
              </div>
            ))}
          </div>
        )}
        {showEdit && editContent && editContent({ setHasChanges })}
        {showEdit && !editContent && fields.length > 0 && (
          <div
            className="space-y-4"
            onChangeCapture={() => setHasChanges(true)}
            onInputCapture={() => setHasChanges(true)}
          >
            {fields.map((f, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">{f.label}</label>
                <div className="focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-1 rounded-md transition-shadow">
                  {f.editNode}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
