"use client";

import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";

export function PaymentMethodsClient() {
  const hasCorporate = false;

  return (
    <div className="space-y-6">
      <SectionCard
        title="M-Pesa Numbers"
        description="Save your M-Pesa number for one-tap payments. Max 2 numbers."
      >
        <p className="text-sm text-muted-foreground">No M-Pesa number saved.</p>
        <Button type="button" variant="outline" size="sm">
          + Add M-Pesa Number
        </Button>
      </SectionCard>

      <SectionCard
        title="Saved Cards"
        description="Visa/Mastercard via Pesapal or Stripe. No raw card data stored. Max 3 cards."
      >
        <p className="text-sm text-muted-foreground">No saved cards.</p>
        <Button type="button" variant="outline" size="sm">
          + Add New Card
        </Button>
      </SectionCard>

      {hasCorporate && (
        <SectionCard
          title="Corporate / Invoice Billing"
          description="Your account is set up for invoice billing."
        >
          <p className="text-sm">Payment terms: NET-30</p>
          <p className="text-sm">Credit limit: KES 500,000</p>
          <p className="text-sm">Current balance: KES 0</p>
          <Button type="button" variant="link" size="sm" asChild>
            <a href="/account/orders">View invoices</a>
          </Button>
        </SectionCard>
      )}
    </div>
  );
}
