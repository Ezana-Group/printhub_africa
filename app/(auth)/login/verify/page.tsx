"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";

function getCallbackUrl(): string {
  if (typeof window === "undefined") return "/login/success";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("callbackUrl");
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/login/success";
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState<"email" | "sms" | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<"email" | "sms" | null>(null);

  useEffect(() => {
    if (!token) setError("Invalid or expired link. Please sign in again.");
  }, [token]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      token,
      totpCode: code,
      callbackUrl: getCallbackUrl(),
      redirect: false,
    });
    setLoading(false);
    if (result?.ok && result?.url) {
      window.location.href = result.url;
      return;
    }
    setError(result?.error === "CredentialsSignin" ? "Invalid or expired code." : result?.error ?? "Verification failed.");
  };

  const handleSendCode = async (method: "email" | "sms") => {
    if (!token) return;
    setError("");
    setSendLoading(method);
    try {
      const res = await fetch("/api/auth/send-2fa-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send code");
        return;
      }
      setSent(method);
    } catch {
      setError("Something went wrong");
    } finally {
      setSendLoading(null);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <Link href="/" className="text-2xl font-display font-bold text-primary">PrintHub</Link>
          <CardTitle>Verification</CardTitle>
          <CardDescription>Invalid or expired link.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="default">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <Link href="/" className="text-2xl font-display font-bold text-primary">
          PrintHub
        </Link>
        <CardTitle>Verify your identity</CardTitle>
        <CardDescription>Choose how to receive your 6-digit code</CardDescription>
      </CardHeader>
      <form onSubmit={handleVerify}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </p>
          )}
          {sent && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
              Code sent to your {sent === "email" ? "email" : "phone"}. Enter it below.
            </p>
          )}

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Option 1: Authenticator app</p>
            <p className="text-xs text-muted-foreground">
              Open your authenticator app (e.g. Google Authenticator) and enter the 6-digit code.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Option 2: Email the code</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSendCode("email")}
              disabled={sendLoading !== null}
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendLoading === "email" ? "Sending…" : "Send code to my email"}
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Option 3: SMS the code</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSendCode("sms")}
              disabled={sendLoading !== null}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {sendLoading === "sms" ? "Sending…" : "Send code via SMS"}
            </Button>
          </div>

          <div className="pt-2 border-t space-y-2">
            <Label htmlFor="verify-code">Enter 6-digit code</Label>
            <Input
              id="verify-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? "Verifying…" : "Verify and sign in"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginVerifyPage() {
  return (
    <Suspense fallback={<Card><CardContent className="pt-6">Loading…</CardContent></Card>}>
      <VerifyContent />
    </Suspense>
  );
}
