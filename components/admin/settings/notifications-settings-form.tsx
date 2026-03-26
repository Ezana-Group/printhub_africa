"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { Loader2 } from "lucide-react";

const API = "/api/admin/settings/notifications";
const TEST_EMAIL_API = "/api/admin/settings/notifications/test-email";
const TEST_SMS_API = "/api/admin/settings/notifications/test-sms";

type NotificationsData = Record<string, string | boolean>;

export function NotificationsSettingsForm() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [testSmsResult, setTestSmsResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => setData(typeof d === "object" && d !== null ? d : {}))
      .catch(() => setData({}));
  }, []);

  if (data === null) {
    return (
      <p className="text-sm text-muted-foreground py-4 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  const val = (k: string, def: string) => (data[k] != null ? String(data[k]) : def);
  const bool = (k: string, def: boolean) =>
    data[k] === true || data[k] === "true" ? true : data[k] === false || data[k] === "false" ? false : def;

  const handleTestEmail = async () => {
    setTestEmailResult(null);
    setTestEmailLoading(true);
    try {
      const res = await fetch(TEST_EMAIL_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestEmailResult(result.message ?? "Test email sent.");
      } else {
        setTestEmailResult(result.error ?? "Failed to send.");
      }
    } catch {
      setTestEmailResult("Request failed.");
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleTestSms = async () => {
    setTestSmsResult(null);
    setTestSmsLoading(true);
    try {
      const res = await fetch(TEST_SMS_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestSmsResult(result.message ?? "Test SMS sent.");
      } else {
        setTestSmsResult(result.error ?? "Failed to send.");
      }
    } catch {
      setTestSmsResult("Request failed.");
    } finally {
      setTestSmsLoading(false);
    }
  };

  return (
    <form id="settings-notifications" className="space-y-6">
      <SectionCard
        title="Email (Resend)"
        description="From name, from email, API key. Must be verified domain."
      >
        <div className="grid gap-2">
          <Label>Resend API Key</Label>
          <Input name="resendApiKey" type="password" placeholder="••••••••" defaultValue={val("resendApiKey", "")} />
          <Label>From Name</Label>
          <Input name="emailFromName" defaultValue={val("emailFromName", "PrintHub")} />
          <Label>From Email</Label>
          <Input name="emailFrom" defaultValue={val("emailFrom", "hello@printhub.africa")} />
          <Label>Reply-To</Label>
          <Input name="emailReplyTo" placeholder="contact@printhub.africa" defaultValue={val("emailReplyTo", "")} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleTestEmail} disabled={testEmailLoading}>
            {testEmailLoading ? "Sending…" : "Test Email"}
          </Button>
          {testEmailResult && <span className="text-sm text-muted-foreground">{testEmailResult}</span>}
        </div>
      </SectionCard>
      <SectionCard
        title="SMS (Africa's Talking)"
        description="API Key, Username, Sender ID (max 11 chars)."
      >
        <div className="grid gap-2">
          <Label>API Key / Username</Label>
          <Input name="smsApiKey" type="password" placeholder="••••••••" defaultValue={val("smsApiKey", "")} />
          <Label>Sender ID</Label>
          <Input
            name="smsSenderId"
            defaultValue={val("smsSenderId", "PrintHub")}
            placeholder="Max 11 characters"
            maxLength={11}
            aria-label="Sender ID (max 11 characters)"
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleTestSms} disabled={testSmsLoading}>
            {testSmsLoading ? "Sending…" : "Test SMS"}
          </Button>
          {testSmsResult && <span className="text-sm text-muted-foreground">{testSmsResult}</span>}
        </div>
      </SectionCard>
      <SectionCard
        title="WhatsApp Business"
        description="Number and pre-filled message for website button."
      >
        <div className="grid gap-2">
          <Label>WhatsApp Number</Label>
          <Input name="whatsappNumber" placeholder="+254 XXX XXX XXX" defaultValue={val("whatsappNumber", "")} />
          <Label>Pre-filled message</Label>
          <Input name="whatsappMessage" placeholder="Hi PrintHub, I'd like to get a quote for..." defaultValue={val("whatsappMessage", "")} />
        </div>
        <div className="flex items-center gap-4 mt-4">
          <SettingsSwitch name="whatsappFloatingButton" defaultValue={bool("whatsappFloatingButton", true)} label="Show WhatsApp floating button on all pages" />
        </div>
      </SectionCard>
      <SectionCard
        title="Admin Email Alerts"
        description="Which events send an email to admin."
      >
        <p className="text-sm text-muted-foreground">
          New order, payment received/failed, new upload, quote request, quote accepted, cancellation, refund, corporate application, low stock, maintenance, support ticket, negative review.
        </p>
        <div className="grid gap-2 mt-4">
          <Label>Admin alert email</Label>
          <Input name="adminAlertEmail" placeholder="admin@printhub.africa" defaultValue={val("adminAlertEmail", "")} />
        </div>
      </SectionCard>
      <SectionCard
        title="Customer Communication Templates"
        description="Preview and test automated emails."
      >
        <p className="text-sm text-muted-foreground">
          Welcome, Order Confirmation, Payment Received, Order Shipped, Quote Ready, Quote Expiring, File Review Complete, Abandoned Cart. [Preview] [Send Test] per template.
        </p>
      </SectionCard>
      <SettingsSaveButton formId="settings-notifications" action={API} />
    </form>
  );
}
