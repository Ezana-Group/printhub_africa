"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const API = "/api/admin/settings/my-account/notifications";

export type NotificationPrefs = {
  workQueue?: Record<string, { email?: boolean; sms?: boolean; inApp?: boolean }>;
  generalAlerts?: Record<string, { email?: boolean; sms?: boolean; inApp?: boolean }>;
  shiftSchedule?: { dailyDigest?: boolean; endOfDaySummary?: boolean };
};

const WORK_QUEUE_ITEMS = [
  "New job assigned to me",
  "Job priority changed",
  "Job deadline approaching",
  "Customer message on my job",
] as const;

const GENERAL_ALERTS_ITEMS = [
  "New order received",
  "New upload awaiting review",
  "New quote request",
  "Low stock alert",
  "Maintenance due",
] as const;

const defaultPrefs: NotificationPrefs = {
  workQueue: Object.fromEntries(
    WORK_QUEUE_ITEMS.map((label) => [
      label,
      { email: true, sms: true, inApp: true },
    ])
  ),
  generalAlerts: Object.fromEntries(
    GENERAL_ALERTS_ITEMS.map((label) => [
      label,
      { email: false, sms: false, inApp: true },
    ])
  ),
  shiftSchedule: { dailyDigest: false, endOfDaySummary: false },
};

export function MyNotificationsClient() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data: { preferences?: NotificationPrefs | null }) => {
        if (data.preferences && typeof data.preferences === "object") {
          setPrefs({ ...defaultPrefs, ...data.preferences } as NotificationPrefs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateWorkQueue = (
    label: string,
    channel: "email" | "sms" | "inApp",
    value: boolean
  ) => {
    setPrefs((prev) => ({
      ...prev,
      workQueue: {
        ...prev.workQueue,
        [label]: { ...prev.workQueue?.[label], [channel]: value },
      },
    }));
  };

  const updateGeneralAlert = (
    label: string,
    channel: "email" | "sms" | "inApp",
    value: boolean
  ) => {
    setPrefs((prev) => ({
      ...prev,
      generalAlerts: {
        ...prev.generalAlerts,
        [label]: { ...prev.generalAlerts?.[label], [channel]: value },
      },
    }));
  };

  const updateShift = (key: "dailyDigest" | "endOfDaySummary", value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      shiftSchedule: { ...prev.shiftSchedule, [key]: value },
    }));
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading preferences…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="My Work Queue"
        description="When to notify you about assigned jobs."
      >
        <div className="space-y-4">
          {WORK_QUEUE_ITEMS.map((label) => (
            <div key={label} className="flex items-center justify-between">
              <Label>{label}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={prefs.workQueue?.[label]?.email ?? true}
                    onChange={(e) => updateWorkQueue(label, "email", e.target.checked)}
                  />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={prefs.workQueue?.[label]?.sms ?? true}
                    onChange={(e) => updateWorkQueue(label, "sms", e.target.checked)}
                  />
                  SMS
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={prefs.workQueue?.[label]?.inApp ?? true}
                    onChange={(e) => updateWorkQueue(label, "inApp", e.target.checked)}
                  />
                  In-app
                </label>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="General Alerts"
        description="New orders, uploads, quotes, stock, maintenance."
      >
        <div className="space-y-4">
          {GENERAL_ALERTS_ITEMS.map((label) => (
            <div key={label} className="flex items-center justify-between">
              <Label>{label}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={prefs.generalAlerts?.[label]?.email ?? false}
                    onChange={(e) => updateGeneralAlert(label, "email", e.target.checked)}
                  />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={prefs.generalAlerts?.[label]?.sms ?? false}
                    onChange={(e) => updateGeneralAlert(label, "sms", e.target.checked)}
                  />
                  SMS
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={prefs.generalAlerts?.[label]?.inApp ?? true}
                    onChange={(e) => updateGeneralAlert(label, "inApp", e.target.checked)}
                  />
                  In-app
                </label>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Shift & Schedule"
        description="Daily digest and end-of-day summary."
      >
        <div className="flex items-center justify-between">
          <Label>Daily job schedule (morning digest, 7am)</Label>
          <Switch
            checked={prefs.shiftSchedule?.dailyDigest ?? false}
            onCheckedChange={(v) => updateShift("dailyDigest", v)}
          />
        </div>
        <div className="flex items-center justify-between mt-4">
          <Label>End of day summary (6pm)</Label>
          <Switch
            checked={prefs.shiftSchedule?.endOfDaySummary ?? false}
            onCheckedChange={(v) => updateShift("endOfDaySummary", v)}
          />
        </div>
      </SectionCard>

      <div className="flex flex-col gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Preferences"}
        </Button>
        {saved && <p className="text-sm text-green-600 font-medium">Preferences saved.</p>}
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      </div>
    </div>
  );
}
