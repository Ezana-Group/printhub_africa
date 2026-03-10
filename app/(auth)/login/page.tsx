"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/** Messages that depend on searchParams; wrapped in Suspense so the form can render immediately (fixes WebKit E2E). */
function LoginMessages({
  error,
  errorParam,
  verified,
}: {
  error: string;
  errorParam: string | null;
  verified: string | null;
}) {
  return (
    <>
      {verified === "1" && (
        <p className="text-sm text-success bg-success/10 border border-success/30 rounded-md p-2">
          Email verified. You can sign in now.
        </p>
      )}
      {errorParam === "InvalidOrExpiredToken" && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
          Verification link invalid or expired.
        </p>
      )}
      {(error || errorParam === "CredentialsSignin") && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
          {error || (errorParam === "CredentialsSignin" ? "Invalid email or password." : errorParam ?? "")}
        </p>
      )}
    </>
  );
}

function LoginMessagesWithParams({ error }: { error: string }) {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");
  return <LoginMessages error={error} errorParam={errorParam} verified={verified} />;
}

/**
 * Login form is rendered immediately (no Suspense around it) so E2E and WebKit
 * see #email / #password on first paint. Only the URL-dependent messages use Suspense.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const raw = params.get("callbackUrl");
    const callbackUrl =
      raw && /^\/(?!\/)/.test(raw) ? raw : "/login/success";
    await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: true,
    });
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <Link href="/" className="text-2xl font-display font-bold text-primary">
          PrintHub
        </Link>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your email and password</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Suspense fallback={null}>
            <LoginMessagesWithParams error={error} />
          </Suspense>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href="/register">Create an account</Link>
          </Button>
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              Continue with Google
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
