"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, Loader2, X, Printer, MailCheck } from "lucide-react";
import { Label } from "@/components/ui/label";

function getCallbackUrl() {
  if (typeof window === "undefined") return "/login/success";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("callbackUrl");
  return raw && /^\/(?!\/)/.test(raw) ? raw : "/login/success";
}

export default function MagicLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("email", {
        email: email.trim(),
        callbackUrl: getCallbackUrl(),
        redirect: false,
      });
      if (result?.ok) {
        setSent(true);
        setLocked(true);
        setTimeLeft(30);
        // Hide success banner after 5 seconds
        setTimeout(() => setSent(false), 5000);
      } else if (result?.error) {
        setError(String(result.error));
        setLocked(false);
      } else {
        setError("Could not send sign-in link.");
        setLocked(false);
      }
    } catch {
      setError("Something went wrong.");
      setLocked(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const result = await signIn("email", {
        email: email.trim(),
        callbackUrl: getCallbackUrl(),
        redirect: false,
      });
      if (result?.ok) {
        setSent(true);
        setTimeLeft(30);
        setTimeout(() => setSent(false), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLocked(false);
    setSent(false);
    setTimeLeft(0);
    setError(null);
    setLoading(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 antialiased text-slate-800 bg-[#FAF7F4] font-sans">
      
      {/* Success Banner */}
      {sent && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-emerald-50 border border-emerald-200 shadow-lg rounded-xl p-4 flex items-start gap-3">
            <div className="bg-emerald-100 p-1.5 rounded-full shrink-0 text-emerald-600 mt-0.5">
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-emerald-800 font-heading font-semibold text-sm">Check your inbox</h3>
              <p className="text-emerald-600 text-sm mt-0.5">
                We&apos;ve sent a magic link to <span className="font-semibold">{email}</span>
              </p>
            </div>
            <button onClick={() => setSent(false)} className="ml-auto text-emerald-500 hover:text-emerald-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8">
          {/* Logo area */}
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 text-[#F04E23] font-heading font-bold text-2xl tracking-tight">
              <Printer className="w-8 h-8" />
              PrintHub
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-semibold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your account using a magic link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  readOnly={locked || loading}
                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl sm:text-sm transition-colors focus:outline-none ${
                    error
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : locked || loading
                        ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                        : "border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#F04E23]/20 focus:border-[#F04E23]"
                  }`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {(locked || loading) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>
              {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
            </div>

            {!locked ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#F04E23] hover:bg-[#D9411A] disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F04E23]"
              >
                {loading ? (
                  <>
                    Sending...
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  </>
                ) : (
                  "Send magic link"
                )}
              </button>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-4 animate-in fade-in duration-300">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timeLeft > 0 || loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>Resend link {timeLeft > 0 && <span className="ml-1">({timeLeft}s)</span>}</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Use a different email
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-center">
          <p className="text-xs text-slate-500">Secure, passwordless sign in.</p>
        </div>
      </div>
    </div>
  );
}
