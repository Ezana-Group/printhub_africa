"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function getCallbackUrl() {
  if (typeof window === "undefined") return "/login/success";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("callbackUrl");
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/login/success";
}

export default function MagicLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    setSent(false);
    try {
      const result = await signIn("email", {
        email: email.trim(),
        callbackUrl: getCallbackUrl(),
        redirect: false,
      });
      if (result?.ok) {
        setSent(true);
      } else if (result?.error) {
        setError(String(result.error));
      } else {
        setError("Could not send sign-in link.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <Link href="/" className="text-2xl font-display font-bold text-primary">
          PrintHub
        </Link>
        <CardTitle>Email me a sign-in link</CardTitle>
        <CardDescription>Enter your email and we will send you a secure sign-in link.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </p>
          )}
          {sent && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
              Check your email for the sign-in link. You can close this tab after using it.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email</Label>
            <Input
              id="magic-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
            {loading ? "Sending…" : "Send sign-in link"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
