import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { ConsentGatedAnalytics } from "@/components/ConsentGatedAnalytics";
import { CookieBanner } from "@/components/CookieBanner";
import { PixelTrackerWrapper } from "@/components/marketing/pixel-tracker-wrapper";
import { Providers } from "@/components/providers";
import { getCachedBusinessMetadata } from "@/lib/cache/unstable-cache";
import { ProfileCompletionGate } from "@/components/layout/profile-completion-gate";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
  adjustFontFallback: true,
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
  adjustFontFallback: true,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const defaultMetadataBase = (() => {
  const rawEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const appOriginStr = rawEnv || "https://printhub.africa";
  try {
    return new URL(appOriginStr);
  } catch {
    return new URL("https://printhub.africa");
  }
})();

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getCachedBusinessMetadata().catch(() => ({ 
      favicon: null, updatedAt: null, businessName: "PrintHub", tagline: null, logo: null, seo: null, googleSiteVerification: null 
    }));
  const businessName = meta.seo?.siteName || meta.businessName || "PrintHub";
  const defaultTitle = meta.seo?.defaultTitle || `${businessName} | 3D Printing Services Kenya | Nairobi`;
  const description =
    meta.seo?.defaultDescription ||
    meta.tagline ||
    "Professional 3D printing services in Kenya. FDM and resin printing for prototypes, products, engineering parts, and custom orders with nationwide delivery.";
  
  const updatedAtTime = meta.updatedAt ? new Date(meta.updatedAt).getTime() : 0;
  const faviconHref =
    meta.favicon
      ? `${meta.favicon}?v=${updatedAtTime}`
      : null;

  const ogImageSrc = meta.seo?.ogImageUrl || meta.logo || "/images/og/default-og.webp";
  const canonical = meta.seo?.canonicalDomain || process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";
  const metadataBase = new URL(canonical);

  return {
    title: {
      default: defaultTitle,
      template: meta.seo?.titleTemplate || `%s | ${businessName}`,
    },
    description,
    keywords: [
      "3D printing Kenya",
      "3D printing Nairobi",
      "rapid prototyping Kenya",
      "resin printing Kenya",
      "FDM printing Kenya",
      "custom 3D printed products Kenya",
      "PrintHub Africa",
    ],
    metadataBase,
    alternates: {
      canonical: "./",
    },
    verification: {
      google: meta.googleSiteVerification || undefined,
    },
    icons: faviconHref
      ? {
          icon: [
            { url: faviconHref, sizes: "any" },
            { url: faviconHref, type: "image/x-icon" },
            { url: faviconHref, type: "image/png", sizes: "32x32" },
            { url: faviconHref, type: "image/png", sizes: "16x16" },
          ],
          apple: [{ url: faviconHref, sizes: "180x180" }],
          shortcut: [{ url: faviconHref }],
        }
      : {
          icon: "/api/branding/favicon",
          shortcut: "/api/branding/favicon",
          apple: "/api/branding/favicon",
        },
    openGraph: {
      title: `${businessName} | 3D Printing Services in Kenya`,
      description: description,
      locale: "en_KE",
      siteName: businessName,
      type: "website",
      images: [
        {
          url: ogImageSrc,
          width: 1200,
          height: 630,
          alt: `${businessName} — 3D Printing Services Kenya`,
        },
      ],
    },
    twitter: {
      card:
        meta.seo?.twitterCardType === "summary" ||
        meta.seo?.twitterCardType === "app" ||
        meta.seo?.twitterCardType === "player"
          ? meta.seo.twitterCardType
          : "summary_large_image",
      site: meta.seo?.twitterHandle || undefined,
      creator: meta.seo?.twitterHandle || undefined,
      images: [ogImageSrc],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Meta Domain Verification - Required for Aggregated Event Measurement */}
        <meta name="facebook-domain-verification" content="2035196960739715" />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DPPDS1G5P1"></script>
        <script>
          {`window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\n\ngtag('config', 'G-DPPDS1G5P1');`}
        </script>
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} font-body antialiased`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
          Skip to main content
        </a>
        <Providers>
          {children}
          <ProfileCompletionGate />
        </Providers>
        <CookieBanner />
        <PixelTrackerWrapper />
        <ConsentGatedAnalytics />
      </body>
    </html>
  );
}
