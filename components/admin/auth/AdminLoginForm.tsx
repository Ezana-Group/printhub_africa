"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AtSign, Lock, LogIn, AlertCircle } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState(searchParams.get("error") || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        totpCode: requires2FA ? totpCode : undefined,
      });

      if (res?.error) {
        if (res.error === "2FA_REQUIRED") {
           setRequires2FA(true);
           setError(""); // Clear error to show 2FA input cleanly
        } else if (res.error === "customer-account") {
          setError("Customer accounts cannot access the admin portal.");
        } else if (res.error === "account-locked") {
          setError("Account is temporarily locked due to too many failed attempts.");
        } else {
          setError("Invalid credentials or 2FA code.");
        }
        setIsLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh(); // necessary to ensure middleware evaluation grabs the new cookie correctly
    } catch (_err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
             <div className="ml-3">
              <p className="text-sm text-red-700">
                {error === 'SessionInvalidated' ? 'Your session was ended. Please sign in again.' : error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="email-address" className="sr-only">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AtSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FF4D00] focus:border-[#FF4D00] focus:z-10 sm:text-sm"
              placeholder="Staff Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Lock className="h-5 w-5 text-gray-400" />
             </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FF4D00] focus:border-[#FF4D00] focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        
        {requires2FA && (
           <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <label htmlFor="totpCode" className="sr-only">
              2FA Code
            </label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Lock className="h-5 w-5 text-[#FF4D00]" />
               </div>
              <input
                id="totpCode"
                name="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required={requires2FA}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-[#FF4D00] placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FF4D00] focus:border-[#FF4D00] focus:z-10 sm:text-sm shadow-sm"
                placeholder="6-digit Authenticator Code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 text-right">
              Open your authenticator app to get the code.
            </p>
          </div>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#FF4D00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4D00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            <span className="flex items-center">
              {requires2FA ? "Verify & Sign In" : "Sign in"} <LogIn className="ml-2 h-4 w-4" />
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
