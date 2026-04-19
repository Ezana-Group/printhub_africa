"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "printhub-cookie-consent";

/** Optional third-party analytics script (Hotjar, ContentSquare, etc). Loaded only after user accepts analytics cookies. */
const THIRD_PARTY_SCRIPT_SRC =
  typeof process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL === "string" &&
  process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL.trim()
    ? process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT_URL.trim()
    : null;

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

/** Optional third-party script loader. Loads only after analytics cookie consent. */
export function ConsentGatedAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(hasAnalyticsConsent());
    const interval = setInterval(() => {
      if (hasAnalyticsConsent()) setAllowed(true);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!allowed || !THIRD_PARTY_SCRIPT_SRC || typeof document === "undefined") return;
    if (document.querySelector(`script[src="${THIRD_PARTY_SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = THIRD_PARTY_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, [allowed]);

  // Google Analytics via NEXT_PUBLIC_GA_MEASUREMENT_ID is handled in app/layout.tsx
  return null;
}
