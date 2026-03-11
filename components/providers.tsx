"use client";

import { SessionProvider } from "next-auth/react";
import { SentryUserContext } from "./providers/SentryUserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SentryUserContext />
      {children}
    </SessionProvider>
  );
}
