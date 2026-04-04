"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function LoginMessages() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  
  const authErrorMessage =
    errorParam === "CredentialsSignin"
      ? "Invalid admin email or password."
      : errorParam === "AccessDenied"
      ? "Access denied. You do not have permission to enter the Admin Portal."
      : errorParam === "SocialAdminDisabled"
      ? "Social sign-in is disabled for administrative accounts. Please use your email and password."
      : errorParam && errorParam.length > 0
      ? "Authentication failed. Please check your credentials."
      : "";

  if (!authErrorMessage) return null;

  return (
    <div className="mb-6 p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {authErrorMessage}
    </div>
  );
}

export function AdminAuthPage() {
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
        setLoading(false); // Stop the spinner
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
      console.log("Proceeding to NextAuth signIn...");
      const result = await signIn("credentials", {
        email,
        password,
        totpCode,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        console.error("SignIn error:", result.error);
        setError("Sign in failed. Please try again.");
        setLoading(false);
      } else if (result?.ok) {
        console.log("SignIn successful, waiting for session update...");
        // Use a timeout as a safety net in case useSession doesn't fire immediately
        setTimeout(() => {
          if (loading) {
            setLoading(false);
            router.push("/admin");
          }
        }, 5000);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Login unexpected error:", err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF4D00]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF4D00]/5 blur-[120px] rounded-full" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <div className="relative w-full max-w-md px-6 py-12 z-10">
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="h-16 w-16 bg-[#FF4D00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,77,0,0.3)] transform -rotate-3 hover:rotate-0 transition-transform duration-500">
             <ShieldCheck className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Admin Portal</h1>
            <p className="text-zinc-500 text-sm font-medium">PrintHub Internal Systems</p>
          </div>
        </div>

        <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#FF4D00]" />
              {show2FA ? "Two-Factor Authentication" : "Secure Login"}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {show2FA ? "Enter your verification code." : "Only authorized staff may proceed."}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Suspense fallback={null}>
              <LoginMessages />
            </Suspense>
            
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-xs font-medium flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
                {error.includes("printhub.africa") && (
                  <a 
                    href="https://printhub.africa/login" 
                    className="text-white hover:underline flex items-center gap-1 font-medium mt-1"
                  >
                    Go to Customer Login <ArrowRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {cooldown > 0 && (
              <div className="mb-6 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                Too many attempts. Wait {cooldown} seconds.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!show2FA ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                      Work Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-[#FF4D00] transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@printhub.africa"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-200 h-11 rounded-xl focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                        System Password
                      </Label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-[#FF4D00] transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-200 h-11 rounded-xl focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-[#FF4D00]/10 p-4 rounded-2xl border border-[#FF4D00]/20 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#FF4D00] mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-100">Verify Identity</p>
                      <p className="text-xs text-zinc-500">Enter the 6-digit code from your authenticator app.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totpCode" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                      Authenticator Code
                    </Label>
                    <Input
                      id="totpCode"
                      type="text"
                      placeholder="000 000"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      required
                      autoFocus
                      className="bg-zinc-950/50 border-zinc-800 text-zinc-100 h-14 rounded-2xl focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all text-center text-2xl tracking-[0.4em] font-mono"
                    />
                  </div>
                  <Button 
                    variant="link" 
                    type="button" 
                    className="p-0 h-auto text-[10px] text-zinc-500 uppercase tracking-widest hover:text-[#FF4D00]"
                    onClick={() => setShow2FA(false)}
                  >
                    ← Back to Password
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full h-12 bg-[#FF4D00] hover:bg-[#FF6622] text-white font-bold rounded-xl shadow-lg shadow-[#FF4D00]/20 transition-all active:scale-[0.98] mt-4 overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {show2FA ? "Verify Code" : "Enter Portal"} <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pb-8 pt-2">
             <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
             <div className="flex flex-col items-center gap-2">
               <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
                  Access is monitored. Unauthorized attempts will be logged.
               </p>
               <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                 Forgot Password?
               </Link>
             </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center">
           <Link href="https://printhub.africa" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors flex items-center justify-center gap-1">
              ← Return to Main Website
           </Link>
        </div>
      </div>
    </div>
  );
}
