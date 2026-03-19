"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

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
        const err = data.error;
        setErrorMsg(
          typeof err === "string"
            ? err
            : err?.message ?? (typeof err === "object" && err !== null ? "Please check the fields and try again." : "Failed to send. Try again.")
        );
        return;
      }
      setStatus("success");
      setTicketNumber(data.ticketNumber ?? null);
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  return (
    <div className="min-h-[60vh] px-4 py-12 max-w-xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Contact Us</h1>
      <p className="text-gray-600 text-sm mb-8">
        For general enquiries, partnerships, press, or support — we&apos;ll get back to you soon.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact-name" className="text-gray-700">Name *</Label>
            <Input id="contact-name" name="name" required className="mt-1 rounded-xl" placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="contact-email" className="text-gray-700">Email *</Label>
            <Input id="contact-email" name="email" type="email" required className="mt-1 rounded-xl" placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <Label htmlFor="contact-phone" className="text-gray-700">Phone</Label>
          <Input id="contact-phone" name="phone" type="tel" className="mt-1 rounded-xl" placeholder="+254 7XX XXX XXX" />
        </div>
        <div>
          <Label htmlFor="contact-subject" className="text-gray-700">Subject *</Label>
          <Input id="contact-subject" name="subject" required className="mt-1 rounded-xl" placeholder="e.g. Partnership enquiry" />
        </div>
        <div>
          <Label htmlFor="contact-message" className="text-gray-700">Message *</Label>
          <Textarea id="contact-message" name="message" required minLength={10} rows={4} className="mt-1 rounded-xl" placeholder="Your message..." />
        </div>
        {status === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="font-medium">Message sent.</p>
          {ticketNumber ? (
            <p className="text-sm mt-1">Your reference: <strong>{ticketNumber}</strong>. We&apos;ll reply to your email soon.</p>
          ) : (
            <p className="text-sm mt-1">We&apos;ll reply soon.</p>
          )}
        </div>
      )}
        {status === "error" && <p className="text-red-600 text-sm">{errorMsg}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={status === "loading"} className="rounded-xl bg-[#FF4D00] hover:bg-[#E04500]">
            {status === "loading" ? "Sending..." : "Send message"}
          </Button>
          <Link href="/">
            <Button type="button" variant="outline" className="rounded-xl">Back to home</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
