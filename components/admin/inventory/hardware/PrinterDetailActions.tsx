"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Wrench } from "lucide-react";
import { EditHardwareModal } from "@/components/admin/inventory/hardware/EditHardwareModal";
import { LogMaintenanceModal } from "@/components/admin/inventory/hardware/LogMaintenanceModal";

export function PrinterDetailActions({
  assetId,
  assetName,
  hoursUsedTotal,
}: {
  assetId: string;
  assetName: string;
  hoursUsedTotal: number;
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [fullAsset, setFullAsset] = useState<Record<string, unknown> | null>(null);

  const machineForEdit = fullAsset ?? { id: assetId, name: assetName };
  const machineForLog = { id: assetId, name: assetName, hoursUsedTotal };

  const openEdit = async () => {
    setShowEdit(true);
    try {
      const res = await fetch(`/api/admin/inventory/assets/printers/${assetId}`);
      if (res.ok) {
        const data = await res.json();
        setFullAsset(data);
      }
    } catch {
      setFullAsset(null);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={openEdit} className="gap-2">
          <Pencil className="w-4 h-4" />
          Edit
        </Button>
        <Button size="sm" onClick={() => setShowLog(true)} className="gap-2 bg-[#CC3D00] hover:bg-[#e04400]">
          <Wrench className="w-4 h-4" />
          Log Maintenance
        </Button>
      </div>
      <EditHardwareModal
        machine={machineForEdit as Parameters<typeof EditHardwareModal>[0]["machine"]}
        open={showEdit}
        onClose={() => { setShowEdit(false); setFullAsset(null); }}
        onSaved={() => { setShowEdit(false); setFullAsset(null); router.refresh(); }}
      />
      <LogMaintenanceModal
        machine={machineForLog}
        open={showLog}
        onClose={() => setShowLog(false)}
        onLogged={() => { setShowLog(false); router.refresh(); }}
      />
    </>
  );
}
