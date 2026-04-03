"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl rounded-3xl p-6 text-center">
        <CardHeader>
          <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-white">Invalid Link</CardTitle>
          <CardDescription className="text-zinc-500">
            This recovery link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all">
            <Link href="/admin/forgot-password">Request New Link</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }
      
      setSuccess(true);
      toast.success("Password updated successfully.");
      
      // Auto redirect to login after a few seconds
      setTimeout(() => {
        router.push("/admin/login");
      }, 3000);
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl rounded-3xl p-6 text-center animate-in fade-in zoom-in duration-500">
        <CardHeader>
          <div className="h-16 w-16 bg-[#FF4D00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-[#FF4D00]" />
          </div>
          <CardTitle className="text-white text-2xl">Access Restored</CardTitle>
          <CardDescription className="text-zinc-500">
            Your administrative credentials have been updated. Redirecting to login...
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full h-12 bg-[#FF4D00] hover:bg-[#FF6622] text-white font-bold rounded-xl transition-all">
            <Link href="/admin/login">Log In Now</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-zinc-100 flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#FF4D00]" />
          Set New Credentials
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Enter your new administrative password below.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
              New Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-[#FF4D00] transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-200 h-11 rounded-xl focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
              Confirm New Password
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-[#FF4D00] transition-colors" />
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="pl-10 bg-zinc-950/50 border-zinc-800 text-zinc-200 h-11 rounded-xl focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#FF4D00] hover:bg-[#FF6622] text-white font-bold rounded-xl shadow-lg shadow-[#FF4D00]/20 transition-all active:scale-[0.98] mt-4"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Update Security Access <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF4D00]/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF4D00]/5 blur-[120px] rounded-full" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <div className="relative w-full max-w-md px-6 py-12 z-10">
        <div className="flex flex-col items-center mb-10 space-y-4">
          <Link href="/admin/login">
            <div className="h-16 w-16 bg-[#FF4D00] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,77,0,0.3)] transform -rotate-3 hover:rotate-0 transition-transform duration-500">
               <ShieldCheck className="h-10 w-10 text-white" strokeWidth={1.5} />
            </div>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Pass Reset</h1>
            <p className="text-zinc-500 text-sm font-medium">Update Internal System Credentials</p>
          </div>
        </div>

        <Suspense fallback={<div className="text-white text-center">Loading security systems...</div>}>
          <AdminResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
