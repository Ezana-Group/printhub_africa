import { requireAdminSettings } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";

function getStr(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : "";
}

export default async function AdminSettingsBusinessPage() {
  await requireAdminSettings();
  // AUDIT FIX: Load saved business settings so form pre-fills and re-load shows updated data
  const row = await prisma.pricingConfig.findUnique({
    where: { key: "adminSettings:business" },
  });
  const saved: Record<string, unknown> = row?.valueJson
    ? (JSON.parse(row.valueJson) as Record<string, unknown>)
    : {};
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Business Profile</h1>
      <form id="settings-business" className="space-y-6">
      <SectionCard
        title="Identity"
        description="Appears on invoices, quotes, emails, and the website."
      >
        <div className="grid gap-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input id="businessName" name="businessName" defaultValue={getStr(saved, "businessName") || "PrintHub"} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tradingName">Trading Name</Label>
          <Input id="tradingName" name="tradingName" defaultValue={getStr(saved, "tradingName") || "PrintHub (An Ezana Group Company)"} />
        </div>
        <div className="grid gap-2">
          <Label>Logo</Label>
          <p className="text-sm text-muted-foreground">Min 400×400px, PNG. Current logo preview.</p>
          <Button type="button" variant="outline" size="sm">Upload</Button>
        </div>
        <div className="grid gap-2">
          <Label>Favicon</Label>
          <Input name="favicon" placeholder="32×32px ICO or PNG" defaultValue={getStr(saved, "favicon")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" name="tagline" defaultValue={getStr(saved, "tagline") || "Professional Printing. Nairobi. Kenya."} />
        </div>
        <div className="grid gap-2">
          <Label>Website</Label>
          <Input name="website" defaultValue={getStr(saved, "website") || "printhub.africa"} readOnly className="bg-muted" />
        </div>
      </SectionCard>
      <SectionCard
        title="Contact & Location"
        description="Primary contact and physical address."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div><Label>Primary Phone *</Label><Input name="primaryPhone" placeholder="+254 XXX XXX XXX" defaultValue={getStr(saved, "primaryPhone")} /></div>
          <div><Label>WhatsApp Business *</Label><Input name="whatsapp" placeholder="+254 XXX XXX XXX" defaultValue={getStr(saved, "whatsapp")} /></div>
          <div><Label>Primary Email *</Label><Input name="primaryEmail" defaultValue={getStr(saved, "primaryEmail") || "hello@printhub.africa"} /></div>
          <div><Label>Support Email</Label><Input name="supportEmail" placeholder="support@printhub.africa" defaultValue={getStr(saved, "supportEmail")} /></div>
          <div><Label>Finance/Invoices Email</Label><Input name="financeEmail" placeholder="finance@printhub.africa" defaultValue={getStr(saved, "financeEmail")} /></div>
        </div>
        <div className="grid gap-2">
          <Label>Physical Address Line 1</Label>
          <Input name="address1" defaultValue={getStr(saved, "address1")} />
          <Label>Physical Address Line 2</Label>
          <Input name="address2" defaultValue={getStr(saved, "address2")} />
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Town/City</Label><Input name="city" defaultValue={getStr(saved, "city") || "Nairobi"} /></div>
            <div><Label>County</Label><Input name="county" defaultValue={getStr(saved, "county") || "Nairobi County"} /></div>
          </div>
          <Label>Country</Label>
          <Input name="country" defaultValue={getStr(saved, "country") || "Kenya"} readOnly className="bg-muted" />
          <Label>Google Maps URL</Label>
          <Input name="googleMapsUrl" placeholder="Paste link for contact page" defaultValue={getStr(saved, "googleMapsUrl")} />
        </div>
      </SectionCard>
      <SectionCard
        title="Business Hours"
        description="Shown on contact page and used for quote response time estimates."
      >
        <p className="text-sm text-muted-foreground">Mon–Fri 08:00–18:00 ✓ Open | Sat 09:00–15:00 ✓ Open | Sun Closed</p>
        <Button type="button" variant="outline" size="sm">Edit hours</Button>
      </SectionCard>
      <SectionCard
        title="Legal & Compliance"
        description="KRA PIN and VAT on all invoices."
      >
        <div className="grid gap-2">
          <Label>Registered Business Name</Label>
          <Input name="registeredName" defaultValue={getStr(saved, "registeredName")} />
          <Label>Business Registration No</Label>
          <Input name="registrationNo" defaultValue={getStr(saved, "registrationNo")} />
          <Label>KRA PIN *</Label>
          <Input name="kraPin" defaultValue={getStr(saved, "kraPin")} />
          <Label>VAT Registration No</Label>
          <Input name="vatNo" defaultValue={getStr(saved, "vatNo")} />
          <Label>Parent Company</Label>
          <Input name="parentCompany" defaultValue={getStr(saved, "parentCompany") || "Ezana Group"} readOnly className="bg-muted" />
        </div>
      </SectionCard>
      <SectionCard title="Social Media" description="Links for website and Instagram feed.">
        <div className="grid gap-2">
          {[
            { label: "Facebook", name: "socialFacebook" },
            { label: "Instagram", name: "socialInstagram" },
            { label: "Twitter/X", name: "socialTwitter" },
            { label: "LinkedIn", name: "socialLinkedIn" },
            { label: "TikTok", name: "socialTikTok" },
            { label: "YouTube", name: "socialYouTube" },
          ].map(({ label, name: inputName }) => (
            <div key={inputName} className="flex gap-2">
              <Label className="w-24">{label} URL</Label>
              <Input name={inputName} className="flex-1" placeholder="https://..." defaultValue={getStr(saved, inputName)} />
            </div>
          ))}
        </div>
      </SectionCard>
      <SettingsSaveButton formId="settings-business" action="/api/admin/settings/business" />
      </form>
    </div>
  );
}
