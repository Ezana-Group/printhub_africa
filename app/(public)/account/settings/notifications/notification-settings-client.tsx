"use client";

import { useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";

const ORDER_EVENTS = [
  "Order confirmed",
  "Payment received",
  "Production started",
  "Order shipped",
  "Order delivered",
  "Order cancelled",
  "Refund processed",
] as const;

const QUOTE_EVENTS = [
  "Quote ready to review",
  "Quote expiring soon",
  "File review complete",
  "File needs correction",
] as const;

const ACCOUNT_EVENTS = [
  "Payment reminder",
  "Invoice available",
  "Loyalty points earned",
  "Account security alerts (cannot disable)",
] as const;

const MARKETING_EVENTS = [
  "New products & services",
  "Special offers & discounts",
  "PrintHub news & updates",
] as const;

function EventRow({
  label,
  email = true,
  sms = false,
  whatsapp = false,
  security = false,
}: {
  label: string;
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
  security?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 py-2 border-b last:border-0">
      <span className="w-48 text-sm">{label}</span>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked={email} disabled={security} className="rounded" />
        Email
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked={sms} disabled={security} className="rounded" />
        SMS
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" defaultChecked={whatsapp} disabled={security} className="rounded" />
        WhatsApp
      </label>
    </div>
  );
}

export function NotificationSettingsClient({ initialSmsOptIn }: { initialSmsOptIn: boolean }) {
  const [saved, setSaved] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(initialSmsOptIn);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSmsToggle = async (val: boolean) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsMarketingOptIn: val }),
      });
      if (res.ok) {
        setSmsOptIn(val);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="AI-Powered Marketing"
        description="Receive curated weekly trends and product spotlight via SMS."
      >
        <div className="flex items-center justify-between py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Weekly AI Product Spotlight</p>
            <p className="text-xs text-muted-foreground">Personalized picks based on your interests and Nairobi trends.</p>
          </div>
          <div className="flex items-center gap-3">
             <span className={smsOptIn ? "text-indigo-600 font-bold text-xs" : "text-zinc-400 text-xs"}>
               {smsOptIn ? "OPTED IN" : "DISABLED"}
             </span>
             <input 
               type="checkbox" 
               checked={smsOptIn} 
               onChange={(e) => handleSmsToggle(e.target.checked)}
               disabled={isUpdating}
               className="w-10 h-5 rounded-full appearance-none bg-zinc-200 checked:bg-indigo-600 transition-all cursor-pointer relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all checked:after:translate-x-5"
             />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Order Updates"
        description="When to notify you about order status."
      >
        <div className="space-y-0">
          {ORDER_EVENTS.map((event) => (
            <EventRow key={event} label={event} email sms />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Quotes & Files"
        description="Quote and file review notifications."
      >
        <div className="space-y-0">
          {QUOTE_EVENTS.map((event) => (
            <EventRow key={event} label={event} email sms />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Account & Payments"
        description="Invoices and security alerts."
      >
        <div className="space-y-0">
          {ACCOUNT_EVENTS.map((event) => (
            <EventRow
              key={event}
              label={event}
              email
              sms={event === "Account security alerts (cannot disable)"}
              security={event === "Account security alerts (cannot disable)"}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Marketing & Promotions"
        description="We'll never sell your contact details or spam you."
      >
        <div className="space-y-0">
          {MARKETING_EVENTS.map((event) => (
            <EventRow key={event} label={event} />
          ))}
        </div>
        <Button type="button" variant="link" size="sm" className="p-0 h-auto">
          Unsubscribe from all marketing
        </Button>
      </SectionCard>

      <SectionCard
        title="SMS & WhatsApp Numbers"
        description="These can differ from your account phone number."
      >
        <p className="text-sm text-muted-foreground">
          SMS: +254 XXX XXX XXX <Button type="button" variant="link" size="sm">Edit</Button>
        </p>
        <p className="text-sm text-muted-foreground">
          WhatsApp: +254 XXX XXX XXX <Button type="button" variant="link" size="sm">Edit</Button>
        </p>
      </SectionCard>

      <Button
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        Save Preferences
      </Button>
      {saved && (
        <p className="text-sm text-green-600 font-medium">✓ Saved</p>
      )}
    </div>
  );
}
