import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { ConsentGatedAnalytics } from "@/components/ConsentGatedAnalytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
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

const metadataBase = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const url = raw || "https://printhub.africa";
  try {
    return new URL(url);
  } catch {
    return new URL("https://printhub.africa");
  }
})();

const shouldEnableSpeedInsights = process.env.VERCEL === "1";

export async function generateMetadata(): Promise<Metadata> {
    const meta = await getCachedBusinessMetadata().catch(() => ({ 
      favicon: null, updatedAt: null, businessName: "PrintHub", tagline: null, logo: null, seo: null 
    }));
  const businessName = meta.seo?.siteName || meta.businessName || "PrintHub";
  const defaultTitle = meta.seo?.defaultTitle || `${businessName} | Large Format & 3D Printing | Nairobi, Kenya`;
  const description =
    meta.seo?.defaultDescription ||
    meta.tagline ||
    "Large format printing and 3D printing for Nairobi and all of Kenya. Banners, signage, vehicle wraps, canvas, custom 3D prints. An Ezana Group Company.";
  
  const updatedAtTime = meta.updatedAt ? new Date(meta.updatedAt).getTime() : 0;
  const faviconUrl =
    meta.favicon
      ? `${meta.favicon}?v=${updatedAtTime}`
      : null;

  const ogImage = meta.seo?.ogImageUrl || meta.logo || "/images/og/default-og.webp";

  return {
    title: {
      default: defaultTitle,
      template: meta.seo?.titleTemplate || `%s | ${businessName}`,
    },
    description,
    metadataBase,
    icons: faviconUrl
      ? {
          icon: [
            { url: faviconUrl, sizes: "any" },
            { url: faviconUrl, type: "image/x-icon" },
            { url: faviconUrl, type: "image/png", sizes: "32x32" },
            { url: faviconUrl, type: "image/png", sizes: "16x16" },
          ],
          apple: [{ url: faviconUrl, sizes: "180x180" }],
          shortcut: [{ url: faviconUrl }],
        }
      : {
          icon: "/api/branding/favicon",
          shortcut: "/api/branding/favicon",
          apple: "/api/branding/favicon",
        },
    openGraph: {
      title: `${businessName} | Printing the Future, Made in Kenya`,
      description: description,
      locale: "en_KE",
      siteName: businessName,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${businessName} — Large Format & 3D Printing Kenya`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
        <ConsentGatedAnalytics />
        {shouldEnableSpeedInsights ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
