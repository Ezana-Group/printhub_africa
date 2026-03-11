"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type SaveButtonState = "idle" | "loading" | "success" | "error";

export interface UseSaveButtonOptions {
  /** Callback that performs the save. Should throw or return false on failure. */
  onSave: () => Promise<void | boolean>;
  /** Duration in ms to show success state before reverting to idle. Default 2000. */
  successDurationMs?: number;
  /** Optional success message for toast/copy. */
  successMessage?: string;
}

export interface UseSaveButtonResult {
  saving: boolean;
  success: boolean;
  error: string | null;
  state: SaveButtonState;
  handleSave: () => Promise<void>;
  clearError: () => void;
  /** Props to spread onto the save Button: disabled, variant, className, children text. */
  buttonProps: {
    disabled: boolean;
    variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    className: string;
    label: string;
  };
  successMessage?: string;
}

export function useSaveButton({
  onSave,
  successDurationMs = 2000,
  successMessage,
}: UseSaveButtonOptions): UseSaveButtonResult {
  const [state, setState] = useState<SaveButtonState>("idle");
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState("loading");
    try {
      const result = await onSave();
      if (result === false) {
        setState("error");
        setError("Failed to save");
        return;
      }
      setState("success");
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setState("idle");
      }, successDurationMs);
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  }, [onSave, successDurationMs]);

  const clearError = useCallback(() => {
    setError(null);
    if (state === "error") setState("idle");
  }, [state]);

  const saving = state === "loading";
  const success = state === "success";

  const buttonProps = {
    disabled: saving,
    variant: (state === "error" ? "destructive" : state === "success" ? "default" : "default") as
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link",
    className:
      state === "success"
        ? "bg-green-600 hover:bg-green-600 text-white"
        : state === "error"
          ? "bg-destructive text-destructive-foreground"
          : "",
    label:
      state === "loading"
        ? "Saving…"
        : state === "success"
          ? "✓ Saved!"
          : state === "error"
            ? "✗ Failed to save"
            : "Save",
  };

  return {
    saving,
    success,
    error,
    state,
    handleSave,
    clearError,
    buttonProps,
    successMessage: successMessage ?? undefined,
  };
}
