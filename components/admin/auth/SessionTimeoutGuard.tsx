"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 2 * 60 * 1000; // 2 minutes before timeout show warning

export function SessionTimeoutGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [lastActive, setLastActive] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  const resetTimer = useCallback(() => {
    setLastActive(Date.now());
    if (showWarning) setShowWarning(false);
  }, [showWarning]);

  useEffect(() => {
    // Determine if we should enforce timeout (only on admin routes)
    if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) return;
    if (status !== "authenticated") return;

    // Set up activity listeners
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    
    // Throttle the resets so we aren't re-rendering constantly
    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
       if (throttleTimer) return;
       throttleTimer = setTimeout(() => {
           resetTimer();
           throttleTimer = null;
       }, 500); 
    };

    events.forEach(e => window.addEventListener(e, handleActivity));

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActive;

      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        clearInterval(checkInactivity);
        events.forEach(e => window.removeEventListener(e, handleActivity));
        
        // Log out immediately
        signOut({ redirect: false }).then(() => {
           router.push("/admin/login?error=SessionExpired");
        });
      } else if (inactiveTime >= INACTIVITY_TIMEOUT - WARNING_BEFORE) {
        setShowWarning(true);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(checkInactivity);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [pathname, status, lastActive, resetTimer, router]);

  if (showWarning) {
     return (
        <>
          {children}
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
                <h3 className="text-xl font-bold text-gray-900">Are you still there?</h3>
                <p className="mt-2 text-gray-600">
                  Your session will expire soon due to inactivity. Click continue to remain signed in.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                     Sign Out
                  </button>
                  <button 
                    onClick={resetTimer}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                     Continue Session
                  </button>
                </div>
             </div>
          </div>
        </>
     )
  }

  return <>{children}</>;
}
