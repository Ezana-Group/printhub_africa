"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const COOKIE_NAME = "printhub-cookie-consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

function getStoredConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return null;
  try {
    const value = decodeURIComponent(raw.split("=")[1] ?? "");
    const parsed = JSON.parse(value) as Consent;
    if (parsed && parsed.essential === true) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function setCookie(consent: Consent) {
  const value = encodeURIComponent(JSON.stringify(consent));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const consent = getStoredConsent();
    if (!consent) {
      setShowBanner(true);
      setAnalytics(false);
      setMarketing(false);
    } else {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const openPreferences = () => setShowPreferences(true);
    const el = document.getElementById("cookie-settings-trigger");
    el?.addEventListener("click", openPreferences);
    return () => el?.removeEventListener("click", openPreferences);
  }, [mounted]);

  const save = (consent: Consent) => {
    setCookie(consent);
    setShowBanner(false);
    setShowPreferences(false);
    if (consent.analytics) {
      // Load Google Analytics if configured
      // if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    if (consent.marketing) {
      // Load Facebook Pixel if configured
    }
  };

  const acceptAll = () => {
    save({ essential: true, analytics: true, marketing: true });
  };

  const essentialOnly = () => {
    save({ essential: true, analytics: false, marketing: false });
  };

  const savePreferences = () => {
    save({ essential: true, analytics, marketing });
  };

  if (!mounted) return null;

  return (
    <>
      {showBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur p-4 shadow-lg"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="container max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              We use cookies to improve your experience.{" "}
              <Link href="/cookie-policy" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button size="sm" onClick={acceptAll}>
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={essentialOnly}>
                Essential Only
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowPreferences(true)}>
                Manage Preferences
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPreferences(false)}
          role="dialog"
          aria-label="Cookie preferences"
        >
          <div
            className="bg-background rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg mb-4">Cookie preferences</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Essential cookies</p>
                  <p className="text-muted-foreground">Required for the site to work. Cannot be disabled.</p>
                </div>
                <span className="text-muted-foreground">Always on</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Analytics cookies</p>
                  <p className="text-muted-foreground">Help us understand how visitors use the site.</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Marketing cookies</p>
                  <p className="text-muted-foreground">Used for relevant advertising and campaign measurement.</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={savePreferences}>Save preferences</Button>
              <Button variant="outline" onClick={() => setShowPreferences(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
