"use client";

import { useState } from "react";
import Link from "next/link";
import { Instagram, Facebook, Linkedin, X } from "lucide-react";
import { ContactModal } from "@/components/contact/ContactModal";
import type { BusinessPublic } from "@/lib/business-public";

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const DEFAULT_SOCIAL = [
  { label: "Instagram", href: "https://instagram.com/printhub.africa", Icon: Instagram },
  { label: "Facebook", href: "https://facebook.com/printhub.africa", Icon: Facebook },
  { label: "X", href: "https://x.com/printhub_africa", Icon: X },
  { label: "TikTok", href: "https://tiktok.com/@printhub.africa", Icon: TiktokIcon },
  { label: "LinkedIn", href: "https://linkedin.com/company/printhub-africa", Icon: Linkedin },
];

type SocialIcon = React.ComponentType<{ className?: string }>;

function socialLinksFromBusiness(b: BusinessPublic) {
  const out: { label: string; href: string; Icon: SocialIcon }[] = [];
  if (b.socialInstagram) out.push({ label: "Instagram", href: b.socialInstagram, Icon: Instagram });
  if (b.socialFacebook) out.push({ label: "Facebook", href: b.socialFacebook, Icon: Facebook });
  if (b.socialTwitter) out.push({ label: "X", href: b.socialTwitter, Icon: X });
  if (b.socialTikTok) out.push({ label: "TikTok", href: b.socialTikTok, Icon: TiktokIcon });
  if (b.socialLinkedIn) out.push({ label: "LinkedIn", href: b.socialLinkedIn, Icon: Linkedin });
  return out.length > 0 ? out : DEFAULT_SOCIAL;
}

type FooterLink = { label: string; href: string; openContact?: boolean };

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "#", openContact: true },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Large Format", href: "/services/large-format" },
      { label: "3D Printing", href: "/services/3d-printing" },
      { label: "Get a Quote", href: "/get-a-quote" },
    ],
  },
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "Get a Quote", href: "/get-a-quote" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Track Order", href: "/track" },
      { label: "FAQ", href: "/faq" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export function Footer({ business }: { business: BusinessPublic }) {
  const [contactOpen, setContactOpen] = useState(false);
  const socialLinks = socialLinksFromBusiness(business);

  return (
    <>
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="font-display text-lg font-bold text-white">
                {business.businessName}
              </Link>
              <p className="text-sm text-slate-400 mt-2">
                {business.tagline}
              </p>
              <p className="text-xs text-slate-500 mt-1">{business.tradingName}</p>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="font-semibold text-sm text-white mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      {link.openContact ? (
                        <button
                          type="button"
                          onClick={() => setContactOpen(true)}
                          className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800">
            <h3 className="font-semibold text-sm text-white mb-3">Follow us</h3>
            <div className="flex gap-4">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-800 text-slate-300 hover:bg-primary hover:text-white transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">
              M-Pesa · Pesapal · Visa · Mastercard · Bank Transfer
            </p>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} {business.businessName}. All rights reserved.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-xs text-slate-500">
            <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="/cookie-policy" className="hover:text-slate-400 transition-colors">Cookie Policy</Link>
            <Link href="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
            <button type="button" id="cookie-settings-trigger" className="hover:text-slate-400 transition-colors">
              Cookie Settings
            </button>
          </div>
        </div>
      </footer>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
}
