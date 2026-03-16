"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/** Brand icons for social sign-in (company logos). */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
                    variant="outline"
                    className="w-full h-11 gap-3 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium"
                    onClick={() => signIn("google", { callbackUrl: getCallbackUrl() })}
                  >
                    <GoogleIcon className="h-5 w-5 shrink-0" />
                    Continue with Google
                  </Button>
                )}
                {showFacebook && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 gap-3 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium"
                    onClick={() => signIn("facebook", { callbackUrl: getCallbackUrl() })}
                  >
                    <FacebookIcon className="h-5 w-5 shrink-0" />
                    Continue with Facebook
                  </Button>
                )}
                {showApple && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 gap-3 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium"
                    onClick={() => signIn("apple", { callbackUrl: getCallbackUrl() })}
                  >
                    <AppleIcon className="h-5 w-5 shrink-0" />
                    Continue with Apple
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
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href="/login/magic">Email me a sign-in link</Link>
          </Button>
          <Button type="button" variant="ghost" className="w-full" asChild>
            <Link href="/register">Create an account</Link>
          </Button>
        </CardFooter>
    </Card>
  );
}
