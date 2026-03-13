"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

const COOKIE_NAME = "printhub-cookie-consent";

function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return false;
  try {
    const value = decodeURIComponent(raw.split("=")[1] ?? "");
    const parsed = JSON.parse(value) as { analytics?: boolean };
    return !!parsed?.analytics;
  } catch {
    return false;
  }
}

/** Renders Vercel Analytics only when user has accepted analytics cookies (KDPA / consent-gated). */
export function ConsentGatedAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(hasAnalyticsConsent());
    const interval = setInterval(() => {
      if (hasAnalyticsConsent()) setAllowed(true);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!allowed) return null;
  return <Analytics />;
}
