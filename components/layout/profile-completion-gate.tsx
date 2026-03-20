"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ArrowRight, Camera, User as UserIcon } from "lucide-react";

export function ProfileCompletionGate() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // We only show this for authenticated users missing either name or phone.
  // In a real scenario, we might want to check the provider to see if it's "google" or "facebook",
  // but missing name/phone is a good baseline trigger.
  const user = session?.user;
  const isMissingNameOrPhone = user && (!user.name || user.name === user.email);

  const [isOpen, setIsOpen] = useState(true); // Always starts open if condition is met
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If not authenticated or not missing data, render nothing.
  if (status !== "authenticated" || !user || !isMissingNameOrPhone || !isOpen) {
    return null;
  }

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return; // Prevent submission without required fields
    setStep(2);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitProfile = async () => {
    setIsSubmitting(true);
    
    // In a real app, we'd use FormData if uploading an image directly, 
    // or upload to S3 first and then send the URL.
    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName,
          phone,
        }),
      });

      if (response.ok) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        // For now, we'll just demonstrate the text submission.
        await update({
          name: fullName,
          displayName,
          phone,
        }); // refresh NextAuth session to pull down new name
        setStep(3); // Success!
      }
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissModal = () => {
    setIsOpen(false);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[999] flex justify-center pb-20 pt-10 px-4 sm:p-4 overflow-y-auto animate-in fade-in duration-300">
      
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col my-auto border border-slate-200 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-[#F04E23] transition-all duration-500"
            style={{ width: `${step === 1 ? 33 : step === 2 ? 66 : 100}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Header Badge */}
          {step <= 2 && (
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Signed in with Google
              </span>
            </div>
          )}

          <div className="relative">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-2">Complete your profile</h2>
                  <p className="text-slate-500 text-sm">We need a few more details to create your account.</p>
                </div>
                <form onSubmit={handleNextStep1} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04E23]/20 focus:border-[#F04E23] transition-colors"
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                      <input 
                        type="text" 
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04E23]/20 focus:border-[#F04E23] transition-colors"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04E23]/20 focus:border-[#F04E23] transition-colors"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm">
                        🇰🇪 +254
                      </span>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-none rounded-r-xl focus:outline-none focus:ring-2 focus:ring-[#F04E23]/20 focus:border-[#F04E23] transition-colors"
                        placeholder="7XX XXX XXX"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      Add an M-Pesa number for seamless checkout.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center justify-between">
                    <button type="button" onClick={dismissModal} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                      Skip for now
                    </button>
                    <button type="submit" disabled={!firstName || !lastName} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 outline-none rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                       Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 2: Photo */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-2">Add a photo</h2>
                  <p className="text-slate-500 text-sm">Personalise your PrintHub experience.</p>
                </div>
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <Image src={photoPreview} fill alt="Avatar preview" className="object-cover" />
                      ) : (
                        <UserIcon className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                    <label className="absolute inset-0 rounded-full cursor-pointer group-hover:bg-black/5 transition-colors flex items-center justify-center">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                      />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-white border border-slate-200 text-slate-700 rounded-full p-2 shadow-sm pointer-events-none group-hover:border-[#F04E23] group-hover:text-[#F04E23] transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center w-full">
                    <div className="pt-8 flex items-center justify-between">
                      <button type="button" onClick={submitProfile} disabled={isSubmitting} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                        Skip photo
                      </button>
                      <button type="button" onClick={submitProfile} disabled={isSubmitting} className="bg-[#F04E23] hover:bg-[#D9411A] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                        {isSubmitting ? "Saving..." : "Next step"} {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Success */}
            {step === 3 && (
              <div className="text-center space-y-4 py-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-12 duration-500 delay-150">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-heading font-semibold text-slate-900">
                  You&apos;re all set, {firstName}!
                </h2>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  Your profile is complete. You can now start using PrintHub fully.
                </p>
                <div className="pt-6">
                  <button type="button" onClick={dismissModal} className="w-full bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    Go to my profile
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
