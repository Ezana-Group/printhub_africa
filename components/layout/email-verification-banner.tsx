"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Edit3, X, Send, CheckCircle, Zap } from "lucide-react";

export function EmailVerificationBanner() {
  const { data: session, status, update } = useSession();
  
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [localVerified, setLocalVerified] = useState(false);

  const user = session?.user;
  // If user is verified natively by NextAuth or locally by the demo button
  const isVerified = localVerified || (user && user.emailVerified === true);

  // Default to session email
  useEffect(() => {
    if (user?.email && !newEmailInput) {
      setNewEmailInput(user.email);
    }
  }, [user?.email, newEmailInput]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  if (status !== "authenticated" || !user) return null;

  const handleResend = async () => {
    if (cooldown > 0) return;
    setCooldown(60);
    try {
      await fetch("/api/user/verify-email/resend", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmailInput || !newEmailInput.includes("@")) return;
    try {
      const res = await fetch("/api/user/verify-email/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmailInput })
      });
      if (res.ok) {
        setShowChangeEmail(false);
        setCooldown(0);
        await update(); // This forces NextAuth to reload token
        handleResend();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const verifyDemo = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/user/verify-email/demo", { method: "POST" });
      if (res.ok) {
        await update(); 
        setLocalVerified(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <div 
        className={`fixed top-20 right-4 md:bottom-6 md:right-6 md:top-auto z-[9999] flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-y-2 translate-x-2 pointer-events-none'}`}
      >
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <div className="text-sm font-medium pr-2">Email verified! Your profile is now unlocked.</div>
        <button onClick={() => setShowToast(false)} className="text-emerald-600 hover:text-emerald-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Demo verification trigger (Only visible when unverified) */}
      {!isVerified && (
        <div className="fixed bottom-6 flex justify-center w-full z-40 pointer-events-none">
          <button 
            onClick={verifyDemo} 
            disabled={isVerifying}
            className="pointer-events-auto bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-semibold text-sm hover:bg-slate-800 transition-transform hover:scale-105 flex items-center gap-2 border border-slate-700 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-emerald-400" /> 
            {isVerifying ? "Verifying..." : "Demo: Click to \"I've verified\""}
          </button>
        </div>
      )}

      {/* Banner */}
      <div className={`bg-[#FEF3C7] border-b border-amber-200 z-10 w-full shrink-0 shadow-sm relative origin-top overflow-visible transition-all duration-500 ease-in-out ${isVerified ? 'h-0 opacity-0 -translate-y-full border-b-0 hidden' : 'h-auto opacity-100 translate-y-0 block'}`}>
        <div className="max-w-4xl mx-auto px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-[#92400E]">
            <div className="bg-amber-200/50 p-1.5 rounded-full shrink-0 mt-0.5 md:mt-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm pt-1 md:pt-0 leading-relaxed md:leading-normal">
              <span className="font-semibold">Please verify your email address.</span>{" "}
              We sent a link to <span className="font-medium underline decoration-amber-300 underline-offset-2">{user.email}</span>.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 shrink-0 relative w-full md:w-auto">
            {/* Popover trigger */}
            <button 
               onClick={() => setShowChangeEmail(!showChangeEmail)} 
               className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Change email
            </button>
            
            {/* Change Email Popover */}
            {showChangeEmail && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowChangeEmail(false)}></div>
                <div className="absolute top-12 left-0 md:left-auto md:right-0 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-50 transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Update Email Address</label>
                    <button onClick={() => setShowChangeEmail(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">A new verification link will be sent to this address.</p>
                  <div className="flex flex-col gap-3">
                    <input 
                      type="email" 
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChangeEmail()}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F04E23]/20 focus:border-[#F04E23] transition-colors" 
                      placeholder="hello@example.com" 
                    />
                    <button 
                      onClick={handleChangeEmail} 
                      className="bg-[#F04E23] text-white w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#D9411A] transition-colors shadow-sm"
                    >
                      Update & Resend Link
                    </button>
                  </div>
                </div>
              </>
            )}

            <span className="w-1 h-1 rounded-full bg-amber-300 hidden sm:block"></span>
            
            <button 
               onClick={handleResend} 
               disabled={cooldown > 0} 
               className="text-sm font-semibold bg-white border border-amber-200 shadow-sm hover:bg-amber-50 text-amber-900 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Send className="w-4 h-4" />
              <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
