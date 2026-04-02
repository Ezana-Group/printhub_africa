"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

function LoginError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  
  if (error === "CredentialsSignin") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-md flex items-center gap-2 mb-4">
        <AlertCircle className="h-4 w-4" />
        Invalid email or password.
      </div>
    );
  }
  if (error === "SessionExpired") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs p-3 rounded-md flex items-center gap-2 mb-4">
        <AlertCircle className="h-4 w-4" />
        Session expired. Please sign in again.
      </div>
    );
  }
  return null;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Handle toast on successful login
  useEffect(() => {
    if (session?.user) {
      const lastLoginAt = (session.user as any).lastLoginAt;
      const lastLoginIp = (session.user as any).lastLoginIp;
      if (lastLoginAt) {
        toast.success(`Welcome back!`, {
          description: `Last login: ${new Date(lastLoginAt).toLocaleString()} from ${lastLoginIp || 'unknown IP'}`,
        });
        router.push("/admin");
      }
    }
  }, [session, router]);

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    
    setLoading(true);
    setError("");

    try {
      // Step 1: Validate credentials and check 2FA status
      const res = await fetch("/api/auth/admin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        if (newFailedAttempts >= 3) {
          setCooldown(30);
          setFailedAttempts(0); // Reset after cooldown starts
        }

        if (data.requires2FA) {
          setShow2FA(true);
          return;
        }

        setError(data.error || "Authentication failed.");
        return;
      }

      // Step 2: Complete sign in with NextAuth
      const result = await signIn("credentials", {
        email,
        password,
        totpCode,
        redirect: false,
        // callbackUrl: "/admin", // Handled by useEffect
      });

      if (result?.error) {
        setError("Sign in failed. Please try again.");
        setLoading(false);
      }
      // Success handled by useSession effect
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans selection:bg-white/20">
      <div className="w-full max-w-[400px] p-8 space-y-8 animate-in fade-in duration-700">
        <div className="space-y-2 text-center pb-4">
          <h1 className="text-2xl font-semibold tracking-tighter">PrintHub</h1>
          <p className="text-zinc-500 text-sm">Authorized Staff Access Only</p>
        </div>

        <div className="space-y-6">
          <Suspense fallback={null}>
            <LoginError />
          </Suspense>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-md flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
              {error.includes("printhub.africa") && (
                <a 
                  href="https://printhub.africa/login" 
                  className="text-white hover:underline flex items-center gap-1 font-medium"
                >
                  Go to Customer Login <ArrowRight className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {cooldown > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] uppercase tracking-widest p-3 rounded-md flex items-center justify-center gap-2">
              Too many attempts. Wait {cooldown} seconds.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!show2FA ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@printhub.africa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-950 border-zinc-800 focus:border-white focus:ring-0 rounded-none h-10 text-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-zinc-950 border-zinc-800 focus:border-white focus:ring-0 rounded-none h-10 text-sm transition-all"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-zinc-900/50 p-4 rounded-md border border-zinc-800 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-white mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Verify Identity</p>
                    <p className="text-xs text-zinc-500">Enter the 6-digit code from your authenticator app.</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="totpCode" className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Authenticator Code</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    placeholder="000 000"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                    className="bg-zinc-950 border-zinc-800 focus:border-white focus:ring-0 rounded-none h-12 text-center text-xl tracking-[0.4em] font-mono transition-all"
                  />
                </div>
                <Button 
                  variant="link" 
                  type="button" 
                  className="p-0 h-auto text-[10px] text-zinc-500 uppercase tracking-widest hover:text-white"
                  onClick={() => setShow2FA(false)}
                >
                  ← Back to Password
                </Button>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full bg-white text-black hover:bg-zinc-200 font-medium rounded-none h-10 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {show2FA ? "Verify" : "Sign In"}
                    {!show2FA && <ArrowRight className="h-4 w-4" />}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <a 
              href="/admin/forgot-password" 
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              Forgot Password?
            </a>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Encrypted</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Multi-Factor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
