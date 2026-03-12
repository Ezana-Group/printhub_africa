"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_PAYBILL = "522522";
const DEFAULT_TILL = "123456";

export function MpesaPaybillTillFields() {
  const [paybill, setPaybill] = useState(DEFAULT_PAYBILL);
  const [till, setTill] = useState(DEFAULT_TILL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/settings/payments")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.mpesaPaybillNumber === "string" && data.mpesaPaybillNumber.trim()) {
          setPaybill(data.mpesaPaybillNumber.trim());
        }
        if (typeof data.mpesaTillNumber === "string" && data.mpesaTillNumber.trim()) {
          setTill(data.mpesaTillNumber.trim());
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-2">
        <Label>Paybill number</Label>
        <Input name="mpesaPaybillNumber" defaultValue={DEFAULT_PAYBILL} placeholder={DEFAULT_PAYBILL} className="font-mono" maxLength={20} />
        <Label>Till number</Label>
        <Input name="mpesaTillNumber" defaultValue={DEFAULT_TILL} placeholder={DEFAULT_TILL} className="font-mono" maxLength={20} />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label>Paybill number (Business No. shown to customers)</Label>
      <Input
        name="mpesaPaybillNumber"
        value={paybill}
        onChange={(e) => setPaybill(e.target.value.replace(/\D/g, "").slice(0, 20))}
        placeholder={DEFAULT_PAYBILL}
        className="font-mono"
        maxLength={20}
      />
      <Label>Till number (if using Lipa na M-Pesa Till)</Label>
      <Input
        name="mpesaTillNumber"
        value={till}
        onChange={(e) => setTill(e.target.value.replace(/\D/g, "").slice(0, 20))}
        placeholder={DEFAULT_TILL}
        className="font-mono"
        maxLength={20}
      />
    </div>
  );
}
