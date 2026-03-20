"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { SentryUserContext } from "./providers/SentryUserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SentryUserContext />
      <Toaster position="top-center" richColors />
      {children}
    </SessionProvider>
  );
}
