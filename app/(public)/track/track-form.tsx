"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TrackFormProps {
  initialOrder: string;
  onSearch: (order: string, email: string) => void;
  loading: boolean;
}

export function TrackForm({ initialOrder, onSearch, loading }: TrackFormProps) {
  const [order, setOrder] = useState(initialOrder);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const o = order.trim().toUpperCase();
    const em = email.trim().toLowerCase();
    if (!o && !em) return;
    onSearch(o || "", em);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="order">Order number</Label>
        <Input
          id="order"
          type="text"
          placeholder="e.g. PHUB-000001"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="e.g. you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-slate-500 mt-1">
          Either one is enough if you&apos;re signed in; otherwise use both.
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Looking up…" : "Track Order"}
      </Button>
    </form>
  );
}
