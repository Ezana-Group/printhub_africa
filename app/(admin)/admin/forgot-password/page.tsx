"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#CC3D00]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#CC3D00]/5 blur-[120px] rounded-full" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <div className="relative w-full max-w-md px-6 py-12 z-10">
        <div className="flex flex-col items-center mb-10 space-y-4">
          <Link href="/login">
            <div className="h-16 w-16 bg-[#CC3D00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,77,0,0.3)] transform -rotate-3 hover:rotate-0 transition-transform duration-500">
               <ShieldCheck className="h-10 w-10 text-white" strokeWidth={1.5} />
            </div>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Pass Recovery</h1>
            <p className="text-zinc-500 text-sm font-medium">Reset Administrative Access</p>
          </div>
        </div>

        <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#CC3D00]" />
              Account Recovery
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Enter your work email for a secure reset link.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {success ? (
              <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[#CC3D00]/10 p-6 rounded-2xl border border-[#CC3D00]/20 text-center space-y-3">
                  <div className="h-12 w-12 bg-[#CC3D00]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="h-6 w-6 text-[#CC3D00]" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Check Your Inbox</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    If an account exists for <span className="text-white font-medium">{email}</span>, you will receive a recovery link shortly.
                  </p>
                </div>
                <Button 
                  asChild 
                  className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"
                >
                  <Link href="/login">Return to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                    Work Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-[#CC3D00] transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@printhub.africa"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-200 h-11 rounded-xl focus:ring-[#CC3D00] focus:border-[#CC3D00] transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#CC3D00] hover:bg-[#FF6622] text-white font-bold rounded-xl shadow-lg shadow-[#CC3D00]/20 transition-all active:scale-[0.98] mt-4"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Secure Link <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                
                <div className="text-center mt-4">
                  <Link 
                    href="/login" 
                    className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-[#CC3D00] transition-colors"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
