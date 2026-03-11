"use client";

import { useState } from "react";
import { AdminPrintCalculator } from "./AdminPrintCalculator";
import { AdminLFCalculator } from "./AdminLFCalculator";

export function QuoteCalculatorTab() {
  const [subTab, setSubTab] = useState<"large-format" | "3d-printing">("large-format");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setSubTab("large-format")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            subTab === "large-format"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Large format
        </button>
        <button
          type="button"
          onClick={() => setSubTab("3d-printing")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            subTab === "3d-printing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          3D printing
        </button>
      </div>
      {subTab === "large-format" && <AdminLFCalculator />}
      {subTab === "3d-printing" && <AdminPrintCalculator />}
    </div>
  );
}
