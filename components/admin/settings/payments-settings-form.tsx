"use client";

import { useEffect, useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSaveButton } from "@/components/settings/settings-save-button";
import { SettingsSwitch } from "@/components/settings/settings-switch";
import { Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { MpesaPaybillTillFields } from "@/components/settings/mpesa-paybill-till-fields";

const API = "/api/admin/settings/payments";
const TEST_MPESA_API = "/api/admin/settings/payments/test-mpesa";
const TEST_PESAPAL_API = "/api/admin/settings/payments/test-pesapal";

export function PaymentsSettingsForm() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [showMpesaPasskey, setShowMpesaPasskey] = useState(false);
  const [showMpesaKey, setShowMpesaKey] = useState(false);
  const [showMpesaSecret, setShowMpesaSecret] = useState(false);
  const [showPesapalKey, setShowPesapalKey] = useState(false);
  const [showPesapalSecret, setShowPesapalSecret] = useState(false);

  const [testMpesaLoading, setTestMpesaLoading] = useState(false);
  const [testPesapalLoading, setTestPesapalLoading] = useState(false);
  const [testMpesaResult, setTestMpesaResult] = useState<string | null>(null);
  const [testPesapalResult, setTestPesapalResult] = useState<string | null>(null);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => setData(typeof d === "object" && d !== null ? d : {}))
      .catch(() => setData({}));
  }, []);

  if (data === null) {
    return (
      <p className="text-sm text-muted-foreground py-4 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment settings…
      </p>
    );
  }

  const val = (k: string, def: any = "") => (data[k] != null ? String(data[k]) : def);
  const bool = (k: string, def: boolean) =>
    data[k] === true || data[k] === "true" ? true : data[k] === false || data[k] === "false" ? false : def;

  const handleTestMpesa = async () => {
    const phone = window.prompt("Enter phone number for test STK Push (e.g. 254712345678):");
    if (!phone) return;
    
    setTestMpesaResult(null);
    setTestMpesaLoading(true);
    try {
      const res = await fetch(TEST_MPESA_API, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ phone }) 
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestMpesaResult(result.message ?? "STK Push sent.");
      } else {
        setTestMpesaResult(result.error ?? "Failed to send.");
      }
    } catch {
      setTestMpesaResult("Request failed.");
    } finally {
      setTestMpesaLoading(false);
    }
  };

  const handleTestPesapal = async () => {
    setTestPesapalResult(null);
    setTestPesapalLoading(true);
    try {
      const res = await fetch(TEST_PESAPAL_API, { method: "POST" });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestPesapalResult(`Valid (${result.env})`);
      } else {
        setTestPesapalResult(result.error ?? "Failed.");
      }
    } catch {
      setTestPesapalResult("Request failed.");
    } finally {
      setTestPesapalLoading(false);
    }
  };

  return (
    <form id="settings-payments" className="space-y-6">
      <SectionCard
        title="M-Pesa (Daraja API)"
        description="Configuration for automated STK Push payments via Safaricom Daraja."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Environment</Label>
            <select 
              name="mpesaEnvironment" 
              defaultValue={val("mpesaEnvironment", "sandbox")}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Business Short Code</Label>
              <Input name="mpesaShortCode" defaultValue={val("mpesaShortCode", "")} placeholder="e.g. 174379" />
            </div>
            <div className="grid gap-2">
              <Label>LNM Passkey</Label>
              <div className="relative">
                <Input 
                  name="mpesaPasskey" 
                  type={showMpesaPasskey ? "text" : "password"} 
                  placeholder="••••••••" 
                  defaultValue={val("mpesaPasskey", "")} 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowMpesaPasskey(!showMpesaPasskey)}
                >
                  {showMpesaPasskey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Consumer Key</Label>
            <div className="relative">
              <Input 
                name="mpesaConsumerKey" 
                type={showMpesaKey ? "text" : "password"} 
                placeholder="••••••••" 
                defaultValue={val("mpesaConsumerKey", "")} 
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowMpesaKey(!showMpesaKey)}
              >
                {showMpesaKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Consumer Secret</Label>
            <div className="relative">
              <Input 
                name="mpesaConsumerSecret" 
                type={showMpesaSecret ? "text" : "password"} 
                placeholder="••••••••" 
                defaultValue={val("mpesaConsumerSecret", "")} 
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowMpesaSecret(!showMpesaSecret)}
              >
                {showMpesaSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleTestMpesa} disabled={testMpesaLoading}>
            {testMpesaLoading ? "Testing…" : "Test STK Push"}
          </Button>
          {testMpesaResult && <span className="text-sm text-muted-foreground">{testMpesaResult}</span>}
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <Label className="text-base font-semibold">Manual M-Pesa Details</Label>
          <p className="text-xs text-muted-foreground mb-4">Shown to customers when automated payment is unavailable.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Paybill Number</Label>
              <Input name="mpesaPaybillNumber" defaultValue={val("mpesaPaybillNumber", "")} placeholder="e.g. 400200" />
            </div>
            <div className="grid gap-2">
              <Label>Till Number</Label>
              <Input name="mpesaTillNumber" defaultValue={val("mpesaTillNumber", "")} placeholder="e.g. 123456" />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard 
        title="PesaPal v3" 
        description="Used for Credit/Debit Cards and secondary Mobile Money options."
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Environment</Label>
            <select 
              name="pesapalEnvironment" 
              defaultValue={val("pesapalEnvironment", "sandbox")}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Consumer Key</Label>
            <div className="relative">
              <Input 
                name="pesapalConsumerKey" 
                type={showPesapalKey ? "text" : "password"} 
                placeholder="••••••••" 
                defaultValue={val("pesapalConsumerKey", "")} 
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPesapalKey(!showPesapalKey)}
              >
                {showPesapalKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Consumer Secret</Label>
            <div className="relative">
              <Input 
                name="pesapalConsumerSecret" 
                type={showPesapalSecret ? "text" : "password"} 
                placeholder="••••••••" 
                defaultValue={val("pesapalConsumerSecret", "")} 
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPesapalSecret(!showPesapalSecret)}
              >
                {showPesapalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleTestPesapal} disabled={testPesapalLoading}>
            {testPesapalLoading ? "Verifying…" : "Verify Credentials"}
          </Button>
          {testPesapalResult && <span className="text-sm text-muted-foreground">{testPesapalResult}</span>}
        </div>
      </SectionCard>

      <SectionCard title="Bank Transfer" description="Show bank details for large orders.">
        <div className="grid gap-4">
          <SettingsSwitch 
            name="bankTransferEnabled" 
            defaultValue={bool("bankTransferEnabled", false)} 
            label="Enable manual bank transfer" 
          />
          <div className="grid gap-2">
            <Label>Minimal Threshold (KES)</Label>
            <Input name="bankTransferThreshold" type="number" defaultValue={val("bankTransferThreshold", "5000")} />
          </div>
          <div className="grid gap-2">
            <Label>Bank Details (Instructions)</Label>
            <textarea 
              name="bankTransferDetails" 
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={val("bankTransferDetails", "")}
              placeholder="e.g. Pay to: PrintHub Africa, bank: KCB, Acc: 123456..."
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Checkout Configuration" description="Global checkout rules and invoice settings.">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Minimum Order Value (KES)</Label>
            <Input name="minimumOrderValue" type="number" defaultValue={val("minimumOrderValue", "500")} />
          </div>
          <div className="grid gap-2">
            <Label>Order Timeout (Minutes)</Label>
            <Input name="paymentTimeoutMinutes" type="number" defaultValue={val("paymentTimeoutMinutes", "30")} />
          </div>
          <div className="grid gap-2">
            <Label>Quote Prefix</Label>
            <Input name="quotePrefix" defaultValue={val("quotePrefix", "PHUB-QT-")} />
          </div>
          <div className="grid gap-2">
            <Label>Invoice Due Days</Label>
            <Input name="invoiceDueDays" type="number" defaultValue={val("invoiceDueDays", "30")} />
          </div>
        </div>
        <div className="pt-4">
          <SettingsSwitch 
            name="guestCheckoutEnabled" 
            defaultValue={bool("guestCheckoutEnabled", true)} 
            label="Allow guest checkout (no account required)" 
          />
        </div>
      </SectionCard>

      <SettingsSaveButton formId="settings-payments" action={API} />
    </form>
  );
}
