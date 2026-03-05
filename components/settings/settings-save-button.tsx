"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SettingsSaveButtonProps {
  formId: string;
  action: string;
  children?: React.ReactNode;
}

export function SettingsSaveButton({ formId, action, children = "Save Changes" }: SettingsSaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) {
      setError("Form not found");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : saved ? "Saved" : children}
      </Button>
      {saved && <p className="text-sm text-green-600 font-medium">Settings saved successfully.</p>}
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}
