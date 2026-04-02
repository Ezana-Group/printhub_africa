"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";

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
    <div className="mb-6 p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
      {authErrorMessage}
    </div>
  );
}

export function AdminAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Note: We use the same credentials provider, but we'll implement role-based 
      // redirection in the callback or middleware.
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/admin",
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid email or password." : "Login failed.");
        setLoading(false);
      } else if (result?.ok && result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
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
              Secure Login
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Only authorized staff may proceed.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Suspense fallback={null}>
              <LoginMessages />
            </Suspense>
            
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#FF4D00] hover:bg-[#FF6622] text-white font-bold rounded-xl shadow-lg shadow-[#FF4D00]/20 transition-all active:scale-[0.98] mt-4 overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Enter Portal <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pb-8 pt-2">
             <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
             <p className="text-[10px] text-zinc-600 text-center leading-relaxed max-w-[80%]">
                Access is monitored. Unauthorized attempts will be logged and reported to the system administrator.
             </p>
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
