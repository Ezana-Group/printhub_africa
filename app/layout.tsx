import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PrintHub | Large Format & 3D Printing | Nairobi, Kenya",
  description:
    "Large format printing and 3D printing for Nairobi and all of Kenya. Banners, signage, vehicle wraps, canvas, custom 3D prints. An Ezana Group Company.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://printhub.africa"),
  openGraph: {
    title: "PrintHub | Printing the Future, Made in Kenya",
    description: "Large format & 3D printing. Shop online or upload your design.",
    locale: "en_KE",
    images: [
      {
        url: "/images/og/default-og.webp",
        width: 1200,
        height: 630,
        alt: "PrintHub — Large Format & 3D Printing Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/og/default-og.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} font-body antialiased`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-white">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
