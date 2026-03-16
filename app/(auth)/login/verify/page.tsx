"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageCircle, ShieldCheck, ArrowLeft } from "lucide-react";

type VerificationMethod = "authenticator" | "email" | "sms";

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
  const [view, setView] = useState<"choose" | "enter-code">("choose");
  const [chosenMethod, setChosenMethod] = useState<VerificationMethod | null>(null);

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
      setChosenMethod(method);
      setView("enter-code");
    } catch {
      setError("Something went wrong");
    } finally {
      setSendLoading(null);
    }
  };

  const handleChooseAuthenticator = () => {
    setError("");
    setChosenMethod("authenticator");
    setView("enter-code");
  };

  const handleBackToMethods = () => {
    setView("choose");
    setChosenMethod(null);
    setCode("");
    setError("");
  };

  if (!token) {
    return (
      <Card className="rounded-2xl border-slate-200 shadow-lg">
        <CardHeader className="space-y-1">
          <Link href="/" className="text-2xl font-display font-bold text-primary">PrintHub</Link>
          <CardTitle>Verification</CardTitle>
          <CardDescription>Invalid or expired link.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="default" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Dedicated "enter code" screen — one method in use at a time; user can go back to pick another.
  if (view === "enter-code" && chosenMethod) {
    const isAuthenticator = chosenMethod === "authenticator";
    const sentLabel = chosenMethod === "email" ? "email" : chosenMethod === "sms" ? "phone" : null;

    return (
      <Card className="rounded-2xl border-slate-200 shadow-lg">
        <CardHeader className="space-y-1">
          <Link href="/" className="text-2xl font-display font-bold text-primary">
            PrintHub
          </Link>
          <CardTitle>Enter your code</CardTitle>
          <CardDescription>
            {isAuthenticator
              ? "Enter the 6-digit code from your authenticator app."
              : "Enter the 6-digit code we sent you below."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-4">
            {!isAuthenticator && (
              <p className="text-sm text-green-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Code sent to your {sentLabel}. Enter it below.
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="verify-code" className="text-slate-700">6-digit code</Label>
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
                className="text-center tracking-[0.35em] font-mono text-lg h-12 rounded-lg border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-slate-500">
                Codes expire in 10 minutes. Didn&apos;t get one? Go back and try another method.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            <Button type="submit" className="w-full h-11 rounded-lg" disabled={loading || code.length !== 6}>
              {loading ? "Verifying…" : "Verify and sign in"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2 text-slate-600 hover:text-slate-900"
              onClick={handleBackToMethods}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Back — choose another method
            </Button>
            <Button type="button" variant="link" className="w-full text-slate-500 hover:text-slate-700" asChild>
              <Link href="/login">Back to sign in</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // Method selection: card-style options; only one in use at a time.
  return (
    <Card className="rounded-2xl border-slate-200 shadow-lg">
      <CardHeader className="space-y-1">
        <Link href="/" className="text-2xl font-display font-bold text-primary">
          PrintHub
        </Link>
        <CardTitle className="text-xl">Verify your identity</CardTitle>
        <CardDescription className="text-slate-600">
          Choose how to receive your 6-digit code. Only one method is used at a time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleChooseAuthenticator}
          className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Authenticator app</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Open your authenticator app (e.g. Google Authenticator) and enter the 6-digit code.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSendCode("email")}
          disabled={sendLoading !== null}
          className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">Email</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {sendLoading === "email" ? "Sending code…" : "Send a 6-digit code to your email."}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSendCode("sms")}
          disabled={sendLoading !== null}
          className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">SMS</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {sendLoading === "sms" ? "Sending code…" : "Send a 6-digit code to your phone."}
            </p>
          </div>
        </button>
      </CardContent>
      <CardFooter className="border-t border-slate-100 pt-4">
        <Button type="button" variant="ghost" className="w-full text-slate-600 hover:text-slate-900" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function LoginVerifyPage() {
  return (
    <Suspense fallback={<Card className="rounded-2xl"><CardContent className="pt-6">Loading…</CardContent></Card>}>
      <VerifyContent />
    </Suspense>
  );
}
