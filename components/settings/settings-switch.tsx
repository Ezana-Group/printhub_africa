"use client";

import React, { useId, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsSwitchProps {
  name: string;
  defaultValue?: boolean;
  label?: React.ReactNode;
  className?: string;
}

/**
 * A Switch that participates in form submission via a hidden input.
 * FormData will include name="true"|"false" when the form is submitted.
 */
export function SettingsSwitch({ name, defaultValue = false, label, className }: SettingsSwitchProps) {
  const [checked, setChecked] = useState(defaultValue);
  const generatedId = useId();
  const switchId = name.replace(/[^a-zA-Z0-9-_]/g, "_") || generatedId;

  return (
    <div className={className ? `flex items-center gap-4 ${className}` : "flex items-center gap-4"}>
      <input
        type="hidden"
        name={name}
        value={checked ? "true" : "false"}
        readOnly
        aria-hidden
      />
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={setChecked}
        aria-label={typeof label === "string" ? label : name}
      />
      {label != null && <Label htmlFor={switchId} className="cursor-pointer">{label}</Label>}
    </div>
  );
}
