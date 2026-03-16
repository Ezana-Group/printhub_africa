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
function getCallbackUrl() {
  if (typeof window === "undefined") return "/login/success";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("callbackUrl");
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/login/success";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/validate-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.requires2FA && data.token) {
        const callbackUrl = getCallbackUrl();
        window.location.href = `/login/verify?t=${encodeURIComponent(data.token)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        return;
      }
      if (res.ok && !data.requires2FA) {
        const result = await signIn("credentials", {
          email,
          password,
          callbackUrl: getCallbackUrl(),
          redirect: false,
        });
        setLoading(false);
        if (result?.ok && result?.url) {
          window.location.href = result.url;
          return;
        }
        setError(result?.error === "CredentialsSignin" ? "Invalid email or password." : result?.error ?? "Sign in failed.");
        return;
      }
      setError(data.error ?? "Invalid email or password.");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicEmail.trim()) return;
    setError("");
    setMagicLoading(true);
    setMagicSent(false);
    const result = await signIn("email", {
      email: magicEmail.trim(),
      callbackUrl: getCallbackUrl(),
      redirect: false,
    });
    setMagicLoading(false);
    if (result?.ok) setMagicSent(true);
    else if (result?.error) setError(String(result.error));
  };

  const showGoogle = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const showFacebook = !!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const showApple = !!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const showSocial = showGoogle || showFacebook || showApple;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <Link href="/" className="text-2xl font-display font-bold text-primary">
          PrintHub
        </Link>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your email and password</CardDescription>
      </CardHeader>
      <form id="login-credentials" onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Suspense fallback={null}>
            <LoginMessagesWithParams error={error} />
          </Suspense>
          {magicSent && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
              Check your email for the sign-in link.
            </p>
          )}
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
      </form>
      <CardFooter className="flex flex-col gap-4">
          <Button type="submit" form="login-credentials" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          {showSocial && (
            <>
              <div className="relative w-full">
                <span className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </span>
                <span className="relative flex justify-center text-xs uppercase text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full">
                {showGoogle && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn("google", { callbackUrl: getCallbackUrl() })}
                  >
                    Google
                  </Button>
                )}
                {showFacebook && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn("facebook", { callbackUrl: getCallbackUrl() })}
                  >
                    Facebook
                  </Button>
                )}
                {showApple && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn("apple", { callbackUrl: getCallbackUrl() })}
                  >
                    Apple
                  </Button>
                )}
              </div>
            </>
          )}
          <div className="relative w-full">
            <span className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </span>
            <span className="relative flex justify-center text-xs uppercase text-muted-foreground">
              Or
            </span>
          </div>
          <form onSubmit={handleMagicLink} className="flex gap-2 w-full">
            <Input
              type="email"
              placeholder="Email me a sign-in link"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              className="flex-1"
              disabled={magicLoading}
            />
            <Button type="submit" variant="outline" disabled={magicLoading}>
              {magicLoading ? "Sending…" : "Send link"}
            </Button>
          </form>
          <Button type="button" variant="ghost" className="w-full" asChild>
            <Link href="/register">Create an account</Link>
          </Button>
        </CardFooter>
    </Card>
  );
}
