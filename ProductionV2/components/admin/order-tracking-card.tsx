"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Event = {
  id: string;
  status: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  location: string | null;
  courierRef: string | null;
  createdAt: Date | string;
  createdBy: string | null;
};

export function OrderTrackingCard({
  orderId,
  orderNumber,
  events: initialEvents,
}: {
  orderId: string;
  orderNumber: string;
  events: Event[];
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [courierRef, setCourierRef] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          courierRef: courierRef.trim() || null,
          isPublic,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEvents((prev) => [data.event, ...prev]);
      setTitle("");
      setDescription("");
      setLocation("");
      setCourierRef("");
      setShowForm(false);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Delete this tracking event?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking/${eventId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      router.refresh();
    } catch {
      // ignore
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Order tracking — {orderNumber}</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(true)}>
            + Add tracking event
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3 p-3 border rounded-lg">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Collected from production"
                required
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details for customer"
              />
            </div>
            <div>
              <Label>Courier ref (optional)</Label>
              <Input
                value={courierRef}
                onChange={(e) => setCourierRef(e.target.value)}
                placeholder="e.g. G4S-2026-004521"
              />
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Nairobi CBD depot"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="track-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <Label htmlFor="track-public">Visible to customer</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                Add event
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-start gap-2 py-2 border-b last:border-0 text-sm"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                  e.isPublic ? "bg-green-500" : "bg-slate-400"
                }`}
                title={e.isPublic ? "Public" : "Internal"}
              />
              <div className="min-w-0 flex-1">
                <span className="font-medium">{e.title}</span>
                <span className="text-muted-foreground ml-2">
                  {new Date(e.createdAt).toLocaleString()} ·{" "}
                  {e.isPublic ? "PUBLIC" : "INTERNAL"} ·{" "}
                  {e.createdBy ? "Staff" : "System"}
                </span>
                {e.description && (
                  <p className="text-muted-foreground mt-0.5">{e.description}</p>
                )}
                {e.courierRef && (
                  <p className="text-muted-foreground">Courier ref: {e.courierRef}</p>
                )}
              </div>
              {e.createdBy && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(e.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
