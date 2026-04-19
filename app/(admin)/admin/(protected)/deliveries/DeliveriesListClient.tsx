"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Truck, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MoreHorizontal,
  Plus,
  ExternalLink
} from "lucide-react";
import { TableToolbar, type FilterConfig } from "@/components/admin/ui/TableToolbar";
import { TablePagination } from "@/components/admin/ui/TablePagination";
import { TableEmptyState } from "@/components/admin/ui/TableEmptyState";
import { useTableUrlState } from "@/hooks/useTableUrlState";
import { toast } from "sonner";

type DeliveryRow = {
  id: string;
  orderId: string;
  order: {
    orderNumber: string;
    shippingAddress: { fullName: string; email: string; phone: string } | null;
    user: { name: string | null; email: string } | null;
  } | null;
  status: "PENDING" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  method: string | null;
  trackingNumber: string | null;
  estimatedDelivery: Date | null;
  deliveryZone: { name: string } | null;
  assignedCourier: { id: string; name: string } | null;
};

type Courier = {
  id: string;
  name: string;
};

export function DeliveriesListClient({
  deliveries: initialDeliveries,
  couriers,
  counts,
}: {
  deliveries: DeliveryRow[];
  couriers: Courier[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const url = useTableUrlState({ defaultPerPage: 25 });
  const statusFilter = url.get("status", "");
  
  // Dialog States
  const [trackingModal, setTrackingModal] = useState<{ id: string; current: string } | null>(null);
  const [courierModal, setCourierModal] = useState<{ id: string; currentId: string | null } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters & Sorting
  const filteredAndSorted = useMemo(() => {
    let list = [...initialDeliveries];
    const q = url.q.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (d) =>
          d.order?.orderNumber.toLowerCase().includes(q) ||
          d.order?.shippingAddress?.fullName.toLowerCase().includes(q) ||
          d.order?.shippingAddress?.email.toLowerCase().includes(q) ||
          d.trackingNumber?.toLowerCase().includes(q) ||
          d.order?.user?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((d) => d.status === statusFilter);
    
    // Sort by most recent
    list.sort((a, b) => new Date(b.estimatedDelivery || 0).getTime() - new Date(a.estimatedDelivery || 0).getTime());
    return list;
  }, [initialDeliveries, url.q, statusFilter]);

  const paginated = useMemo(() => {
    const start = (url.page - 1) * url.perPage;
    return filteredAndSorted.slice(start, start + url.perPage);
  }, [filteredAndSorted, url.page, url.perPage]);

  // Action Handlers
  const handleUpdate = async (id: string, data: any) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/deliveries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Delivery updated successfully");
      router.refresh();
    } catch (err) {
      toast.error("Error updating delivery");
    } finally {
      setIsUpdating(false);
      setTrackingModal(null);
      setCourierModal(null);
    }
  };

  const filters: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        options: [
          { value: "", label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "DISPATCHED", label: "Dispatched" },
          { value: "IN_TRANSIT", label: "In Transit" },
          { value: "DELIVERED", label: "Delivered" },
          { value: "FAILED", label: "Failed" },
        ],
        value: statusFilter,
        onChange: (v) => url.set({ status: v || undefined, page: 1 }),
      },
    ],
    [statusFilter, url]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED": return <Badge variant="default" className="bg-green-600">DELIVERED</Badge>;
      case "FAILED": return <Badge variant="destructive">FAILED</Badge>;
      case "DISPATCHED": return <Badge variant="default" className="bg-blue-600">DISPATCHED</Badge>;
      case "PENDING": return <Badge variant="outline">PENDING</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <TableToolbar
        searchPlaceholder="Search by order #, customer, tracking..."
        searchValue={url.q}
        onSearch={url.setSearch}
        filters={filters}
        totalCount={initialDeliveries.length}
        filteredCount={filteredAndSorted.length}
        onClearFilters={url.clearFilters}
        hasActiveFilters={url.q !== "" || statusFilter !== ""}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Order</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Logistics</th>
                  <th className="text-left p-4 font-medium">Tracking</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <Link href={`/admin/orders/${d.orderId}`} className="text-primary font-bold hover:underline">
                        #{d.order?.orderNumber}
                      </Link>
                      <div className="text-xs text-muted-foreground">{d.method || "Standard"}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-foreground">{d.order?.shippingAddress?.fullName || "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{d.order?.shippingAddress?.phone}</div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {d.deliveryZone?.name || "Global"}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Truck className="h-3 w-3" />
                        {d.assignedCourier?.name || "Unassigned"}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {d.trackingNumber ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">{d.trackingNumber}</Badge>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleUpdate(d.id, { status: "DISPATCHED" })}>
                            <Truck className="mr-2 h-4 w-4" /> Mark Dispatched
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdate(d.id, { status: "DELIVERED" })}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdate(d.id, { status: "FAILED" })} className="text-destructive">
                            <AlertCircle className="mr-2 h-4 w-4" /> Mark Failed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setTrackingModal({ id: d.id, current: d.trackingNumber || "" })}>
                            <Plus className="mr-2 h-4 w-4" /> {d.trackingNumber ? "Edit Tracking" : "Add Tracking"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCourierModal({ id: d.id, currentId: d.assignedCourier?.id || null })}>
                            <Truck className="mr-2 h-4 w-4" /> {d.assignedCourier ? "Change Courier" : "Assign Courier"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSorted.length === 0 && (
            <TableEmptyState
              icon={Truck}
              title={initialDeliveries.length === 0 ? "No active deliveries" : "No matches found"}
              description="Deliveries will appear here as soon as orders are confirmed."
              actionLabel={url.q || statusFilter ? "Clear all" : undefined}
              onAction={url.clearFilters}
            />
          )}

          {filteredAndSorted.length > 0 && (
            <TablePagination
              totalCount={filteredAndSorted.length}
              page={url.page}
              perPage={url.perPage}
              onPageChange={url.setPage}
              onPerPageChange={url.setPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Tracking Modal */}
      <Dialog open={!!trackingModal} onOpenChange={() => setTrackingModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Tracking Number</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tracking">Tracking #</Label>
              <Input
                id="tracking"
                value={trackingModal?.current || ""}
                onChange={(e) => setTrackingModal(prev => prev ? { ...prev, current: e.target.value } : null)}
                placeholder="e.g. PH-123456"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingModal(null)}>Cancel</Button>
            <Button 
              onClick={() => handleUpdate(trackingModal!.id, { trackingNumber: trackingModal!.current })}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save Tracking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Courier Modal */}
      <Dialog open={!!courierModal} onOpenChange={() => setCourierModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Courier</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="courier">Select Courier</Label>
              <select
                id="courier"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={courierModal?.currentId || ""}
                onChange={(e) => setCourierModal(prev => prev ? { ...prev, currentId: e.target.value } : null)}
              >
                <option value="">Select a courier...</option>
                {couriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourierModal(null)}>Cancel</Button>
            <Button 
              onClick={() => handleUpdate(courierModal!.id, { assignedCourierId: courierModal!.currentId || null })}
              disabled={isUpdating}
            >
              {isUpdating ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
