"use client";

import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Wrench,
  History,
  Trash2,
  Eye,
  Power,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Machine = {
  id: string;
  name: string;
  status: string;
  _count?: { maintenanceLogs?: number; productionJobs?: number };
};

interface HardwareActionsMenuProps {
  machine: Machine;
  onLogMaintenance: (machine: Machine) => void;
  onEdit: (machine: Machine) => void;
  onDelete: (machine: Machine) => void;
  onToggleStatus?: (machine: Machine) => void;
  /** Call when dropdown is used so parent can prevent navigation (e.g. card link) */
  onInteraction?: () => void;
}

export function HardwareActionsMenu({
  machine,
  onLogMaintenance,
  onEdit,
  onDelete,
  onToggleStatus,
  onInteraction,
}: HardwareActionsMenuProps) {
  const router = useRouter();

  const handleToggleStatus = () => {
    onInteraction?.();
    if (onToggleStatus) {
      onToggleStatus(machine);
    } else {
      // Fallback: navigate to detail and user can edit status there
      router.push(`/admin/inventory/hardware/printers/${machine.id}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onInteraction?.();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => {
            onInteraction?.();
            router.push(`/admin/inventory/hardware/printers/${machine.id}`);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Eye className="w-4 h-4 text-gray-400" />
          <span>View details</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onInteraction?.();
            onEdit(machine);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Pencil className="w-4 h-4 text-gray-400" />
          <span>Edit hardware</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onInteraction?.();
            onLogMaintenance(machine);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Wrench className="w-4 h-4 text-gray-400" />
          <span>Log maintenance</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            onInteraction?.();
            router.push(`/admin/inventory/hardware/printers/${machine.id}?tab=maintenance`);
          }}
          className="flex items-center gap-2 cursor-pointer"
        >
          <History className="w-4 h-4 text-gray-400" />
          <span>View history</span>
        </DropdownMenuItem>
        {onToggleStatus && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onInteraction?.();
                handleToggleStatus();
              }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Power className="w-4 h-4 text-gray-400" />
              <span>
                {machine.status === "ACTIVE"
                  ? "Mark as in maintenance"
                  : machine.status === "IN_MAINTENANCE"
                    ? "Mark as active"
                    : "Change status"}
              </span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onInteraction?.();
            onDelete(machine);
          }}
          className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete hardware</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
