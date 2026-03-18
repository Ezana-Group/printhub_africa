import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { LEGAL_NAV } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Data Deletion Request | PrintHub Africa",
  description:
    "How to request deletion of personal data associated with Facebook Login or Google Login on PrintHub Africa.",
  robots: "index,follow",
};

export default function DataDeletionPage() {
  const orderedLegalNav = [...LEGAL_NAV].sort((a, b) => a.slug.localeCompare(b.slug));

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <aside className="lg:w-64 shrink-0 space-y-6">
            <nav className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Legal</p>
              <ul className="space-y-0.5">
                {orderedLegalNav.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/${item.slug}`}
                      className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
                        item.slug === "data-deletion"
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">PrintHub</h3>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                  <a href="tel:+254727410320" className="hover:text-primary">
                    +254 727 410 320
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                  <a href="mailto:hello@printhub.africa" className="hover:text-primary break-all">
                    hello@printhub.africa
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                  <span>Nairobi, Kenya</span>
                </li>
              </ul>
              <Link
                href="/get-a-quote"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Get in touch →
              </Link>
            </div>
          </aside>

          <article className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-6 md:px-8 md:py-8">
              <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                This page satisfies the Meta Platform data deletion requirement under Meta&apos;s Platform Terms of Service.
              </div>

              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">Data Deletion Request</h1>
              <p className="text-sm text-slate-500 mt-2">Last updated: 18 March 2026</p>

              <div className="legal-document mt-8">
                <p className="effective-date">
                  <strong>Effective Date:</strong> 1 March 2026
                  <br />
                  <strong>Last Updated:</strong> 18 March 2026
                  <br />
                  <strong>Version:</strong> 1.0
                </p>

                <p>
                  PrintHub Africa (An Ezana Group Company) is committed to your right to erasure under the Kenya Data
                  Protection Act, 2019 <span className="text-slate-500">(Section 26(c))</span> and, where applicable,
                  the EU General Data Protection Regulation <span className="text-slate-500">(GDPR Article 17)</span>{" "}
                  and UK GDPR. This page explains how to request deletion of your personal data collected through
                  Facebook Login or Google Login on our Platform.
                </p>

                <h2>1. Data we hold from Facebook Login and Google Login</h2>
                <p>When you sign in using Facebook or Google, we receive and store:</p>
                <ul>
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Profile picture URL</li>
                  <li>A unique identifier from Facebook or Google (used to recognise your account on future logins)</li>
                </ul>
                <p>
                  We do not receive your password, friends list, contacts, posts, or any other data from your Facebook
                  or Google account.
                </p>

                <h2>2. Your right to erasure</h2>
                <p>Under the following laws you have the right to request deletion of your personal data:</p>
                <p>
                  <strong>Kenya Data Protection Act, 2019 — Section 26(c):</strong>
                  <br />
                  You have the right to request erasure of your personal data where:
                </p>
                <ul>
                  <li>The data is no longer necessary for the purpose it was collected</li>
                  <li>You withdraw consent and there is no other legal basis for processing</li>
                  <li>You object to processing and there are no overriding legitimate grounds</li>
                  <li>The data has been unlawfully processed</li>
                </ul>
                <p>
                  <strong>EU/UK GDPR — Article 17 (where applicable):</strong>
                  <br />
                  Where EU or UK data protection law applies to your use of our Platform, you have the right to
                  erasure (&quot;right to be forgotten&quot;) on the same grounds listed above.
                </p>

                <h2>3. How to request deletion</h2>
                <p>
                  <strong>Option 1 — Self-service (current in-app flow):</strong>
                  <br />
                  Log in → Account Settings → Privacy &amp; data → Delete my account
                  <br />
                  Type <strong>DELETE MY ACCOUNT</strong> in the confirmation box and submit.
                  <br />
                  Your account is anonymised, social login links are removed, and you are signed out.
                </p>
                <p>
                  <strong>Option 2 — Email request:</strong>
                  <br />
                  Email: <a href="mailto:dpo@printhub.africa">dpo@printhub.africa</a>
                  <br />
                  Subject line: Data Deletion Request
                  <br />
                  Include:
                </p>
                <ul>
                  <li>Your full name</li>
                  <li>The email address linked to your PrintHub account</li>
                  <li>Whether you signed in via Facebook, Google, or email/password</li>
                  <li>Your account ID or order number if known (optional but helpful)</li>
                </ul>
                <p>
                  We will acknowledge your request within 72 hours and action it within 30 days as required by the
                  Kenya Data Protection Act, 2019 and GDPR Article 12. If your request is complex, we may extend this
                  by a further 2 months and will notify you within the initial 30-day period explaining the reason for
                  the extension.
                </p>

                <h2>4. What we delete and what we retain</h2>
                <p>Upon a valid deletion request, we will:</p>
                <p>
                  <strong>DELETED IMMEDIATELY / AT REQUEST COMPLETION:</strong>
                </p>
                <ul>
                  <li>Your name, email address, and profile picture from Facebook/Google</li>
                  <li>Your account login credentials and session data</li>
                  <li>Your account preferences and settings</li>
                  <li>Your marketing consent records (after the statutory retention period)</li>
                </ul>
                <p>
                  <strong>ANONYMISED (personal identifiers removed, record retained):</strong>
                </p>
                <ul>
                  <li>
                    Order history — your name and contact details are removed but the order record is anonymised and
                    retained for financial reporting
                  </li>
                </ul>
                <p>
                  <strong>RETAINED (cannot be deleted — legal obligation):</strong>
                </p>
                <ul>
                  <li>
                    Financial transaction records, invoices, and payment references are retained for 7 years as
                    required by:
                    <ul>
                      <li>Kenya Revenue Authority under the Income Tax Act (Cap. 470) and the VAT Act (Cap. 476)</li>
                      <li>
                        GDPR Article 17(3)(b){" "}
                        <span className="text-slate-500">
                          — retention necessary for compliance with a legal obligation
                        </span>
                      </li>
                    </ul>
                  </li>
                  <li>
                    These records will have your personal identifiers removed (anonymised) where technically possible
                    while meeting KRA requirements
                  </li>
                </ul>

                <h2>5. Verification and response</h2>
                <p>
                  To protect your privacy and prevent unauthorised deletion requests, we may need to verify your
                  identity before processing your request. We will never delete an account based on an unverified
                  request.
                </p>
                <p>We will respond to all deletion requests:</p>
                <ul>
                  <li>Acknowledgement: within 72 hours</li>
                  <li>
                    Completion: within 30 days (extendable to 3 months for complex requests under Kenya DPA and GDPR
                    Article 12)
                  </li>
                  <li>Confirmation email sent to your registered email address once deletion is complete</li>
                </ul>
                <p>
                  If we are unable to fulfil your request (e.g. due to a legal retention obligation), we will explain
                  the reason in writing.
                </p>

                <h2>6. Automated deletion callback</h2>
                <p>
                  PrintHub Africa supports Meta&apos;s automated data deletion callback. When you request deletion of
                  your Facebook data directly through Facebook (Settings → Your Facebook Information → Delete Your
                  Information), Meta will automatically notify our system and trigger deletion of your associated data
                  on our Platform. You do not need to contact us separately if you use Facebook&apos;s own deletion
                  tool.
                </p>

                <h2>7. Right to lodge a complaint</h2>
                <p>
                  <strong>Kenya — Office of the Data Protection Commissioner (ODPC):</strong>
                  <br />
                  If you are unhappy with how we handle your deletion request, you may lodge a complaint with the ODPC:
                  <br />
                  Website: <a href="https://www.odpc.go.ke">www.odpc.go.ke</a>
                  <br />
                  Email: <a href="mailto:info@odpc.go.ke">info@odpc.go.ke</a>
                  <br />
                  Phone: +254 20 2628 000
                </p>
                <p>
                  <strong>EU/UK — Supervisory Authority:</strong>
                  <br />
                  If EU or UK GDPR applies to you, you may lodge a complaint with your local data protection
                  supervisory authority. A list of EU supervisory authorities is available at:
                  <br />
                  <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en">
                    https://edpb.europa.eu/about-edpb/about-edpb/members_en
                  </a>
                </p>
                <p>
                  We encourage you to contact us first at <a href="mailto:dpo@printhub.africa">dpo@printhub.africa</a>{" "}
                  so we can attempt to resolve your concern directly.
                </p>

                <h2>8. Contact our Data Protection Officer</h2>
                <p>
                  Data Protection Officer
                  <br />
                  PrintHub — An Ezana Group Company
                  <br />
                  Nairobi, Kenya
                  <br />
                  Email: <a href="mailto:dpo@printhub.africa">dpo@printhub.africa</a>
                  <br />
                  General enquiries: <a href="mailto:hello@printhub.africa">hello@printhub.africa</a>
                  <br />
                  Website: <a href="https://printhub.africa">https://printhub.africa</a>
                  <br />
                  Last updated: March 2026
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
