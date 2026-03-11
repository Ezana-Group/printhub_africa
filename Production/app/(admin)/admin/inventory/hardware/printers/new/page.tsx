import Link from "next/link";
import { RegisterPrinterForm } from "@/components/admin/register-printer-form";

export default function NewPrinterPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/admin/inventory/hardware/printers" className="text-sm text-primary hover:underline">
          ← Back to Printers & Machines
        </Link>
        <h1 className="font-display text-2xl font-bold mt-1">Register new printer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a printer asset for full lifecycle tracking (hours, maintenance, cost per hour).
        </p>
      </div>

      <RegisterPrinterForm />
    </div>
  );
}
