"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<{
    google: boolean;
    facebook: boolean;
    apple: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) =>
        setOauthProviders({
          google: !!data.google,
          facebook: !!data.facebook,
          apple: !!data.apple,
        })
      )
      .catch(() => setOauthProviders({ google: false, facebook: false, apple: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!acceptTerms) {
      setError("You must accept the Account Registration Terms to continue.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          acceptTerms: true,
          marketingConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error;
        setError(
          typeof err === "string"
            ? err
            : err?.firstName?.[0] ?? err?.lastName?.[0] ?? err?.email?.[0] ?? err?.password?.[0] ?? err?.confirmPassword?.[0] ?? "Registration failed."
        );
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to {email}. Click it to verify your account, then sign in.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Go to sign in</Link>
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
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your details</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match.</p>
            )}
          </div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 accent-primary rounded"
              required
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              I am 18 years of age or older and I agree to PrintHub&apos;s{" "}
              <Link href="/account-terms" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                Account Registration Terms
              </Link>
              , which incorporate our{" "}
              <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 accent-primary rounded"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              I&apos;d like to receive news, promotions, and product updates from PrintHub by email.
              You can unsubscribe at any time.
            </span>
          </label>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !acceptTerms ||
              !firstName.trim() ||
              !lastName.trim() ||
              password !== confirmPassword ||
              !password ||
              !confirmPassword
            }
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
          {((oauthProviders?.google ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) ||
            (oauthProviders?.facebook ?? process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) ||
            (oauthProviders?.apple ?? process.env.NEXT_PUBLIC_APPLE_CLIENT_ID)) && (
            <>
              <div className="relative w-full">
                <span className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </span>
                <span className="relative flex justify-center text-xs uppercase text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="flex justify-center gap-3 w-full">
                {(oauthProviders?.google ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                    aria-label="Continue with Google"
                  >
                    <GoogleIcon className="h-5 w-5 shrink-0" />
                  </Button>
                )}
                {(oauthProviders?.facebook ?? process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                    onClick={() => signIn("facebook", { callbackUrl: "/" })}
                    aria-label="Continue with Facebook"
                  >
                    <FacebookIcon className="h-5 w-5 shrink-0" />
                  </Button>
                )}
                {(oauthProviders?.apple ?? process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                    onClick={() => signIn("apple", { callbackUrl: "/" })}
                    aria-label="Continue with Apple"
                  >
                    <AppleIcon className="h-5 w-5 shrink-0" />
                  </Button>
                )}
              </div>
            </>
          )}
          <Button type="button" variant="ghost" className="w-full" asChild>
            <Link href="/login">Already have an account? Sign in</Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Registering for a business?{" "}
            <Link href="/corporate/apply" className="inline-flex items-center gap-1 text-[#FF4D00] hover:underline">
              <Building2 className="w-3.5 h-3.5" />
              Apply for a Corporate Account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
