"use client";

import React, { useId, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsSwitchProps {
  name: string;
  defaultValue?: boolean;
  label?: React.ReactNode;
  className?: string;
  onChange?: (checked: boolean) => void;
}

/**
 * A Switch that participates in form submission via a hidden input or via onChange callback.
 */
export function SettingsSwitch({ name, defaultValue = false, label, className, onChange }: SettingsSwitchProps) {
  const [checked, setChecked] = useState(defaultValue);
  const generatedId = useId();
  const switchId = name.replace(/[^a-zA-Z0-9-_]/g, "_") || generatedId;

  const handleCheckedChange = (newChecked: boolean) => {
    setChecked(newChecked);
    if (onChange) onChange(newChecked);
  };

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
        onCheckedChange={handleCheckedChange}
        aria-label={typeof label === "string" ? label : name}
      />
      {label != null && <Label htmlFor={switchId} className="cursor-pointer">{label}</Label>}
    </div>
  );
}
