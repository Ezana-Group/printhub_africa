"use client";

import { useState } from "react";
import { SectionCard } from "@/components/settings/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  type SelectOption,
} from "@/components/ui/select";
import { KENYA_COUNTIES } from "@/lib/constants/kenya-counties";

const COUNTY_OPTIONS: SelectOption[] = KENYA_COUNTIES.map((c) => ({
  value: c,
  label: c,
}));

export function AddressesSettingsClient() {
  const [showForm, setShowForm] = useState(false);

  // Placeholder: no addresses yet
  const addresses: { id: string; label: string; isDefault: boolean }[] = [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-base font-bold">Your addresses</h2>
        <Button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={addresses.length >= 5}
        >
          + Add New Address
        </Button>
      </div>

      {showForm && (
        <SectionCard
          title="Add New Address"
          description="All fields marked * are required."
        >
          <form className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                name="label"
                placeholder="Home, Work, Other"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+254 XXX XXX XXX"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address1">Address Line 1 *</Label>
              <Input id="address1" name="street" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input id="address2" name="address2" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Town/City *</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="county">County *</Label>
              <Select
                id="county"
                name="county"
                options={COUNTY_OPTIONS}
                placeholder="Select county..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" name="postalCode" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Textarea
                id="deliveryNotes"
                name="deliveryNotes"
                placeholder="e.g. Leave at gate"
              />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isDefault" className="rounded" />
              <span className="text-sm">Set as default delivery address</span>
            </label>
            <div className="flex gap-2">
              <Button type="submit">Save Address</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SectionCard>
      )}

      {addresses.length === 0 && !showForm && (
        <SectionCard title="No saved addresses">
          <p className="text-sm text-muted-foreground">
            Add an address to speed up checkout.
          </p>
        </SectionCard>
      )}

      {addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <SectionCard key={addr.id} title={`${addr.label} ${addr.isDefault ? "★ DEFAULT" : ""}`}>
              <p className="text-sm">Nairobi County</p>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="outline" size="sm">
                  Edit
                </Button>
                <Button type="button" variant="ghost" size="sm">
                  Delete
                </Button>
                {!addr.isDefault && (
                  <Button type="button" variant="ghost" size="sm">
                    Set as Default
                  </Button>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
