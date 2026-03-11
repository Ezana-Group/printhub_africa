/**
 * Initial legal page HTML content for PrintHub — Kenya law (Data Protection Act 2019, etc.)
 * Used by prisma/seed.ts. Admin can edit via CMS after seeding.
 */

export type LegalSlug = "privacy-policy" | "terms-of-service" | "cookie-policy" | "refund-policy";

export function getLegalContent(slug: LegalSlug): string {
  switch (slug) {
    case "privacy-policy":
      return PRIVACY_POLICY_HTML;
    case "terms-of-service":
      return TERMS_OF_SERVICE_HTML;
    case "cookie-policy":
      return COOKIE_POLICY_HTML;
    case "refund-policy":
      return REFUND_POLICY_HTML;
    default:
      return "<p>Content not found.</p>";
  }
}

const PRIVACY_POLICY_HTML = `<h2>1. Who We Are</h2>
<p>PrintHub ("we", "us", "our") is a printing services company operated by Ezana Group, registered in Nairobi, Kenya. We operate the website printhub.africa and provide large format printing, 3D printing, and related services.</p>
<p><strong>Contact:</strong> privacy@printhub.africa | +254 XXX XXX XXX<br>
Physical address: [Your Address], Nairobi, Kenya</p>

<h2>2. What Personal Data We Collect</h2>
<p>We collect the following categories of personal data:</p>
<h3>Data you give us directly:</h3>
<ul>
  <li>Full name, email address, phone number</li>
  <li>Delivery address and county</li>
  <li>Company name and KRA PIN (for business/corporate orders)</li>
  <li>Payment information (M-Pesa number, card details — processed securely, not stored by us)</li>
  <li>Design files and artwork you upload for printing</li>
  <li>Messages and communications you send us</li>
</ul>
<h3>Data we collect automatically:</h3>
<ul>
  <li>IP address and approximate location</li>
  <li>Browser type and device information</li>
  <li>Pages visited and time spent on our website</li>
  <li>Order history and preferences</li>
  <li>Cookies (see our Cookie Policy)</li>
</ul>

<h2>3. How We Use Your Data</h2>
<p>We use your personal data to:</p>
<ul>
  <li>Process and fulfil your orders and quotes</li>
  <li>Send order confirmations, updates, and delivery notifications</li>
  <li>Process payments and issue VAT invoices</li>
  <li>Respond to your enquiries and provide customer support</li>
  <li>Improve our website and services</li>
  <li>Send marketing communications (only with your consent — you can opt out at any time)</li>
  <li>Comply with legal obligations including KRA tax reporting requirements</li>
  <li>Detect and prevent fraud</li>
</ul>

<h2>4. Legal Basis for Processing</h2>
<p>Under the Kenya Data Protection Act 2019, we process your data on the following grounds:</p>
<ul>
  <li><strong>Contract performance</strong> — to fulfil your orders and provide our services</li>
  <li><strong>Legal obligation</strong> — for tax, invoicing, and regulatory compliance</li>
  <li><strong>Legitimate interests</strong> — to improve our services and prevent fraud</li>
  <li><strong>Consent</strong> — for marketing communications</li>
</ul>

<h2>5. Who We Share Your Data With</h2>
<p>We share your data only where necessary:</p>
<ul>
  <li><strong>Payment processors</strong> — Safaricom (M-Pesa), Pesapal, Flutterwave, Stripe — to process payments</li>
  <li><strong>Courier partners</strong> — to deliver your orders (name, phone, address only)</li>
  <li><strong>Cloud service providers</strong> — Vercel (hosting), Neon/Supabase (database), Cloudflare (file storage) — under data processing agreements</li>
  <li><strong>Email and SMS providers</strong> — Resend, Africa's Talking — to send you notifications</li>
  <li><strong>KRA (Kenya Revenue Authority)</strong> — as required by Kenya tax law</li>
</ul>
<p>We do not sell your personal data to third parties. We do not share your data with advertisers.</p>

<h2>6. How Long We Keep Your Data</h2>
<ul>
  <li>Account data: for as long as your account is active, plus 2 years after closure</li>
  <li>Order and invoice records: 7 years (Kenya tax law requirement)</li>
  <li>Design files: 6 months after order completion, then deleted unless you request earlier deletion</li>
  <li>Marketing preferences: until you withdraw consent</li>
</ul>

<h2>7. Your Rights Under the Kenya Data Protection Act 2019</h2>
<p>You have the right to:</p>
<ul>
  <li><strong>Access</strong> the personal data we hold about you</li>
  <li><strong>Correct</strong> inaccurate or incomplete data</li>
  <li><strong>Delete</strong> your data (subject to legal retention requirements)</li>
  <li><strong>Object</strong> to processing for marketing purposes</li>
  <li><strong>Port</strong> your data to another service</li>
  <li><strong>Withdraw consent</strong> at any time for consent-based processing</li>
</ul>
<p>To exercise any of these rights, email us at privacy@printhub.africa. We will respond within 21 days.</p>

<h2>8. Cookies</h2>
<p>We use cookies on our website. See our <a href="/cookie-policy">Cookie Policy</a> for full details.</p>

<h2>9. Security</h2>
<p>We implement appropriate technical and organisational measures to protect your data including HTTPS encryption, secure password hashing, access controls, and regular security reviews. However, no internet transmission is 100% secure.</p>

<h2>10. Changes to This Policy</h2>
<p>We may update this policy from time to time. We will notify registered customers by email of any material changes. The current version and date is always shown at the top of this page.</p>

<h2>11. Contact & Complaints</h2>
<p>For privacy enquiries: privacy@printhub.africa<br>
You also have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) Kenya at www.odpc.go.ke</p>`;

const TERMS_OF_SERVICE_HTML = `<h2>1. Agreement to Terms</h2>
<p>By accessing printhub.africa or placing an order, you agree to these Terms of Service. If you do not agree, please do not use our services. These terms are governed by the laws of Kenya.</p>

<h2>2. Our Services</h2>
<p>PrintHub provides:</p>
<ul>
  <li>Large format printing (banners, vehicle wraps, signage, canvas prints)</li>
  <li>3D printing services (FDM and resin)</li>
  <li>Ready-made 3D printed merchandise</li>
  <li>Design and finishing services</li>
</ul>

<h2>3. Ordering</h2>
<p><strong>Custom print jobs:</strong> All custom orders require design file approval before production begins. Placing an order constitutes an offer. We confirm acceptance by sending an Order Confirmation.</p>
<p><strong>Ready-made products:</strong> Orders are confirmed on receipt of full payment.</p>
<p><strong>Quotes:</strong> Quotes are valid for 14 days from issue unless stated otherwise. Accepting a quote and paying the deposit confirms the order.</p>
<p><strong>Minimum order:</strong> Minimum order value is KES 500.</p>

<h2>4. Pricing and Payment</h2>
<p>All prices are in Kenya Shillings (KES) and inclusive of 16% VAT unless stated otherwise. We reserve the right to correct pricing errors before order confirmation.</p>
<p><strong>Accepted payments:</strong> M-Pesa, Visa/Mastercard, bank transfer. Full payment is required before production begins unless you have an approved corporate account.</p>
<p><strong>Corporate accounts:</strong> NET-30 payment terms apply as per your account agreement.</p>

<h2>5. File Requirements & Artwork</h2>
<p>You are responsible for supplying print-ready files. We accept: AI, PDF, PSD, PNG, JPG (300dpi minimum), STL, OBJ, FBX, STEP (for 3D printing).</p>
<p>By uploading files, you confirm you own or have rights to use all artwork, images, logos, and content. We are not liable for any intellectual property infringement in files you supply.</p>
<p>We review files before production and will contact you if corrections are needed. This may affect production timelines.</p>
<p>We will not print content that is illegal, defamatory, obscene, or infringes third-party rights. We reserve the right to refuse any order.</p>

<h2>6. Production & Turnaround</h2>
<p>Standard turnaround is 2–5 business days after file approval and payment confirmation. Express 24-hour service is available at a surcharge where stated. Timelines are estimates and not guaranteed unless expressly confirmed in writing.</p>
<p>PrintHub is not liable for delays caused by: late file submission, required design corrections, force majeure, courier delays, or circumstances beyond our control.</p>

<h2>7. Delivery</h2>
<p>We deliver to all 47 counties in Kenya. Delivery fees are shown at checkout. Risk of loss passes to you when the courier collects your order. Inspect all deliveries immediately — damaged or incorrect items must be reported within 24 hours of receipt (see Refund Policy).</p>

<h2>8. Quality Guarantee</h2>
<p>We guarantee our printing meets professional quality standards. Colour accuracy may vary ±5% from on-screen proofs due to monitor calibration differences. If you require colour-critical work, request a printed proof (charges apply).</p>

<h2>9. Intellectual Property</h2>
<p>PrintHub retains copyright in all original designs created by our team. Customer-supplied artwork remains the customer's property. We may photograph completed work for our portfolio unless you request otherwise in writing.</p>

<h2>10. Limitation of Liability</h2>
<p>To the maximum extent permitted by Kenyan law, PrintHub's total liability for any claim is limited to the amount paid for the specific order giving rise to the claim. We are not liable for indirect, consequential, or lost profit damages.</p>

<h2>11. Consumer Rights</h2>
<p>Nothing in these terms affects your rights under the Kenya Consumer Protection Act 2012.</p>

<h2>12. Governing Law</h2>
<p>These terms are governed by the laws of Kenya. Any disputes will be resolved in the courts of Nairobi.</p>

<h2>13. Changes to Terms</h2>
<p>We may update these terms. Continued use of our services after changes constitutes acceptance. Material changes will be notified by email to registered customers.</p>

<h2>14. Contact</h2>
<p>PrintHub | An Ezana Group Company<br>
hello@printhub.africa | +254 XXX XXX XXX<br>
[Address], Nairobi, Kenya</p>`;

const COOKIE_POLICY_HTML = `<h2>1. What Are Cookies</h2>
<p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and understand how you use the site.</p>

<h2>2. Cookies We Use</h2>

<h3>Essential Cookies (Always Active)</h3>
<p>These are required for the website to function. You cannot opt out of these.</p>
<table>
  <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
  <tr><td>next-auth.session-token</td><td>Keeps you logged in</td><td>30 days</td></tr>
  <tr><td>next-auth.csrf-token</td><td>Security — prevents cross-site attacks</td><td>Session</td></tr>
  <tr><td>printhub-cart</td><td>Saves your shopping cart</td><td>7 days</td></tr>
  <tr><td>printhub-cookie-consent</td><td>Remembers your cookie preferences</td><td>1 year</td></tr>
</table>

<h3>Analytics Cookies (Optional)</h3>
<p>Help us understand how visitors use our website so we can improve it.</p>
<table>
  <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
  <tr><td>_ga, _ga_*</td><td>Google Analytics — page views, sessions</td><td>2 years</td></tr>
  <tr><td>_hjSessionUser_*</td><td>Hotjar — session recordings (if enabled)</td><td>1 year</td></tr>
</table>

<h3>Marketing Cookies (Optional)</h3>
<p>Used to show relevant advertising and measure campaign effectiveness.</p>
<table>
  <tr><th>Cookie</th><th>Purpose</th><th>Duration</th></tr>
  <tr><td>_fbp</td><td>Facebook Pixel — ad measurement</td><td>90 days</td></tr>
</table>

<h2>3. Managing Cookies</h2>
<p>When you first visit our site, we ask for your consent to non-essential cookies. You can change your preferences at any time by clicking "Cookie Settings" in the footer.</p>
<p>You can also control cookies through your browser settings. Note that disabling essential cookies will affect site functionality.</p>
<p>Browser guides: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Chrome</a> · <a href="https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener">Firefox</a> · <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471" target="_blank" rel="noopener">Safari</a></p>

<h2>4. Third-Party Cookies</h2>
<p>Some cookies are set by third-party services we use. We do not control these cookies. Refer to each provider's privacy policy for details: Google, Hotjar, Facebook/Meta.</p>

<h2>5. Updates</h2>
<p>We may update this policy as we add or change services. The current version date is always shown above.</p>

<h2>6. Contact</h2>
<p>Questions about cookies: privacy@printhub.africa</p>`;

const REFUND_POLICY_HTML = `<h2>Our Commitment</h2>
<p>We stand behind our quality. If something is wrong with your order, we will make it right.</p>

<h2>1. Custom Print Orders (Large Format & 3D Printing)</h2>

<h3>When we will reprint or refund:</h3>
<ul>
  <li>The print has a manufacturing defect (banding, colour inconsistency, incomplete print)</li>
  <li>The size or specification differs from what was confirmed in your order</li>
  <li>The item was damaged in transit</li>
  <li>We made an error in the file used for printing</li>
</ul>

<h3>When we cannot refund:</h3>
<ul>
  <li>You approved a proof and the final product matches the approved proof</li>
  <li>Colour variation within 5% of the approved proof (inherent in print processes)</li>
  <li>Errors in your supplied artwork (typos, wrong images, incorrect dimensions in your file)</li>
  <li>Change of mind after production has started</li>
  <li>Incorrect specifications provided at time of order</li>
</ul>

<h3>How to report a problem:</h3>
<p>Report within <strong>48 hours of delivery</strong> by emailing support@printhub.africa with:</p>
<ul>
  <li>Your order number (PHUB-XXXXXXX)</li>
  <li>Clear photos of the issue</li>
  <li>Description of the problem</li>
</ul>
<p>We aim to respond within 1 business day and resolve all valid claims within 5 business days by either reprinting the order or issuing a full or partial refund.</p>

<h2>2. Ready-Made Products (3D Printed Merchandise)</h2>
<p>You may return ready-made products within <strong>14 days of delivery</strong> if:</p>
<ul>
  <li>The item is damaged or defective on arrival</li>
  <li>The wrong item was delivered</li>
  <li>The item is significantly not as described</li>
</ul>
<p>Items must be unused and in original packaging. You are responsible for return shipping costs unless the item is defective or we sent the wrong item.</p>
<p><strong>Change of mind returns</strong> on ready-made products: We accept returns within 7 days for store credit only (not cash refund), provided the item is unused and in resaleable condition.</p>

<h2>3. How Refunds Are Processed</h2>
<ul>
  <li><strong>M-Pesa payments:</strong> Refunded to your M-Pesa number within 2–5 business days</li>
  <li><strong>Card payments:</strong> Refunded to original card within 5–10 business days</li>
  <li><strong>Bank transfer:</strong> Refunded to original account within 5–7 business days</li>
  <li><strong>Store credit:</strong> Added to your account immediately</li>
</ul>

<h2>4. Cancellations</h2>
<p><strong>Before production starts:</strong> Full refund less any payment processing fees (typically 2–3%).</p>
<p><strong>After production starts:</strong> 50% refund (covers materials already used).</p>
<p><strong>After production is complete:</strong> No refund unless the item is defective.</p>
<p>To cancel, contact us immediately at support@printhub.africa with your order number.</p>

<h2>5. Contact Us</h2>
<p>Refunds & returns: support@printhub.africa<br>
WhatsApp: +254 XXX XXX XXX<br>
Response time: within 1 business day, Mon–Sat 8am–6pm EAT</p>`;
