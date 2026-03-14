"use client";

import { useState } from "react";
import Link from "next/link";
import { Instagram, Facebook, Linkedin, X, Youtube, MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactModal } from "@/components/contact/ContactModal";
import type { BusinessPublic } from "@/lib/business-public";

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

type SocialIcon = React.ComponentType<{ className?: string }>;

function socialLinksFromBusiness(b: BusinessPublic): { label: string; href: string; Icon: SocialIcon }[] {
  const out: { label: string; href: string; Icon: SocialIcon }[] = [];
  if (b.socialInstagram) out.push({ label: "Instagram", href: b.socialInstagram, Icon: Instagram });
  if (b.socialFacebook) out.push({ label: "Facebook", href: b.socialFacebook, Icon: Facebook });
  if (b.socialTwitter) out.push({ label: "X", href: b.socialTwitter, Icon: X });
  if (b.socialTikTok) out.push({ label: "TikTok", href: b.socialTikTok, Icon: TiktokIcon });
  if (b.socialLinkedIn) out.push({ label: "LinkedIn", href: b.socialLinkedIn, Icon: Linkedin });
  if (b.socialYouTube) out.push({ label: "YouTube", href: b.socialYouTube, Icon: Youtube });
  return out;
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
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
            <div>
              <h3 className="font-semibold text-sm text-white mb-4">Contact Us</h3>
              <ul className="space-y-3">
                {(business.address1 || business.city) && (
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-400 leading-relaxed">
                      {[business.address1, business.address2, business.city, business.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </li>
                )}
                {business.primaryPhone && (
                  <li className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                    <a href={`tel:${business.primaryPhone}`} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {business.primaryPhone}
                    </a>
                  </li>
                )}
                {business.whatsapp && (
                  <li className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <a
                      href={`https://wa.me/${(business.whatsapp ?? "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      WhatsApp Us
                    </a>
                  </li>
                )}
                {business.primaryEmail && (
                  <li className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <a href={`mailto:${business.primaryEmail}`} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {business.primaryEmail}
                    </a>
                  </li>
                )}
                {(business.hoursWeekdays || business.hoursSaturday || business.businessHours) && (
                  <li className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-400 space-y-0.5">
                      {business.hoursWeekdays && <p>{business.hoursWeekdays}</p>}
                      {business.hoursSaturday && <p>{business.hoursSaturday}</p>}
                      {business.hoursSunday && <p>{business.hoursSunday}</p>}
                      {!business.hoursWeekdays && !business.hoursSaturday && business.businessHours && <p>{business.businessHours}</p>}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
          {socialLinks.length > 0 && (
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
          )}
          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">
              M-Pesa · Pesapal · Visa · Mastercard · Bank Transfer
            </p>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} {business.businessName}. An Ezana Group Company. All rights reserved.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-xs text-slate-500">
            <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
            <Link href="/cookie-policy" className="hover:text-slate-400 transition-colors">Cookie Policy</Link>
            <Link href="/account-terms" className="hover:text-slate-400 transition-colors">Account Terms</Link>
            <Link href="/corporate-terms" className="hover:text-slate-400 transition-colors">Corporate Terms</Link>
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
