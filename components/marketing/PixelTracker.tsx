"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { MARKETING_CONFIG } from "@/config/marketing-channels";

const COOKIE_NAME = "printhub-cookie-consent";

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

/**
 * PixelTracker — Central client-side tracker for:
 * Meta Pixel, GTM, GA4, TikTok Pixel, X Pixel, Snapchat Pixel.
 * Only fires if marketing/analytics consent is given.
 */
export function PixelTracker({ ga4Id }: { ga4Id?: string | null }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      if (typeof document === "undefined") return;
      const raw = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${COOKIE_NAME}=`));
      if (!raw) return;
      try {
        const value = decodeURIComponent(raw.split("=")[1] ?? "");
        const parsed = JSON.parse(value) as Consent;
        setConsent(parsed);
      } catch {
        // ignore
      }
    };

    checkConsent();
    const interval = setInterval(checkConsent, 2000);

    // Listen for custom event to open settings
    const handleOpenSettings = () => setShowSettings(true);
    window.addEventListener("open-cookie-settings", handleOpenSettings);

    return () => {
      clearInterval(interval);
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  if (!consent) return null;

  return (
    <>
      {/* --- GOOGLE TAG MANAGER --- */}
      {MARKETING_CONFIG.GTM_ENABLED && (consent.analytics || consent.marketing) && (
        <Script
          id="gtm-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${MARKETING_CONFIG.GTM_ID}');
            `,
          }}
        />
      )}

      {/* --- DYNAMIC GA4 (from DB) --- */}
      {ga4Id && (consent.analytics || consent.marketing) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-dynamic" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');
            `}
          </Script>
        </>
      )}

      {/* --- META PIXEL --- */}
      {MARKETING_CONFIG.META_PIXEL_ENABLED && consent.marketing && (
        <>
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${MARKETING_CONFIG.META_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${MARKETING_CONFIG.META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {/* --- TIKTOK PIXEL --- */}
      {MARKETING_CONFIG.TIKTOK_PIXEL_ENABLED && consent.marketing && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${MARKETING_CONFIG.TIKTOK_PIXEL_ID}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      )}

      {/* --- PINTEREST TAG --- */}
      {MARKETING_CONFIG.PINTEREST_TAG_ENABLED && consent.marketing && (
        <Script
          id="pinterest-tag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.thebrighttag.com/tag:5.js");
              pintrk('load', '${MARKETING_CONFIG.PINTEREST_TAG_ID}');
              pintrk('page');
            `,
          }}
        />
      )}

      {/* --- X (TWITTER) PIXEL --- */}
      {MARKETING_CONFIG.X_PIXEL_ENABLED && consent.marketing && (
        <Script
          id="x-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
              },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
              a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
              twq('config','${MARKETING_CONFIG.X_PIXEL_ID}');
            `,
          }}
        />
      )}

      {/* --- SNAPCHAT PIXEL --- */}
      {MARKETING_CONFIG.SNAP_PIXEL_ENABLED && consent.marketing && (
        <Script
          id="snap-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
              {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
              a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
              r.src=n;var u=t.getElementsByTagName(s)[0];
              u.parentNode.insertBefore(r,u);})(window,document,
              'https://sc-static.net/scevent.min.js');
              snaptr('init', '${MARKETING_CONFIG.SNAP_PIXEL_ID}');
              snaptr('track', 'PAGE_VIEW');
            `,
          }}
        />
      )}
    </>
  );
}
