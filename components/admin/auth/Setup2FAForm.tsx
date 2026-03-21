"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, AlertCircle, Copy, CheckCircle2 } from "lucide-react";

import { signOut } from "next-auth/react";

interface Setup2FAFormProps {
  inGracePeriod: boolean;
}

export function Setup2FAForm({ inGracePeriod }: Setup2FAFormProps) {
  const [step, setStep] = useState<"intro" | "qr" | "verify" | "success">("intro");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const startSetup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize setup");
      
      setQrCodeUrl(data.otpauth);
      setStep("qr");
    } catch (error: unknown) {
      if (error instanceof Error) {
         setError(error.message || "Failed to initialize 2FA setup");
      } else {
         setError("Failed to initialize 2FA setup");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", token: verifyToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      
      setBackupCodes(data.backupCodes);
      setStep("success");
    } catch (err: unknown) {
      if (err instanceof Error) {
         setError(err.message || "An unexpected error occurred.");
      } else {
         setError("An unexpected error occurred.");
      }
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const completeSetup = async () => {
      // Need to re-auth to get the new session claims (mustSetup2FA: false)
      await signOut({ redirect: true, callbackUrl: '/admin/login' });
  };

  if (step === "intro") {
    return (
      <div className="space-y-6 text-center text-gray-700">
        <ShieldCheck className="mx-auto h-16 w-16 text-[#FF4D00]" />
        
        {inGracePeriod && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left">
             <div className="flex">
               <div className="flex-shrink-0">
                 <AlertCircle className="h-5 w-5 text-blue-500" />
               </div>
               <div className="ml-3">
                 <p className="text-sm text-blue-700">
                   You are currently in a grace period for 2FA setup. Features will be locked if you do not complete this soon.
                 </p>
               </div>
             </div>
          </div>
        )}

        <p>
          To enhance the security of your staff account, PrintHub requires Two-Factor Authentication (2FA) using a Time-based One-Time Password (TOTP) app like Google Authenticator, Authy, or 1Password.
        </p>

        <button
          onClick={startSetup}
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#FF4D00] hover:bg-[#E64500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4D00] disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Preparing..." : "Begin Setup"}
        </button>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="space-y-6 flex flex-col items-center">
        <h3 className="text-lg font-medium text-gray-900">1. Scan the QR Code</h3>
        <p className="text-sm text-gray-500 text-center">
          Open your authenticator app and scan the QR code below.
        </p>
        
        <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl inline-block">
           <QRCodeSVG value={qrCodeUrl} size={200} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={() => setStep("verify")}
          className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          I have scanned the code
        </button>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">2. Verify Setup</h3>
          <p className="mt-1 text-sm text-gray-500">
            Enter the 6-digit code from your authenticator app to complete setup.
          </p>
        </div>

        <div>
          <label htmlFor="token" className="sr-only">Verification Code</label>
          <input
            id="token"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            className="appearance-none text-center text-3xl tracking-widest rounded-lg relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FF4D00] focus:border-[#FF4D00] sm:text-2xl"
            placeholder="000000"
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={isLoading || verifyToken.length !== 6}
          className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#FF4D00] hover:bg-[#E64500] disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Verifying..." : "Verify & Enable 2FA"}
        </button>
      </form>
    );
  }

  if (step === "success") {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h3 className="text-xl font-bold text-gray-900">2FA Successfully Enabled</h3>
        
        <div className="bg-yellow-50 p-6 rounded-lg text-left mt-6">
          <h4 className="text-sm font-medium text-yellow-800 flex justify-between items-center mb-4">
            Save your backup codes
            <button
              onClick={copyBackupCodes}
              className="text-yellow-700 hover:text-yellow-900 flex items-center text-xs ml-4"
            >
              {copiedCodes ? <CheckCircle2 className="w-4 h-4 mr-1"/> : <Copy className="w-4 h-4 mr-1" />}
              {copiedCodes ? "Copied!" : "Copy All"}
            </button>
          </h4>
          <p className="text-xs text-yellow-700 mb-4">
             If you lose access to your device, you can use these one-time codes to sign in. 
             <strong> Keep them in a safe place.</strong>
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono text-gray-800 bg-white p-3 border border-yellow-200 rounded">
             {backupCodes.map((code, i) => (
                <div key={i} className="text-center">{code}</div>
             ))}
          </div>
        </div>

        <button
          onClick={completeSetup}
          className="w-full mt-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          Continue to Dashboard
        </button>
      </div>
    );
  }

  return null;
}
