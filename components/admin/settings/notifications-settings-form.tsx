"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const API = "/api/admin/settings/notifications";
const TEST_EMAIL_API = "/api/admin/settings/notifications/test-email";
const TEST_SMS_API = "/api/admin/settings/notifications/test-sms";

type NotificationsData = Record<string, any>;

export function NotificationsSettingsForm() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [showResendKey, setShowResendKey] = useState(false);
  const [showAtKey, setShowAtKey] = useState(false);
  
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
        description="Configure your Resend API credentials for automated emails."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Resend API Key</Label>
            <div className="relative">
              <Input 
                name="resendApiKey" 
                type={showResendKey ? "text" : "password"} 
                placeholder="••••••••" 
                defaultValue={val("resendApiKey", "")} 
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowResendKey(!showResendKey)}
              >
                {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>From Name</Label>
            <Input name="emailFromName" defaultValue={val("emailFromName", "PrintHub")} />
          </div>
          <div className="grid gap-2">
            <Label>From Email</Label>
            <Input name="emailFrom" defaultValue={val("emailFrom", "hello@printhub.africa")} />
          </div>
          <div className="grid gap-2">
            <Label>Reply-To Email</Label>
            <Input name="emailReplyTo" placeholder="support@printhub.africa" defaultValue={val("emailReplyTo", "")} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleTestEmail} disabled={testEmailLoading}>
            {testEmailLoading ? "Sending…" : "Test Email"}
          </Button>
          {testEmailResult && <span className="text-sm text-muted-foreground">{testEmailResult}</span>}
        </div>
      </SectionCard>

      <SectionCard
        title="SMS (Africa's Talking)"
        description="Configuration for SMS notifications and OTPs via Africa's Talking."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>AT Username</Label>
            <Input name="atUsername" defaultValue={val("atUsername", "sandbox")} />
          </div>
          <div className="grid gap-2">
            <Label>AT API Key</Label>
            <div className="relative">
              <Input 
                name="atApiKey" 
                type={showAtKey ? "text" : "password"} 
                placeholder="••••••••" 
                defaultValue={val("atApiKey", "")} 
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowAtKey(!showAtKey)}
              >
                {showAtKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Sender ID</Label>
            <Input
              name="atSenderId"
              defaultValue={val("atSenderId", "PRINTHUB")}
              placeholder="Max 11 alphanumeric characters"
              maxLength={11}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleTestSms} disabled={testSmsLoading}>
            {testSmsLoading ? "Sending…" : "Test SMS"}
          </Button>
          {testSmsResult && <span className="text-sm text-muted-foreground">{testSmsResult}</span>}
        </div>
      </SectionCard>

      <SectionCard
        title="WhatsApp Business"
        description="Configuration for the floating WhatsApp chat button."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>WhatsApp Number</Label>
            <Input name="whatsappNumber" placeholder="+254 XXX XXX XXX" defaultValue={val("whatsappNumber", "")} />
          </div>
          <div className="grid gap-2">
            <Label>Pre-filled Message</Label>
            <Input name="whatsappPrefilledMessage" placeholder="Hi PrintHub, I'd like to get a quote for..." defaultValue={val("whatsappPrefilledMessage", "")} />
            <p className="text-xs text-muted-foreground">
              Used on the floating button and product pages. Use <code className="rounded bg-muted px-1">{"{{productName}}"}</code> on product pages to insert the product name — e.g. <em>Hi PrintHub! I&apos;m interested in {"{{"} productName {"}}"}. Can I get more details?</em>
            </p>
          </div>
          <div className="pt-2">
            <SettingsSwitch 
              name="whatsappFloatingButton" 
              defaultValue={bool("whatsappFloatingButton", true)} 
              label="Enable floating WhatsApp button" 
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Admin Alert Notifications"
        description="Choose where admin alerts should be sent."
      >
        <div className="grid gap-2">
          <Label>Admin Alert Email</Label>
          <Input name="adminAlertEmail" placeholder="admin@printhub.africa" defaultValue={val("adminAlertEmail", "")} />
          <p className="text-xs text-muted-foreground">Alerts for critical system events will be sent here.</p>
        </div>
      </SectionCard>

      <SettingsSaveButton formId="settings-notifications" action={API} />
    </form>
  );
}
