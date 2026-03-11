"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DangerAction = {
  id: string;
  title: string;
  description: string;
  confirmLabel: string;
  bodyLabel?: string;
};

const ACTIONS: DangerAction[] = [
  {
    id: "reset-pricing",
    title: "Reset All Pricing to Defaults",
    description: "Restores all pricing rates to system defaults. All custom rates will be lost.",
    confirmLabel: "Reset Pricing",
  },
  {
    id: "clear-drafts",
    title: "Clear All Draft Quotes",
    description: "Permanently deletes all quotes in DRAFT status.",
    confirmLabel: "Clear Draft Quotes",
  },
  {
    id: "reset-counter",
    title: "Reset Quote Counter",
    description: "Resets the quote number sequence. Only when starting fresh.",
    confirmLabel: "Reset Counter",
  },
  {
    id: "anonymise",
    title: "Anonymise Customer Data",
    description: "GDPR/PDPA compliance. Anonymises personal data for deletion requests. Orders retained.",
    confirmLabel: "Anonymise Data",
  },
  {
    id: "export",
    title: "Export All Data",
    description: "Full database export — orders, customers, products, settings. ZIP download. Handle with care.",
    confirmLabel: "Export All Data",
  },
  {
    id: "factory",
    title: "Factory Reset",
    description: "NUCLEAR OPTION. Wipes ALL data except SUPER_ADMIN account. No undo. Requires: type DELETE EVERYTHING + password + 2FA + 24hr delay.",
    confirmLabel: "Factory Reset",
    bodyLabel: "Type CONFIRM to proceed",
  },
];

export function DangerZoneActions() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (id: string) => {
    void id;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setOpenId(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {ACTIONS.map((action) => (
        <div key={action.id}>
          <SectionPlaceholder
            title={action.title}
            description={action.description}
            confirmLabel={action.confirmLabel}
            onConfirm={() => setOpenId(action.id)}
          />
          <AlertDialog open={openId === action.id} onOpenChange={(open) => !open && setOpenId(null)}>
            <AlertDialogContent className="border-destructive/50">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">{action.title}</AlertDialogTitle>
                <AlertDialogDescription>{action.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirm(action.id);
                  }}
                  disabled={loading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading ? "Processing…" : action.confirmLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </>
  );
}

function SectionPlaceholder({
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-6">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <Button type="button" variant="destructive" className="mt-4" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  );
}
