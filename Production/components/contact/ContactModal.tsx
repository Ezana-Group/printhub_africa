"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ContactModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const subject = (form.elements.namedItem("subject") as HTMLInputElement).value.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim();
    if (!name || !email || !subject || message.length < 10) {
      setStatus("error");
      setErrorMsg("Please fill all required fields and write at least 10 characters in the message.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error?.message ?? "Failed to send. Try again.");
        return;
      }
      setStatus("success");
      form.reset();
      setTimeout(() => onOpenChange(false), 2000);
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          For general enquiries, partnerships, press, or complaints — we&apos;ll get back to you soon.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact-name" className="text-slate-700">Name *</Label>
              <Input id="contact-name" name="name" required className="mt-1 rounded-xl" placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="contact-email" className="text-slate-700">Email *</Label>
              <Input id="contact-email" name="email" type="email" required className="mt-1 rounded-xl" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <Label htmlFor="contact-phone" className="text-slate-700">Phone</Label>
            <Input id="contact-phone" name="phone" type="tel" className="mt-1 rounded-xl" placeholder="+254 7XX XXX XXX" />
          </div>
          <div>
            <Label htmlFor="contact-subject" className="text-slate-700">Subject *</Label>
            <Input id="contact-subject" name="subject" required className="mt-1 rounded-xl" placeholder="e.g. Partnership enquiry" />
          </div>
          <div>
            <Label htmlFor="contact-message" className="text-slate-700">Message *</Label>
            <Textarea id="contact-message" name="message" required minLength={10} rows={4} className="mt-1 rounded-xl" placeholder="Your message..." />
          </div>
          {status === "success" && <p className="text-green-600 font-medium text-sm">Message sent. We&apos;ll reply soon.</p>}
          {status === "error" && <p className="text-red-600 text-sm">{errorMsg}</p>}
          <Button type="submit" disabled={status === "loading"} className="rounded-xl">
            {status === "loading" ? "Sending..." : "Send message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
