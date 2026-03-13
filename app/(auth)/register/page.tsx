"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error;
        setError(
          typeof err === "string"
            ? err
            : err?.email?.[0] ?? err?.password?.[0] ?? "Registration failed."
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
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
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
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
          {(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ||
            process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) && (
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
                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                  >
                    Google
                  </Button>
                )}
                {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn("facebook", { callbackUrl: "/" })}
                  >
                    Facebook
                  </Button>
                )}
                {process.env.NEXT_PUBLIC_APPLE_CLIENT_ID && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => signIn("apple", { callbackUrl: "/" })}
                  >
                    Apple
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
