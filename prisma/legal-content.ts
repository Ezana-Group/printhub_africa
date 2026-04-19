/**
 * Initial legal page HTML content for PrintHub — Kenya DPA 2019 + GDPR/UK GDPR.
 * Used by prisma/seed.ts. Admin can edit via CMS after seeding.
 */

import type { LegalSlug } from "../lib/legal";

export type { LegalSlug };

export function getLegalContent(slug: LegalSlug): string {
  switch (slug) {
    case "privacy-policy":
      return PRIVACY_POLICY_HTML;
    case "data-deletion":
      return DATA_DELETION_HTML;
    case "terms-of-service":
      return TERMS_OF_SERVICE_HTML;
    case "cookie-policy":
      return COOKIE_POLICY_HTML;
    case "refund-policy":
      return REFUND_POLICY_HTML;
    case "account-terms":
      return ACCOUNT_TERMS_HTML;
    case "corporate-terms":
      return CORPORATE_TERMS_HTML;
    default:
      return "<p>Content not found.</p>";
  }
}

const PRIVACY_POLICY_HTML = `
<div class="legal-document">

<p class="effective-date"><strong>Effective Date:</strong> 1 March 2026<br>
<strong>Last Updated:</strong> 1 March 2026<br>
<strong>Version:</strong> 1.0</p>

<h2>1. Introduction and Who We Are</h2>

<p>PrintHub ("<strong>PrintHub</strong>", "<strong>we</strong>", "<strong>us</strong>", or
"<strong>our</strong>") is a printing and manufacturing services company operating the website
<strong>printhub.africa</strong> (the "<strong>Platform</strong>"). PrintHub is a company of the
Ezana Group and is registered and operating under the laws of the Republic of Kenya, with its
principal place of business in Eldoret, Kenya.</p>

<p>We are committed to protecting the privacy and personal data of all individuals who interact
with our Platform, including customers, visitors, and corporate clients (collectively
"<strong>you</strong>" or "<strong>Data Subjects</strong>").</p>

<p>This Privacy Policy explains how we collect, use, store, share, and protect your personal
data in accordance with:</p>

<ul>
  <li>The <strong>Kenya Data Protection Act, 2019</strong> (Act No. 24 of 2019) (the
  "<strong>DPA</strong>")</li>
  <li>The <strong>Kenya Data Protection (General) Regulations, 2021</strong></li>
  <li>The <strong>Kenya Data Protection (Registration of Data Controllers and Data Processors)
  Regulations, 2021</strong></li>
  <li>Any other applicable Kenyan laws and regulations governing data protection and privacy</li>
</ul>

<p>By using our Platform, placing an order, submitting a quote request, or creating an account,
you acknowledge that you have read and understood this Privacy Policy and consent to the
processing of your personal data as described herein.</p>

<h2>2. Data Controller Information</h2>

<p>PrintHub acts as the <strong>Data Controller</strong> in respect of personal data collected
through this Platform. As Data Controller, we determine the purposes and means of processing
your personal data.</p>

<p><strong>Data Controller:</strong> PrintHub (An Ezana Group Company)<br>
<strong>Principal Address:</strong> Eldoret, Kenya<br>
<strong>Email:</strong> hello@printhub.africa<br>
<strong>Website:</strong> https://printhub.africa</p>

<p><strong>Data Protection Officer (DPO):</strong><br>
In compliance with Section 24 of the Data Protection Act, 2019, we have designated a Data
Protection Officer. You may contact our DPO for any data protection enquiries at:<br>
<strong>Email:</strong> dpo@printhub.africa<br>
<strong>Post:</strong> The Data Protection Officer, PrintHub, Eldoret, Kenya</p>

<h2>3. Personal Data We Collect</h2>

<p>We collect personal data in the following categories:</p>

<h3>3.1 Data You Provide Directly</h3>

<ul>
  <li><strong>Identity Data:</strong> Full name, username or display name</li>
  <li><strong>Contact Data:</strong> Email address, telephone number (including mobile money
  number), physical address, postal address, county of residence</li>
  <li><strong>Account Data:</strong> Login credentials (email and hashed password), account
  preferences, profile photograph</li>
  <li><strong>Order Data:</strong> Items ordered, service specifications, quantities, delivery
  address, special instructions, production notes</li>
  <li><strong>Payment Data:</strong> M-Pesa transaction reference numbers and phone numbers,
  payment method type (we do not store full card numbers — card payments are processed by
  Pesapal and subject to their PCI-DSS compliant systems), bank transfer references</li>
  <li><strong>Quote Data:</strong> Design files, print specifications, dimensions, materials,
  uploaded design files, images, and 3D model files (STL/OBJ) submitted for quote purposes</li>
  <li><strong>Corporate Data:</strong> Company name, KRA PIN, VAT registration number, industry,
  company size, purchase order references, billing address, company website</li>
  <li><strong>Communications Data:</strong> Messages sent to us via contact forms, support
  tickets, email, or WhatsApp, including their content and metadata</li>
  <li><strong>User-Generated Content:</strong> Product reviews, ratings, photographs uploaded
  with reviews</li>
</ul>

<h3>3.2 Data Collected Automatically</h3>

<ul>
  <li><strong>Technical Data:</strong> IP address, browser type and version, operating system,
  device identifiers, screen resolution</li>
  <li><strong>Usage Data:</strong> Pages visited, links clicked, search queries on our Platform,
  time and date of visits, referring URLs, session duration</li>
  <li><strong>Cookie and Tracking Data:</strong> Data collected via cookies and similar
  technologies as described in our Cookie Policy</li>
  <li><strong>Transaction Data:</strong> Details of products and services purchased, order
  history, quote history, payment history</li>
  <li><strong>Location Data:</strong> Approximate location derived from IP address; precise
  location is not collected unless you expressly provide a delivery address</li>
</ul>

<h3>3.3 Data We Receive from Third Parties</h3>

<ul>
  <li><strong>Authentication Providers:</strong> If you register or log in using Google or
  Facebook OAuth, we receive your name, email address, and profile picture from those services
  in accordance with their respective privacy policies</li>
  <li><strong>Payment Processors:</strong> Confirmation of payment status, transaction references,
  and in the case of M-Pesa, the phone number used for the transaction, from Safaricom (M-Pesa)
  and Pesapal</li>
</ul>

<h2>4. Legal Bases for Processing</h2>

<p>Under Section 30 of the Data Protection Act, 2019, we process your personal data on the
following legal bases:</p>

<table>
  <thead>
    <tr>
      <th>Processing Activity</th>
      <th>Legal Basis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Creating and managing your account</td>
      <td>Contract performance (Section 30(b) DPA)</td>
    </tr>
    <tr>
      <td>Processing orders and payments</td>
      <td>Contract performance (Section 30(b) DPA)</td>
    </tr>
    <tr>
      <td>Sending order confirmations, delivery updates, invoices</td>
      <td>Contract performance (Section 30(b) DPA)</td>
    </tr>
    <tr>
      <td>Fraud prevention and security monitoring</td>
      <td>Legitimate interests (Section 30(d) DPA)</td>
    </tr>
    <tr>
      <td>Improving our Platform and services</td>
      <td>Legitimate interests (Section 30(d) DPA)</td>
    </tr>
    <tr>
      <td>Sending marketing communications (newsletters, promotions)</td>
      <td>Consent (Section 30(a) DPA) — you may opt out at any time</td>
    </tr>
    <tr>
      <td>Retaining financial and tax records</td>
      <td>Legal obligation (Section 30(c) DPA) — Kenya VAT Act, Income Tax Act</td>
    </tr>
    <tr>
      <td>Cookie analytics (Google Analytics, Hotjar)</td>
      <td>Consent (Section 30(a) DPA) — via cookie consent banner</td>
    </tr>
    <tr>
      <td>Responding to legal requests or regulatory enquiries</td>
      <td>Legal obligation (Section 30(c) DPA)</td>
    </tr>
  </tbody>
</table>

<h2>5. How We Use Your Personal Data</h2>

<p>We use the personal data we collect for the following purposes:</p>

<h3>5.1 Service Delivery</h3>
<ul>
  <li>To create, verify, and maintain your account on our Platform</li>
  <li>To process and fulfil orders for printing, 3D printing, and related services</li>
  <li>To process payments via M-Pesa, Pesapal (card), or bank transfer</li>
  <li>To prepare and send quotations for custom printing services</li>
  <li>To arrange delivery of orders to your specified address within Kenya</li>
  <li>To generate tax invoices (including KRA-compliant VAT invoices) for your purchases</li>
  <li>To manage returns, refunds, and cancellations</li>
  <li>To provide customer support through email, WhatsApp, and our ticketing system</li>
</ul>

<h3>5.2 Communications</h3>
<ul>
  <li>To send transactional emails and SMS messages (order confirmations, status updates,
  delivery notifications, payment receipts)</li>
  <li>To send marketing communications where you have provided consent (newsletters, promotions,
  new product announcements)</li>
  <li>To respond to enquiries submitted through our contact form or support ticket system</li>
</ul>

<h3>5.3 Legal and Compliance</h3>
<ul>
  <li>To comply with our obligations under the Kenya Revenue Authority (KRA), including
  maintaining financial records for the periods required by the Income Tax Act and VAT Act</li>
  <li>To respond to lawful requests from government authorities, courts, or regulatory bodies</li>
  <li>To enforce our Terms of Service and protect our legal rights</li>
  <li>To detect, investigate, and prevent fraudulent transactions and abuse of our Platform</li>
</ul>

<h3>5.4 Improvement and Analytics</h3>
<ul>
  <li>To analyse how our Platform is used in order to improve functionality and user experience
  (using anonymised or aggregated data where possible)</li>
  <li>To monitor the performance and security of our Platform</li>
</ul>

<h2>6. Data Sharing and Third-Party Processors</h2>

<p>We do not sell, rent, or trade your personal data to third parties for their own marketing
purposes. We share personal data only as described below.</p>

<h3>6.1 Data Processors</h3>

<p>We engage the following third-party service providers who process personal data on our behalf
as Data Processors under written data processing agreements:</p>

<table>
  <thead>
    <tr>
      <th>Processor</th>
      <th>Role</th>
      <th>Data Shared</th>
      <th>Location</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Vercel Inc.</strong></td>
      <td>Website hosting and infrastructure</td>
      <td>All Platform data (transits through Vercel servers)</td>
      <td>United States</td>
    </tr>
    <tr>
      <td><strong>Neon Inc. / PostgreSQL</strong></td>
      <td>Database hosting</td>
      <td>All stored personal data</td>
      <td>United States</td>
    </tr>
    <tr>
      <td><strong>Cloudflare R2</strong></td>
      <td>File and image storage</td>
      <td>Uploaded files, design files, product images, profile photos</td>
      <td>Distributed (Cloudflare global network)</td>
    </tr>
    <tr>
      <td><strong>Resend Inc.</strong></td>
      <td>Transactional email delivery</td>
      <td>Name, email address, order details in email content</td>
      <td>United States</td>
    </tr>
    <tr>
      <td><strong>Africa's Talking Ltd.</strong></td>
      <td>SMS notifications</td>
      <td>Phone number, message content (order status)</td>
      <td>Kenya</td>
    </tr>
    <tr>
      <td><strong>Safaricom PLC (M-Pesa)</strong></td>
      <td>Mobile money payment processing</td>
      <td>Phone number, payment amount, transaction reference</td>
      <td>Kenya</td>
    </tr>
    <tr>
      <td><strong>Pesapal Ltd.</strong></td>
      <td>Card and Airtel Money payment processing</td>
      <td>Name, email, order amount, payment status</td>
      <td>Kenya</td>
    </tr>
    <tr>
      <td><strong>Google LLC</strong></td>
      <td>OAuth authentication (optional), Google Analytics (with consent)</td>
      <td>Name, email, profile picture (OAuth); usage data (Analytics)</td>
      <td>United States</td>
    </tr>
    <tr>
      <td><strong>Meta Platforms Inc. (Facebook)</strong></td>
      <td>OAuth authentication (optional)</td>
      <td>Name, email, profile picture</td>
      <td>United States</td>
    </tr>
    <tr>
      <td><strong>Sentry Inc.</strong></td>
      <td>Error monitoring and crash reporting</td>
      <td>Technical error data, user ID (anonymised where possible)</td>
      <td>United States</td>
    </tr>
  </tbody>
</table>

<h3>6.2 Cross-Border Data Transfers</h3>

<p>Several of our Data Processors are located outside Kenya. Under Section 49 of the Data
Protection Act, 2019, we ensure that any transfer of personal data outside Kenya is carried out
only where:</p>
<ul>
  <li>The recipient country provides an adequate level of data protection; or</li>
  <li>We have put in place appropriate safeguards, including contractual clauses consistent with
  those prescribed by the Data Commissioner; or</li>
  <li>The transfer is necessary for the performance of a contract with you</li>
</ul>

<h3>6.3 Disclosure Required by Law</h3>

<p>We may disclose your personal data if required to do so by a court order, warrant, subpoena,
or other lawful process issued by a Kenyan court or competent authority, including the Office of
the Data Protection Commissioner (ODPC), the Kenya Revenue Authority, or law enforcement agencies
acting under lawful authority.</p>

<h3>6.4 Business Transfers</h3>

<p>In the event of a merger, acquisition, restructuring, or sale of all or substantially all of
the assets of PrintHub or Ezana Group, your personal data may be transferred to the acquiring
entity, provided that the acquiring entity agrees to be bound by this Privacy Policy or a policy
that provides equivalent protections.</p>

<h2>7. Data Retention</h2>

<p>We retain personal data only for as long as necessary to fulfil the purposes for which it was
collected, subject to the following minimum retention periods:</p>

<table>
  <thead>
    <tr>
      <th>Category of Data</th>
      <th>Retention Period</th>
      <th>Basis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Order and transaction records (including invoices)</td>
      <td>7 years from date of transaction</td>
      <td>Kenya Income Tax Act, VAT Act — KRA compliance</td>
    </tr>
    <tr>
      <td>Account data (active accounts)</td>
      <td>Duration of account existence plus 2 years</td>
      <td>Legitimate interests and contract</td>
    </tr>
    <tr>
      <td>Account data after deletion request</td>
      <td>Anonymised immediately; financial records retained per above</td>
      <td>DPA Section 41 right to erasure</td>
    </tr>
    <tr>
      <td>Customer communications and support tickets</td>
      <td>3 years from last interaction</td>
      <td>Legitimate interests (dispute resolution)</td>
    </tr>
    <tr>
      <td>Uploaded design files and print files</td>
      <td>90 days after order completion or quote closure</td>
      <td>Service delivery and dispute resolution</td>
    </tr>
    <tr>
      <td>Marketing consent records</td>
      <td>5 years from consent or until withdrawal</td>
      <td>Legal obligation to demonstrate consent</td>
    </tr>
    <tr>
      <td>Website analytics data</td>
      <td>26 months (Google Analytics default)</td>
      <td>Consent</td>
    </tr>
    <tr>
      <td>Server and access logs</td>
      <td>90 days</td>
      <td>Security and fraud prevention</td>
    </tr>
    <tr>
      <td>Guest order data (non-registered users)</td>
      <td>90 days after order completion</td>
      <td>Service delivery; financial records retained per above</td>
    </tr>
  </tbody>
</table>

<h2>8. Your Rights Under the Data Protection Act, 2019</h2>

<p>The Kenya Data Protection Act, 2019 grants you the following rights in relation to your
personal data. You may exercise these rights by contacting us at
<strong>dpo@printhub.africa</strong> or through your account settings.</p>

<h3>8.1 Right of Access (Section 26(a) DPA)</h3>
<p>You have the right to request confirmation of whether we process your personal data and, if
so, to receive a copy of that data together with information about how it is processed. We will
respond within <strong>21 days</strong> of receiving your request.</p>

<h3>8.2 Right to Rectification (Section 26(b) DPA)</h3>
<p>You have the right to request correction of inaccurate or incomplete personal data held about
you. You may update most of your data directly through your account settings. For data you cannot
update yourself, contact us at dpo@printhub.africa.</p>

<h3>8.3 Right to Erasure (Section 26(c) DPA)</h3>
<p>You have the right to request deletion of your personal data where:</p>
<ul>
  <li>The data is no longer necessary for the purpose for which it was collected;</li>
  <li>You withdraw consent and there is no other legal basis for processing;</li>
  <li>You object to processing and there are no overriding legitimate grounds;</li>
  <li>The data has been unlawfully processed</li>
</ul>
<p><strong>Note:</strong> We cannot delete data that we are legally required to retain (such as
financial records required by KRA). In such cases, we will anonymise your personal identifiers
while retaining the necessary financial data.</p>
<p>For full deletion steps and timelines, please see our
<a href="/data-deletion">Data Deletion Request</a> page.</p>

<h3>8.4 Right to Object (Section 26(d) DPA)</h3>
<p>You have the right to object to processing of your personal data based on our legitimate
interests, including direct marketing. Where you object to direct marketing, we will cease
processing your data for that purpose immediately.</p>

<h3>8.5 Right to Data Portability (Section 26(e) DPA)</h3>
<p>You have the right to receive your personal data in a structured, commonly used, and
machine-readable format (JSON), and to request that we transmit your data to another Data
Controller where technically feasible. You may download your data from your Account Settings →
Privacy → Download My Data.</p>

<h3>8.6 Right to Withdraw Consent</h3>
<p>Where we process your data based on consent (marketing emails, analytics cookies), you may
withdraw your consent at any time without affecting the lawfulness of processing carried out prior
to withdrawal. You may withdraw consent via:</p>
<ul>
  <li>Unsubscribing from marketing emails using the link in any email we send you</li>
  <li>Updating your notification preferences in Account Settings</li>
  <li>Updating your cookie preferences via the cookie consent banner on our Platform</li>
</ul>

<h3>8.7 Right to Lodge a Complaint</h3>
<p>If you are dissatisfied with how we handle your personal data, you have the right to lodge
a complaint with the <strong>Office of the Data Protection Commissioner (ODPC)</strong>:</p>
<p>
Office of the Data Protection Commissioner<br>
Website: <a href="https://www.odpc.go.ke" target="_blank">www.odpc.go.ke</a><br>
Email: info@odpc.go.ke<br>
Telephone: +254 20 2628 000
</p>
<p>We encourage you to contact us first at dpo@printhub.africa so we can attempt to resolve
your concern before escalating to the ODPC.</p>

<h2>9. Security of Your Personal Data</h2>

<p>We implement appropriate technical and organisational security measures to protect your
personal data against unauthorised access, alteration, disclosure, or destruction, including:</p>

<ul>
  <li>All data transmitted to and from our Platform is encrypted in transit using
  TLS 1.2 or higher (HTTPS)</li>
  <li>Passwords are stored as one-way salted hashes using bcrypt — we never store plaintext
  passwords</li>
  <li>Payment data is handled exclusively by PCI-DSS compliant payment processors (Safaricom
  M-Pesa, Pesapal) — we do not store full card numbers on our systems</li>
  <li>Access to personal data is restricted to authorised staff on a need-to-know basis</li>
  <li>Our database and file storage infrastructure is hosted with providers that maintain
  SOC 2 and ISO 27001 certifications</li>
  <li>We conduct regular security reviews and promptly address identified vulnerabilities</li>
  <li>Uploaded files containing customer designs are stored in private (non-publicly accessible)
  storage and are only accessible via expiring signed URLs</li>
</ul>

<p>Despite these measures, no method of transmission over the internet is 100% secure. In the
event of a personal data breach that is likely to result in a risk to your rights and freedoms,
we will notify the ODPC within <strong>72 hours</strong> of becoming aware of the breach, and
we will notify affected data subjects without undue delay, as required by Section 43 of the
Data Protection Act, 2019.</p>

<h2>10. Children's Privacy</h2>

<p>Our Platform is not directed at children under the age of 18. We do not knowingly collect
personal data from minors. If you are a parent or guardian and believe your child has provided
us with personal data without your consent, please contact us at hello@printhub.africa and we
will delete that data promptly.</p>

<h2>11. Links to Third-Party Websites</h2>

<p>Our Platform may contain links to third-party websites, including our social media pages.
We are not responsible for the privacy practices of those websites. We encourage you to review
the privacy policies of any third-party website you visit.</p>

<h2>12. Changes to This Privacy Policy</h2>

<p>We reserve the right to update this Privacy Policy at any time. When we make material
changes, we will:</p>
<ul>
  <li>Update the "Last Updated" date at the top of this Policy;</li>
  <li>Display a prominent notice on our Platform; and</li>
  <li>Where required by law, seek your renewed consent</li>
</ul>
<p>Your continued use of our Platform following the publication of changes constitutes your
acceptance of the revised Policy, to the extent permitted by law.</p>

<h2>13. Contact Us</h2>

<p>For any questions, requests, or concerns regarding this Privacy Policy or our data processing
practices, please contact:</p>

<p>
<strong>Data Protection Officer</strong><br>
PrintHub — An Ezana Group Company<br>
Eldoret, Kenya<br>
Email: dpo@printhub.africa<br>
General enquiries: hello@printhub.africa<br>
Website: https://printhub.africa
</p>

</div>
`;

const TERMS_OF_SERVICE_HTML = `
<div class="legal-document">

<p class="effective-date"><strong>Effective Date:</strong> 1 March 2026<br>
<strong>Last Updated:</strong> 1 March 2026<br>
<strong>Version:</strong> 1.0</p>

<h2>1. Introduction</h2>

<p>These Terms of Service ("<strong>Terms</strong>") constitute a legally binding agreement
between you ("<strong>you</strong>", "<strong>Customer</strong>", or "<strong>User</strong>")
and <strong>PrintHub</strong> ("<strong>PrintHub</strong>", "<strong>we</strong>",
"<strong>us</strong>", or "<strong>our</strong>"), a company of the Ezana Group operating under
the laws of the Republic of Kenya.</p>

<p>By accessing or using the PrintHub website at <strong>printhub.africa</strong> (the
"<strong>Platform</strong>"), placing an order, submitting a quote request, or creating an
account, you agree to be bound by these Terms in their entirety. If you do not agree to these
Terms, you must not use our Platform or services.</p>

<p>These Terms are governed by and shall be construed in accordance with the laws of the
<strong>Republic of Kenya</strong>, including but not limited to the Consumer Protection Act,
2012, the Law of Contract Act (Cap. 23), the Kenya Information and Communications Act (Cap. 411A),
and the Data Protection Act, 2019.</p>

<h2>2. Definitions</h2>

<p>In these Terms:</p>
<ul>
  <li>"<strong>Account</strong>" means a registered user account on our Platform</li>
  <li>"<strong>Custom Order</strong>" means any product or service that is produced to your
  specific requirements, including but not limited to printed banners, signage, vehicle wraps,
  custom 3D prints, and bespoke branded materials</li>
  <li>"<strong>Ready-Made Product</strong>" means any product listed for immediate purchase in
  our online shop that is not produced to your specific requirements</li>
  <li>"<strong>Services</strong>" means all printing, 3D printing, design, finishing, and related
  services offered by PrintHub through the Platform</li>
  <li>"<strong>Order</strong>" means a confirmed purchase of Products or Services placed through
  the Platform</li>
  <li>"<strong>Quote</strong>" means a non-binding estimate of price provided by PrintHub for
  Custom Orders, which becomes binding only upon formal acceptance</li>
  <li>"<strong>Corporate Account</strong>" means an approved business account with agreed
  commercial terms</li>
  <li>"<strong>KES</strong>" means Kenya Shillings, the lawful currency of the Republic of Kenya</li>
  <li>"<strong>VAT</strong>" means Value Added Tax at the rate of 16% as prescribed under the
  Kenya VAT Act, 2013</li>
</ul>

<h2>3. Eligibility and Account Registration</h2>

<h3>3.1 Age Requirement</h3>
<p>You must be at least <strong>18 years of age</strong> to use our Platform and to enter into
a binding contract with PrintHub. By using our Platform, you represent and warrant that you are
18 years of age or older and have the legal capacity to enter into contracts under Kenyan law.
If you are registering on behalf of a company or organisation, you represent that you have the
authority to bind that entity to these Terms.</p>

<h3>3.2 Account Creation</h3>
<p>You may browse our Platform without creating an account. However, to place orders, submit
quote requests, and access order history, you must register for an account. When registering,
you agree to:</p>
<ul>
  <li>Provide accurate, current, and complete information</li>
  <li>Maintain and promptly update your information to keep it accurate</li>
  <li>Maintain the security and confidentiality of your password</li>
  <li>Accept responsibility for all activities that occur under your account</li>
  <li>Notify us immediately at hello@printhub.africa if you suspect unauthorised use of
  your account</li>
</ul>

<h3>3.3 Account Security</h3>
<p>You are solely responsible for maintaining the confidentiality of your account credentials.
PrintHub will never ask for your password by email, phone, or any other communication. We reserve
the right to terminate accounts where we reasonably suspect a security breach or violation of
these Terms.</p>

<h2>4. Our Services</h2>

<h3>4.1 Services Offered</h3>
<p>PrintHub offers the following services through its Platform:</p>
<ul>
  <li><strong>Large Format Printing:</strong> Vinyl banners, mesh banners, canvas prints,
  billboards, pull-up banners, vehicle wraps, window graphics, floor graphics, and other
  large format printed materials</li>
  <li><strong>3D Printing Services:</strong> Fused Deposition Modelling (FDM) and resin 3D
  printing using materials including PLA, PETG, ABS, TPU, and photopolymer resin</li>
  <li><strong>Corporate Branded Materials:</strong> Branded stationery, event materials,
  promotional items, and other business collateral</li>
  <li><strong>Design Services:</strong> Graphic design and file preparation services as
  quoted separately</li>
  <li><strong>Print-on-Demand Catalogue:</strong> Ready-made customisable products from our
  catalogue for individual purchase</li>
  <li><strong>Delivery Services:</strong> Delivery of completed orders to addresses within
  Kenya via our logistics partners</li>
</ul>

<h3>4.2 Service Availability</h3>
<p>We reserve the right to modify, suspend, or discontinue any service at any time, with or
without notice, subject to refunding any amounts paid for services not yet rendered. We do not
guarantee that our Platform will be available at all times and accept no liability for service
interruptions beyond our reasonable control.</p>

<h3>4.3 Accuracy of Information</h3>
<p>While we take care to ensure the accuracy of information on our Platform, including product
descriptions, specifications, and pricing, errors may occasionally occur. We reserve the right
to correct any errors and to cancel orders placed based on incorrect pricing, subject to
notifying you promptly and providing a full refund.</p>

<h2>5. Pricing, Currency, and VAT</h2>

<h3>5.1 Currency</h3>
<p>All prices on our Platform are displayed in <strong>Kenya Shillings (KES)</strong>. We do not
accept foreign currency.</p>

<h3>5.2 VAT</h3>
<p>All prices displayed on our Platform are <strong>inclusive of Value Added Tax (VAT) at the
rate of 16%</strong> as required under the Kenya VAT Act, 2013, unless expressly stated
otherwise. A tax invoice detailing the VAT charged will be issued for every completed order.</p>

<h3>5.3 Price Changes</h3>
<p>Prices are subject to change without notice, except that once an Order is confirmed and
payment is received, the price shall not increase. For Quotes, the quoted price is valid for
<strong>14 days</strong> from the date of issue unless otherwise stated.</p>

<h3>5.4 Custom Order Pricing</h3>
<p>Prices for Custom Orders are provided through our quotation system. Quote prices are estimates
based on the information provided at the time of submission. The final price may vary if:</p>
<ul>
  <li>The specifications change after the quote is issued</li>
  <li>The submitted files require significant correction or redesign</li>
  <li>The quantity or scope of the order changes</li>
</ul>
<p>We will notify you of any price adjustment before proceeding with production.</p>

<h2>6. Ordering Process</h2>

<h3>6.1 Placing an Order</h3>
<p>When you place an order through our Platform, you are making an offer to purchase products or
services at the stated price. An Order is confirmed and a binding contract is formed when we send
you an Order Confirmation email containing your order reference number. We reserve the right to
decline any order at our sole discretion.</p>

<h3>6.2 Quote Requests</h3>
<p>Submitting a quote request does not constitute a binding Order. A binding contract for a Custom
Order is only formed when you formally accept the quote provided by PrintHub and make the
required payment (or arrange credit terms where applicable).</p>

<h3>6.3 Your Responsibility for File Quality</h3>
<p>For Custom Orders, you are solely responsible for the quality and suitability of the files you
submit for printing. We strongly recommend reviewing our file preparation guidelines available at
<strong>printhub.africa/file-prep</strong> before submitting your files. PrintHub is not liable
for poor print quality resulting from low-resolution images, incorrect colour profiles, missing
bleeds, or other file defects that were present in your submitted files and not detectable during
our standard pre-press check.</p>

<h3>6.4 Intellectual Property in Submitted Files</h3>
<p>By submitting files and designs for printing, you represent and warrant that:</p>
<ul>
  <li>You are the owner or licensee of all intellectual property rights in the submitted files</li>
  <li>The printing of those files does not infringe any third-party intellectual property rights,
  including copyright, trademarks, and design rights</li>
  <li>The submitted content does not violate any applicable law</li>
</ul>
<p>You grant PrintHub a limited, non-exclusive licence to use your submitted files solely for the
purpose of fulfilling your Order. We do not claim ownership of your designs.</p>

<h3>6.5 Prohibited Content</h3>
<p>We reserve the right to refuse to print any content that:</p>
<ul>
  <li>Infringes the intellectual property rights of any third party</li>
  <li>Is defamatory, obscene, or pornographic</li>
  <li>Promotes hatred, discrimination, or violence against any person or group</li>
  <li>Violates any Kenyan law, including the Penal Code and the Computer Misuse and Cybercrimes
  Act, 2018</li>
  <li>Is otherwise objectionable in our sole and reasonable discretion</li>
</ul>

<h2>7. Payment</h2>

<h3>7.1 Accepted Payment Methods</h3>
<p>We accept the following payment methods:</p>
<ul>
  <li><strong>M-Pesa STK Push:</strong> Instant payment via Safaricom M-Pesa to your
  registered mobile number</li>
  <li><strong>M-Pesa Paybill / Till:</strong> Manual payment to Paybill Number 522522
  (or Till Number as displayed at checkout)</li>
  <li><strong>Airtel Money:</strong> Via Pesapal payment gateway</li>
  <li><strong>Debit and Credit Cards:</strong> Visa and Mastercard, processed by Pesapal</li>
  <li><strong>Cash on Pickup:</strong> Available for orders collected from our premises</li>
  <li><strong>Corporate Invoice (NET-30 / NET-60):</strong> Available to approved Corporate
  Account holders only</li>
</ul>

<h3>7.2 Payment Timing</h3>
<p>Payment is required in full at the time of placing your Order, unless you hold an approved
Corporate Account with credit terms. Production will not commence until payment is confirmed.
For manual M-Pesa payments (Paybill), production commences once our team verifies receipt of
your payment, which may take up to <strong>4 business hours</strong>.</p>

<h3>7.3 Payment Security</h3>
<p>Card payments are processed exclusively by Pesapal, a PCI-DSS Level 1 certified payment
processor. M-Pesa payments are processed by Safaricom PLC. PrintHub does not store your card
numbers on our systems. M-Pesa transaction reference numbers are stored solely for reconciliation
and refund purposes.</p>

<h3>7.4 Failed Payments</h3>
<p>If payment fails or is not confirmed, your Order will not be processed. You will be notified
and given the opportunity to complete payment using an alternative method. PrintHub is not liable
for any loss arising from a failed payment.</p>

<h3>7.5 Invoices and Receipts</h3>
<p>A KRA-compliant tax invoice will be issued for every completed Order. Invoices are available
for download from your Account dashboard and will be sent to your registered email address. Our
KRA PIN and VAT registration number are stated on all invoices.</p>

<h2>8. Production and Delivery</h2>

<h3>8.1 Production Timelines</h3>
<p>Estimated production times are as follows (business days, after payment confirmation):</p>
<ul>
  <li>Standard shop products: <strong>1–2 business days</strong></li>
  <li>Large format printing (banners, signage): <strong>1–3 business days</strong></li>
  <li>3D printing (FDM): <strong>2–5 business days</strong> (depending on complexity)</li>
  <li>3D printing (Resin): <strong>3–7 business days</strong></li>
  <li>Custom orders (quoted): as specified in the accepted quote</li>
</ul>
<p>Production timelines are estimates and are not guaranteed. We will notify you if there is a
delay. Public holidays and force majeure events may affect timelines.</p>

<h3>8.2 Delivery</h3>
<p>We deliver to all 47 counties in Kenya. Delivery fees are calculated based on your location
and displayed at checkout before payment. Delivery timelines are in addition to production
timelines. PrintHub works with third-party logistics partners for upcountry deliveries; delivery
timelines provided by those partners are estimates only.</p>

<h3>8.3 Risk and Title</h3>
<p>Risk of loss and title to the goods pass to you upon delivery to the address you specified, or
upon collection from our premises if you selected pickup. If delivery is attempted and you are
not available, a rescheduling fee may apply.</p>

<h3>8.4 Delivery Inspection</h3>
<p>You are responsible for inspecting your delivery upon receipt. Any claims for damage in transit
must be reported to us within <strong>48 hours</strong> of delivery with photographic evidence.
Claims reported after this period may not be accepted.</p>

<h2>9. Cancellations</h2>

<h3>9.1 Customer Cancellation — Before Production</h3>
<p>You may cancel an Order at any time before production commences (typically before the status
changes to "In Production") by logging into your Account and selecting "Cancel Order", or by
contacting us at hello@printhub.africa. A full refund will be issued within 5 business days.</p>

<h3>9.2 Customer Cancellation — After Production Commences</h3>
<p>Once production has commenced, you may not cancel a Custom Order as materials and production
time will have been committed. You must contact our support team via WhatsApp on +254 727 410 320
to discuss your options. In exceptional circumstances, a partial refund may be offered at our
discretion after deducting costs already incurred.</p>

<h3>9.3 Our Right to Cancel</h3>
<p>We reserve the right to cancel any Order at any time where:</p>
<ul>
  <li>We are unable to fulfil the order due to material or equipment unavailability</li>
  <li>The submitted files violate our Prohibited Content policy (Clause 6.5)</li>
  <li>Payment cannot be confirmed</li>
  <li>There is a pricing error on our Platform</li>
  <li>Force majeure circumstances prevent fulfilment</li>
</ul>
<p>In any such case, we will provide you with full notice and a complete refund of any amounts
paid.</p>

<h2>10. Warranties and Quality Guarantee</h2>

<h3>10.1 Our Quality Commitment</h3>
<p>We warrant that all products and services will be of satisfactory quality and will materially
conform to the specifications agreed at the time of order. If you receive a product that is
defective, materially different from what you ordered, or damaged in transit, we will, at our
option, either reprint the order at no additional cost to you or provide a full refund.</p>

<h3>10.2 Limitation on Quality Warranty</h3>
<p>Our quality warranty does not extend to defects arising from:</p>
<ul>
  <li>Low-resolution, incorrectly formatted, or otherwise defective files submitted by you</li>
  <li>Colour variations between digital displays and printed output (minor colour variation is
  inherent in the printing process; we recommend submitting CMYK files for colour-critical work)</li>
  <li>Your failure to review and approve a digital proof where one was offered</li>
  <li>Normal wear and tear of printed materials after delivery</li>
  <li>Misuse or inappropriate application of printed materials</li>
</ul>

<h2>11. Limitation of Liability</h2>

<h3>11.1 General Limitation</h3>
<p>To the maximum extent permitted by Kenyan law, PrintHub's total liability to you for any
claim arising out of or in connection with your use of our Platform or Services shall not exceed
the total amount paid by you for the specific Order giving rise to the claim.</p>

<h3>11.2 Exclusion of Consequential Loss</h3>
<p>PrintHub shall not be liable for any indirect, incidental, special, or consequential loss or
damage, including loss of profits, loss of business, loss of goodwill, or loss of anticipated
savings, even if advised of the possibility of such loss. This exclusion does not apply to
liability for personal injury, death caused by our negligence, or any other liability that cannot
be excluded by law.</p>

<h3>11.3 Consumer Rights</h3>
<p>Nothing in these Terms limits or excludes any rights you have as a consumer under the
<strong>Consumer Protection Act, 2012</strong> or any other mandatory consumer protection
legislation in Kenya that cannot be excluded by contract.</p>

<h2>12. Intellectual Property</h2>

<h3>12.1 Our Intellectual Property</h3>
<p>All content on our Platform, including text, graphics, logos, images, software, and the
overall design of the Platform, is the intellectual property of PrintHub or its licensors and
is protected by Kenyan and international copyright and trademark laws. You may not reproduce,
distribute, modify, or create derivative works from any of our intellectual property without our
prior written consent.</p>

<h3>12.2 Your Intellectual Property</h3>
<p>You retain ownership of all intellectual property in the files, designs, and content you
submit to us. By submitting content, you grant us only the limited licence described in
Clause 6.4 of these Terms.</p>

<h2>13. Governing Law and Dispute Resolution</h2>

<h3>13.1 Governing Law</h3>
<p>These Terms and any dispute or claim arising out of or in connection with them shall be
governed by and construed in accordance with the laws of the <strong>Republic of Kenya</strong>.</p>

<h3>13.2 Dispute Resolution</h3>
<p>In the event of a dispute, we encourage you to contact us first at hello@printhub.africa or
via WhatsApp on +254 727 410 320. Most disputes can be resolved amicably and promptly without
the need for formal proceedings.</p>

<p>If a dispute cannot be resolved through direct negotiation, either party may refer the matter
to mediation administered by the <strong>Nairobi Centre for International Arbitration (NCIA)</strong>
before resorting to litigation.</p>

<h3>13.3 Jurisdiction</h3>
<p>Subject to Clause 13.2, each party irrevocably submits to the exclusive jurisdiction of the
courts of <strong>Eldoret, Kenya</strong> for the resolution of any dispute that cannot be
resolved by mediation.</p>

<h2>14. Force Majeure</h2>

<p>PrintHub shall not be liable for any delay or failure to perform its obligations under these
Terms where such delay or failure results from circumstances beyond our reasonable control,
including but not limited to acts of God, floods, fires, earthquakes, epidemics, government
actions, strikes, power failures, internet or telecommunications failures, or disruption of
third-party services (including Safaricom M-Pesa and courier services). In such circumstances,
we will notify you as soon as practicable and work to resume normal service as soon as possible.
If a force majeure event continues for more than 30 days, either party may cancel an affected
Order and a full refund will be issued.</p>

<h2>15. Amendments to These Terms</h2>

<p>We reserve the right to amend these Terms at any time. Amendments will be posted on our
Platform with a revised "Last Updated" date. Where changes are material, we will provide
prominent notice on the Platform and, where appropriate, notify registered users by email.
Your continued use of the Platform after the effective date of any amendments constitutes
your acceptance of the revised Terms.</p>

<h2>16. Severability</h2>

<p>If any provision of these Terms is found to be invalid, unlawful, or unenforceable by a
court of competent jurisdiction, that provision shall be severed from the remainder of the Terms,
which shall continue in full force and effect.</p>

<h2>17. Entire Agreement</h2>

<p>These Terms, together with our Privacy Policy, Cookie Policy, and Refund and Returns Policy
(each incorporated herein by reference), constitute the entire agreement between you and
PrintHub with respect to your use of our Platform and Services, and supersede all prior
agreements and understandings.</p>

<h2>18. Contact Information</h2>

<p>For any questions regarding these Terms, please contact:</p>
<p>
<strong>PrintHub — An Ezana Group Company</strong><br>
Eldoret, Kenya<br>
Email: hello@printhub.africa<br>
WhatsApp: +254 727 410 320<br>
Website: https://printhub.africa
</p>

</div>
`;

const COOKIE_POLICY_HTML = `
<div class="legal-document">

<p class="effective-date"><strong>Effective Date:</strong> 1 March 2026<br>
<strong>Last Updated:</strong> 1 March 2026<br>
<strong>Version:</strong> 1.0</p>

<h2>1. What Are Cookies?</h2>

<p>Cookies are small text files that are placed on your device (computer, tablet, or smartphone)
when you visit a website. Cookies are widely used to make websites work efficiently, to remember
your preferences, and to provide information to website owners about how their sites are being
used.</p>

<p>Similar technologies include web beacons (also known as pixel tags or clear GIFs), local
storage, and session storage. In this Cookie Policy, we refer to all such technologies
collectively as "<strong>cookies</strong>".</p>

<h2>2. Our Legal Basis for Using Cookies</h2>

<p>We use cookies in accordance with the <strong>Kenya Data Protection Act, 2019</strong> and
the principles established thereunder. Specifically:</p>
<ul>
  <li><strong>Strictly necessary cookies</strong> are used on the basis of our legitimate
  interests (and yours) in operating a functional website — these do not require your consent</li>
  <li><strong>Analytics, marketing, and preference cookies</strong> are used only with your
  <strong>prior, informed, and freely given consent</strong>, obtained via our cookie consent
  banner</li>
</ul>
<p>You may withdraw your consent at any time by updating your cookie preferences using the
"Manage Cookie Preferences" link in the footer of our website.</p>

<h2>2A. GDPR and UK GDPR Compliance</h2>

<p>Where EU or UK data protection law applies to your use of our Platform (see our Privacy
Policy, Section 1.1 for when this applies), our cookie consent mechanism is designed to meet
the requirements of:</p>
<ul>
  <li><strong>GDPR Recital 32 and Article 7</strong> — consent must be freely given, specific,
  informed, unambiguous, and withdrawable at any time</li>
  <li><strong>Article 5(3) of the ePrivacy Directive (as implemented in EU member states)</strong>
  — prior consent is required before storing or accessing non-essential information on a
  user's device</li>
  <li><strong>UK GDPR and the Privacy and Electronic Communications Regulations (PECR)</strong>
  — substantially equivalent requirements apply for UK users</li>
  <li><strong>Kenya Data Protection Act 2019</strong> — consent must be informed and specific</li>
</ul>

<h3>Consent Standards We Apply</h3>
<ul>
  <li><strong>Prior consent:</strong> Non-essential cookies are not set until you have actively
  consented via our cookie banner — we do not use pre-ticked boxes</li>
  <li><strong>Granular consent:</strong> You can consent to analytics cookies independently
  of marketing cookies — we provide category-level toggles</li>
  <li><strong>Informed consent:</strong> This Cookie Policy describes each cookie by name,
  provider, purpose, and duration before you consent</li>
  <li><strong>Freely given:</strong> Refusing non-essential cookies does not prevent you from
  using our Platform — essential functionality remains available regardless of your choice</li>
  <li><strong>Withdrawable:</strong> You may withdraw consent at any time via "Manage Cookie
  Preferences" in our footer — this is as easy as giving consent</li>
  <li><strong>Recorded:</strong> We record the time, version, and categories of consent given
  for each user as required by GDPR Article 7(1)</li>
  <li><strong>Age-appropriate:</strong> We do not knowingly direct our Platform at children
  under 13, and we do not serve marketing cookies to users we have reason to believe are
  under 16 (the default GDPR age of digital consent)</li>
</ul>

<h2>3. Categories of Cookies We Use</h2>

<h3>3.1 Strictly Necessary Cookies</h3>

<p>These cookies are essential for the operation of our Platform. Without them, services you
have requested (such as maintaining your login session or your shopping cart) cannot be provided.
These cookies <strong>do not require your consent</strong>.</p>

<table>
  <thead>
    <tr>
      <th>Cookie Name</th>
      <th>Provider</th>
      <th>Purpose</th>
      <th>Duration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>next-auth.session-token</code></td>
      <td>PrintHub</td>
      <td>Maintains your authenticated login session. Allows you to stay logged in
      as you navigate between pages.</td>
      <td>30 days (rolling)</td>
    </tr>
    <tr>
      <td><code>next-auth.csrf-token</code></td>
      <td>PrintHub</td>
      <td>Cross-Site Request Forgery (CSRF) protection token. Prevents unauthorised
      actions being submitted on your behalf.</td>
      <td>Session</td>
    </tr>
    <tr>
      <td><code>next-auth.callback-url</code></td>
      <td>PrintHub</td>
      <td>Stores the URL to redirect you to after login completion.</td>
      <td>Session</td>
    </tr>
    <tr>
      <td><code>ph-cart</code></td>
      <td>PrintHub</td>
      <td>Stores your shopping cart contents so your basket is remembered even if
      you are not logged in or navigate away from the page.</td>
      <td>7 days</td>
    </tr>
    <tr>
      <td><code>cookie_consent</code></td>
      <td>PrintHub</td>
      <td>Stores your cookie consent preference so we do not show the consent banner
      on every visit.</td>
      <td>12 months</td>
    </tr>
    <tr>
      <td><code>__cf_bm</code></td>
      <td>Cloudflare</td>
      <td>Bot management and security. Distinguishes between humans and automated
      traffic to protect our Platform from malicious bots.</td>
      <td>30 minutes</td>
    </tr>
    <tr>
      <td><code>_cfuvid</code></td>
      <td>Cloudflare</td>
      <td>Rate limiting. Used by Cloudflare to apply rate limits to prevent abuse of
      our APIs and services.</td>
      <td>Session</td>
    </tr>
  </tbody>
</table>

<h3>3.2 Analytics Cookies</h3>

<p>These cookies allow us to count visits and measure traffic sources so we can measure and
improve the performance of our Platform. They help us understand which pages are most and least
popular and how visitors navigate the site. <strong>All information collected is aggregated and
anonymous</strong>. These cookies are only placed with your consent.</p>

<table>
  <thead>
    <tr>
      <th>Cookie Name</th>
      <th>Provider</th>
      <th>Purpose</th>
      <th>Duration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>_ga</code></td>
      <td>Google Analytics (Google LLC)</td>
      <td>Registers a unique ID to generate statistical data on how you use our
      website. Used to distinguish users.</td>
      <td>2 years</td>
    </tr>
    <tr>
      <td><code>_ga_[ID]</code></td>
      <td>Google Analytics 4 (Google LLC)</td>
      <td>Used by Google Analytics 4 to persist session state and measure usage
      statistics across sessions.</td>
      <td>2 years</td>
    </tr>
    <tr>
      <td><code>_gid</code></td>
      <td>Google Analytics (Google LLC)</td>
      <td>Registers a unique ID used to generate statistical data on how you use
      our website. Resets daily.</td>
      <td>24 hours</td>
    </tr>
    <tr>
      <td><code>_gat</code></td>
      <td>Google Analytics (Google LLC)</td>
      <td>Used to throttle request rate to Google Analytics servers.</td>
      <td>1 minute</td>
    </tr>
    <tr>
      <td><code>_hjid</code></td>
      <td>Hotjar Ltd.</td>
      <td>Sets a unique user ID to track how you interact with our website. Used
      to understand user behaviour and improve our user experience.</td>
      <td>1 year</td>
    </tr>
    <tr>
      <td><code>_hjSession_[ID]</code></td>
      <td>Hotjar Ltd.</td>
      <td>Holds current session data to ensure that subsequent requests in the same
      session window are attributed to the same session.</td>
      <td>30 minutes</td>
    </tr>
    <tr>
      <td><code>_hjAbsoluteSessionInProgress</code></td>
      <td>Hotjar Ltd.</td>
      <td>Detects the first pageview session of a user to prevent recording from
      beginning unnecessarily.</td>
      <td>30 minutes</td>
    </tr>
  </tbody>
</table>

<p><em>Google Analytics is operated by Google LLC (United States). Data collected is transmitted
to Google's servers. Google's privacy policy is available at
<a href="https://policies.google.com/privacy" target="_blank">policies.google.com/privacy</a>.
You may opt out of Google Analytics across all websites at
<a href="https://tools.google.com/dlpage/gaoptout" target="_blank">tools.google.com/dlpage/gaoptout</a>.
Hotjar is operated by Hotjar Ltd. (Malta). Hotjar's privacy policy is available at
<a href="https://www.hotjar.com/privacy" target="_blank">www.hotjar.com/privacy</a>.</em></p>

<h3>3.3 Marketing and Advertising Cookies</h3>

<p>These cookies are used to deliver advertisements more relevant to you and your interests.
They may also be used to limit the number of times you see an advertisement and to measure the
effectiveness of advertising campaigns. They are usually placed by advertising networks with our
permission. <strong>These cookies are only placed with your consent.</strong></p>

<table>
  <thead>
    <tr>
      <th>Cookie Name</th>
      <th>Provider</th>
      <th>Purpose</th>
      <th>Duration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>_fbp</code></td>
      <td>Meta Platforms Inc. (Facebook/Instagram)</td>
      <td>Used by Meta to deliver a series of advertisement products on Facebook and
      Instagram, such as real-time bidding from third-party advertisers.</td>
      <td>3 months</td>
    </tr>
    <tr>
      <td><code>fr</code></td>
      <td>Meta Platforms Inc.</td>
      <td>Used by Facebook to deliver, measure, and improve the relevance of ads.</td>
      <td>3 months</td>
    </tr>
    <tr>
      <td><code>_ttp</code></td>
      <td>TikTok Inc.</td>
      <td>Used by TikTok to measure the effectiveness of advertising and to deliver
      personalised ads to users based on their browsing behaviour.</td>
      <td>13 months</td>
    </tr>
    <tr>
      <td><code>_tt_enable_cookie</code></td>
      <td>TikTok Inc.</td>
      <td>Used by TikTok to track conversions and measure advertising performance.</td>
      <td>13 months</td>
    </tr>
  </tbody>
</table>

<p><em>Meta Platforms Inc. is located in the United States. Meta's cookie policy is at
<a href="https://www.facebook.com/policies/cookies" target="_blank">facebook.com/policies/cookies</a>.
TikTok Inc. is located in the United States. TikTok's privacy policy is at
<a href="https://www.tiktok.com/legal/page/row/privacy-policy" target="_blank">tiktok.com/legal/privacy</a>.</em></p>

<h3>3.4 Functionality Cookies</h3>

<p>These cookies enable our Platform to provide enhanced functionality and personalisation.
They may be set by us or by third-party providers whose services we have added to our pages.
If you do not allow these cookies, some or all of these services may not function properly.</p>

<table>
  <thead>
    <tr>
      <th>Cookie Name</th>
      <th>Provider</th>
      <th>Purpose</th>
      <th>Duration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>locale</code></td>
      <td>PrintHub</td>
      <td>Stores your language preference (English or Swahili) so you do not need
      to re-select it on each visit.</td>
      <td>1 year</td>
    </tr>
    <tr>
      <td><code>TawkConnectionTime</code></td>
      <td>Tawk.to</td>
      <td>Used by our live chat provider (Tawk.to) to maintain and identify your
      chat session and ensure continuity of your support conversation.</td>
      <td>Session</td>
    </tr>
    <tr>
      <td><code>twk_idm_key</code></td>
      <td>Tawk.to</td>
      <td>Used by Tawk.to to identify returning chat visitors.</td>
      <td>6 months</td>
    </tr>
  </tbody>
</table>

<h2>4. Third-Party Cookies</h2>

<p>Some cookies on our Platform are set by third parties. We do not have control over these
cookies. Please refer to the relevant third-party privacy and cookie policies for more information.
Key third parties whose cookies may be present on our Platform include:</p>

<ul>
  <li><strong>Cloudflare:</strong> Security and performance — <a href="https://www.cloudflare.com/privacypolicy/" target="_blank">cloudflare.com/privacypolicy</a></li>
  <li><strong>Google:</strong> Analytics and OAuth — <a href="https://policies.google.com/privacy" target="_blank">policies.google.com/privacy</a></li>
  <li><strong>Meta (Facebook):</strong> Advertising pixel — <a href="https://www.facebook.com/policies/cookies" target="_blank">facebook.com/policies/cookies</a></li>
  <li><strong>TikTok:</strong> Advertising pixel — <a href="https://www.tiktok.com/legal/page/row/privacy-policy" target="_blank">tiktok.com/legal/privacy</a></li>
  <li><strong>Hotjar:</strong> User behaviour analytics — <a href="https://www.hotjar.com/legal/policies/cookie" target="_blank">hotjar.com/legal/policies/cookie</a></li>
  <li><strong>Tawk.to:</strong> Live chat — <a href="https://www.tawk.to/privacy-policy/" target="_blank">tawk.to/privacy-policy</a></li>
</ul>

<h2>5. How to Manage and Control Cookies</h2>

<h3>5.1 Our Cookie Consent Tool</h3>
<p>When you first visit our Platform, you will be presented with our cookie consent banner. You
may choose to:</p>
<ul>
  <li><strong>Accept All:</strong> All cookies (including analytics and marketing) will be
  activated</li>
  <li><strong>Essential Only:</strong> Only strictly necessary cookies will be placed</li>
  <li><strong>Manage Preferences:</strong> Individually toggle each category of non-essential
  cookie</li>
</ul>
<p>You may update your preferences at any time by clicking "<strong>Manage Cookie
Preferences</strong>" in the footer of our website.</p>

<h3>5.2 Browser-Level Cookie Controls</h3>
<p>You can also control cookies through your browser settings. Most browsers allow you to:</p>
<ul>
  <li>View cookies that have been set</li>
  <li>Delete all or specific cookies</li>
  <li>Block cookies from specific websites</li>
  <li>Block all third-party cookies</li>
  <li>Set preferences for specific websites</li>
</ul>
<p>Instructions for managing cookies in popular browsers:</p>
<ul>
  <li><strong>Google Chrome:</strong> Settings → Privacy and security → Cookies and other
  site data</li>
  <li><strong>Mozilla Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
  <li><strong>Safari (iOS/macOS):</strong> Settings/Preferences → Safari → Privacy</li>
  <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions</li>
</ul>
<p><strong>Note:</strong> Blocking strictly necessary cookies will impair the function of our
Platform — you may not be able to log in, maintain a shopping cart, or complete a checkout.</p>

<h3>5.3 Opt-Out Tools for Specific Services</h3>
<ul>
  <li><strong>Google Analytics opt-out:</strong> <a href="https://tools.google.com/dlpage/gaoptout" target="_blank">tools.google.com/dlpage/gaoptout</a></li>
  <li><strong>Meta ad preferences:</strong> <a href="https://www.facebook.com/ads/preferences" target="_blank">facebook.com/ads/preferences</a></li>
  <li><strong>TikTok ad settings:</strong> Manage in TikTok app → Profile → Settings → Privacy</li>
  <li><strong>Hotjar opt-out:</strong> <a href="https://www.hotjar.com/legal/compliance/opt-out" target="_blank">hotjar.com/legal/compliance/opt-out</a></li>
  <li><strong>Your Online Choices (EU AdChoices):</strong> <a href="https://www.youronlinechoices.com" target="_blank">youronlinechoices.com</a></li>
</ul>

<h2>6. Do Not Track</h2>

<p>Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not
want your online activity tracked. Our Platform does not currently respond to DNT signals. You
may use our cookie consent banner or browser settings to manage tracking preferences.</p>

<h2>7. Cookies and Personal Data</h2>

<p>Where cookies collect or process personal data (such as your IP address, device identifiers,
or browsing behaviour linked to your account), that processing is governed by our
<strong>Privacy Policy</strong>. For information about your rights in relation to that personal
data, including your right to access, correct, or delete it, please refer to our Privacy Policy
or contact our Data Protection Officer at dpo@printhub.africa.</p>

<h2>8. Changes to This Cookie Policy</h2>

<p>We may update this Cookie Policy from time to time to reflect changes in the cookies and
similar technologies we use, changes in applicable law, or other operational requirements.
When we make changes, we will update the "Last Updated" date at the top of this Policy.
If we make material changes that affect cookies requiring your consent, we will reset your
cookie preferences so you can make a fresh choice.</p>

<h2>9. Contact Us</h2>

<p>If you have any questions about our use of cookies or this Cookie Policy, please contact:</p>

<p>
<strong>Data Protection Officer</strong><br>
PrintHub — An Ezana Group Company<br>
Email: dpo@printhub.africa<br>
General enquiries: hello@printhub.africa<br>
Website: https://printhub.africa
</p>

</div>
`;

const REFUND_POLICY_HTML = `
<div class="legal-document">

<p class="effective-date"><strong>Effective Date:</strong> 1 March 2026<br>
<strong>Last Updated:</strong> 1 March 2026<br>
<strong>Version:</strong> 1.0</p>

<h2>1. Introduction</h2>

<p>This Refund and Returns Policy ("<strong>Policy</strong>") sets out the terms and conditions
under which PrintHub ("<strong>PrintHub</strong>", "<strong>we</strong>", "<strong>us</strong>")
will accept returns, process refunds, and handle cancellations for orders placed through our
Platform at <strong>printhub.africa</strong>.</p>

<p>This Policy is published in compliance with the <strong>Consumer Protection Act, 2012</strong>
(Cap. 505A, Laws of Kenya) and forms part of our Terms of Service. In the event of any
inconsistency between this Policy and our Terms of Service, the Terms of Service shall prevail.</p>

<p>Our commitment is simple: if we make an error or our product does not meet the agreed
specification, we will fix it at no cost to you. If you change your mind on a custom order after
production has commenced, we may not be able to offer a refund — but we will always treat you
fairly and explain why.</p>

<h2>2. Understanding Our Product Categories</h2>

<p>Your rights differ depending on the type of product or service ordered. Please read the
category that applies to your purchase:</p>

<h3>2.1 Custom-Printed Products</h3>
<p>Custom-printed products are items produced entirely to your specific requirements and
instructions, including:</p>
<ul>
  <li>Vinyl banners, mesh banners, and pull-up banners to your specified dimensions and design</li>
  <li>Vehicle wraps and window graphics cut to your specifications</li>
  <li>3D printed objects produced from your submitted STL or model files</li>
  <li>Custom signage, displays, and branded materials</li>
  <li>Any product produced using a design file or specifications you submitted</li>
</ul>
<p>Because these products are made specifically for you and cannot be resold to another
customer, they are subject to different refund rules as described in Section 3 below.</p>

<h3>2.2 Ready-Made Shop Products</h3>
<p>Ready-made products are items sold from our standard inventory or catalogue that are not
produced to individual customer specifications, including:</p>
<ul>
  <li>Standard catalogue items purchased without customisation</li>
  <li>Print-on-demand products from our standard catalogue (unless a custom design has been
  applied)</li>
</ul>
<p>These products are subject to the standard returns policy in Section 4 below.</p>

<h3>2.3 Digital Files and Design Services</h3>
<p>Digital deliverables, including design files, digital proofs, and pre-press files prepared
by PrintHub, are non-refundable once delivered to you electronically.</p>

<h2>3. Custom-Printed Products — Refund Policy</h2>

<h3>3.1 Non-Refundable by Default</h3>
<p><strong>Custom-printed products are non-refundable once production has commenced</strong>,
as they are produced to your unique specifications and cannot be reused or resold. You accept
this condition at the time of placing your order by agreeing to our Terms of Service.</p>

<h3>3.2 Exceptions — When We Will Refund or Reprint</h3>

<p>Notwithstanding Clause 3.1, you are entitled to a full refund or a free reprint (at our
option) in the following circumstances:</p>

<ul>
  <li><strong>3.2.1 Defective product:</strong> The product is materially defective, including
  structural defects in 3D printed items, significant banding or streaking in printed output,
  or incomplete printing. Minor colour variation between digital display and print output does
  not constitute a defect.</li>

  <li><strong>3.2.2 Wrong specifications:</strong> We printed the wrong dimensions, wrong
  material, wrong colour (where specific Pantone or CMYK values were agreed), or wrong finish
  that were clearly specified in your accepted order.</li>

  <li><strong>3.2.3 Wrong item delivered:</strong> You received an order intended for a different
  customer.</li>

  <li><strong>3.2.4 Delivery damage:</strong> The product was damaged in transit and the damage
  is reported within <strong>48 hours</strong> of delivery with photographic evidence.</li>

  <li><strong>3.2.5 Our pre-press error:</strong> We substantially altered your submitted design
  during pre-press without your knowledge or approval, and this resulted in a material difference
  in the final product.</li>
</ul>

<h3>3.3 Claims Procedure for Custom Orders</h3>

<ol>
  <li>Report the defect or issue within <strong>48 hours of delivery</strong> (or 48 hours of
  collection if you collected in person)</li>
  <li>Submit your claim through: your Account → My Orders → [Order Number] → "Report an Issue",
  or email us at hello@printhub.africa with your order number in the subject line</li>
  <li>Include <strong>clear photographs</strong> of the defect or issue, including images of
  the entire product and a close-up of the problem area</li>
  <li>Our team will review your claim within <strong>1 business day</strong> and advise you
  of our decision</li>
  <li>If your claim is approved, we will offer either a full reprint or a full refund at our
  discretion. Where a reprint is offered, the turnaround time will be the same as the original
  order</li>
</ol>

<h3>3.4 What We Do Not Accept as Grounds for Refund (Custom Orders)</h3>

<ul>
  <li>You provided a low-resolution image or incorrectly formatted file and the poor quality
  is a direct result of that file defect</li>
  <li>Minor colour variations between what you saw on your screen and the final print (screens
  display in RGB; print output is CMYK — some variation is inherent)</li>
  <li>You changed your mind after production commenced</li>
  <li>You ordered the wrong quantity and want to return the excess</li>
  <li>The product meets the agreed specification but you are unhappy with the design
  (responsibility for design quality rests with you unless you engaged our design services)</li>
  <li>Defects that arise from improper installation or application of the printed product
  by you or a third party</li>
</ul>

<h2>4. Ready-Made Products — Returns Policy</h2>

<h3>4.1 Your Right to Return</h3>
<p>In accordance with the <strong>Consumer Protection Act, 2012</strong>, you have the right to
return a ready-made product and receive a full refund within <strong>7 days</strong> of the date
of delivery, provided that:</p>
<ul>
  <li>The product is unused and in its original condition</li>
  <li>The product is returned in its original packaging (where applicable)</li>
  <li>You notify us of your intention to return before the 7-day period expires</li>
</ul>

<h3>4.2 Extended Return Period for Defective Ready-Made Products</h3>
<p>If a ready-made product is defective, does not match its description, or is of unsatisfactory
quality as described in the Consumer Protection Act, 2012, you may return it within
<strong>30 days</strong> of delivery for a full refund or replacement.</p>

<h3>4.3 Return Process</h3>
<ol>
  <li>Notify us of your intention to return by emailing hello@printhub.africa or via your
  Account within the applicable return window</li>
  <li>We will provide you with a Return Authorisation Number and return instructions</li>
  <li>Pack the item securely to avoid damage in transit</li>
  <li>Return shipping is at <strong>your cost</strong> unless the return is due to our error
  or the product being defective</li>
  <li>Once we receive and inspect the returned item, we will process your refund within
  <strong>5 business days</strong></li>
</ol>

<h3>4.4 Products Excluded from Standard Return</h3>
<p>The following ready-made products are not eligible for return even within the 7-day window,
in accordance with Section 15 of the Consumer Protection Act, 2012:</p>
<ul>
  <li>Products that have been used, worn, or are not in their original condition</li>
  <li>Products that have been personalised or customised for you after purchase</li>
  <li>Products where any seal or packaging has been broken and the product cannot be resold
  for hygiene or quality reasons</li>
</ul>

<h2>5. Order Cancellations</h2>

<h3>5.1 Cancellation Before Production</h3>
<p>You may cancel an order <strong>at any time before production commences</strong> and receive
a full refund. Production commences when your order status changes to "In Production" in your
account dashboard. You may cancel from your Account or by contacting us immediately at
hello@printhub.africa.</p>

<h3>5.2 Cancellation After Production Commences</h3>
<p>For custom orders, once production has commenced, cancellation is no longer available through
self-service. You must contact us on WhatsApp (+254 727 410 320) or by email. We will assess
what stage production has reached and advise whether any partial refund is possible.</p>

<h3>5.3 Cancellation of Quotes</h3>
<p>Quote requests may be withdrawn by you at any time before you have accepted the quote price.
Once you have accepted a quote and made payment, it is treated as a confirmed Order subject to
the cancellation terms above.</p>

<h2>6. Refund Methods and Timelines</h2>

<h3>6.1 Refund Methods</h3>
<p>Refunds will be issued using the same payment method originally used, as follows:</p>
<ul>
  <li><strong>M-Pesa payments:</strong> Refunded directly to your M-Pesa account via the M-Pesa
  Business-to-Customer (B2C) service within <strong>3–5 business days</strong> of approval.
  You will receive an M-Pesa confirmation SMS once the refund is sent.</li>
  <li><strong>Card payments (Visa/Mastercard via Pesapal):</strong> Refunded to the original
  card within <strong>5–10 business days</strong>, subject to your bank's processing times.
  Please note that the refund may take up to 14 days to appear on your bank statement depending
  on your card issuer.</li>
  <li><strong>Cash (Pay on Pickup):</strong> Refunded in cash upon presentation at our premises,
  or by M-Pesa at your request. Please contact us to arrange this.</li>
</ul>

<h3>6.2 Partial Refunds</h3>
<p>In cases where only part of an order is defective or only part of an order is being returned,
we will issue a partial refund proportionate to the defective or returned portion of the order.</p>

<h3>6.3 Refund Processing Timeline</h3>
<p>Once we have approved your refund request, the timeline for processing is as follows:</p>
<ul>
  <li>Approval decision: within <strong>1 business day</strong> of receiving your complete claim
  with supporting evidence</li>
  <li>M-Pesa refund processed: within <strong>3–5 business days</strong> of approval</li>
  <li>Card refund processed: within <strong>5–10 business days</strong> of approval</li>
</ul>

<h3>6.4 Refunds for Cancelled Orders (No Fault)</h3>
<p>Where PrintHub cancels your order (as described in Clause 9.3 of our Terms of Service), a
full refund will be processed within <strong>3 business days</strong> of cancellation.</p>

<h2>7. Disputes and Escalation</h2>

<p>If you are dissatisfied with our decision on a refund or return claim, you may escalate your
complaint as follows:</p>
<ol>
  <li><strong>Internal escalation:</strong> Email our management team at hello@printhub.africa
  with the subject line "Refund Complaint — [Your Order Number]". We will respond within
  2 business days.</li>
  <li><strong>Consumer Protection Authority:</strong> You may lodge a complaint with the
  <strong>Competition Authority of Kenya</strong>, which administers the Consumer Protection
  Act, 2012:
  <br>Website: <a href="https://www.cak.go.ke" target="_blank">www.cak.go.ke</a>
  <br>Email: info@cak.go.ke
  <br>Telephone: +254 20 2628 000</li>
  <li><strong>Alternative Dispute Resolution:</strong> You may refer the matter to mediation
  as described in Clause 13 of our Terms of Service.</li>
</ol>

<h2>9. Personal Data in Refund Processing</h2>

<p>When processing a refund or return, we necessarily handle personal data including your name,
contact details, order history, payment method, M-Pesa phone number, and (where provided)
bank account details. This processing is carried out:</p>
<ul>
  <li>On the legal basis of <strong>contract performance</strong> (Kenya DPA s.30(b); GDPR Art. 6(1)(b)) — as processing is necessary to execute the refund which is a contractual obligation</li>
  <li>On the legal basis of <strong>legal obligation</strong> (Kenya DPA s.30(c); GDPR Art. 6(1)(c)) — to maintain financial records as required by KRA</li>
</ul>

<h3>9.1 M-Pesa B2C Refunds</h3>
<p>Where a refund is made via M-Pesa Business-to-Customer (B2C) transfer, your phone number
will be transmitted to Safaricom PLC for processing. Safaricom acts as a Data Processor for
this purpose. The transaction reference number will be stored in our records for a minimum of
7 years as required by KRA.</p>

<h3>9.2 Refund Records Retention</h3>
<p>Refund records (the fact that a refund was made, the amount, the date, and the payment
reference) are retained for <strong>7 years</strong> as financial records required by KRA.
The personal details associated with those records are subject to our standard retention periods
as described in our Privacy Policy.</p>

<h3>9.3 Your Data Rights</h3>
<p>Your data protection rights described in our Privacy Policy apply equally to data processed
in connection with a refund or return. If you wish to exercise any of those rights (access,
correction, erasure, portability, restriction, or objection), please contact
dpo@printhub.africa. Please note that data required for KRA compliance cannot be deleted
before the 7-year retention period expires.</p>

<h2>10. Contact Us</h2>

<p>To submit a return, refund, or cancellation request:</p>
<ul>
  <li><strong>Account portal:</strong> Log in → My Orders → Select your order → "Report an Issue"</li>
  <li><strong>Email:</strong> hello@printhub.africa (include your order number in the subject)</li>
  <li><strong>WhatsApp:</strong> +254 727 410 320 (Monday–Friday, 8am–6pm; Saturday 9am–3pm)</li>
</ul>

<p>
<strong>PrintHub — An Ezana Group Company</strong><br>
Eldoret, Kenya<br>
Website: https://printhub.africa
</p>

</div>
`;

const ACCOUNT_TERMS_HTML = `
<div class="legal-document">

<p class="effective-date">
  <strong>Effective Date:</strong> 1 March 2026 &nbsp;|&nbsp;
  <strong>Last Updated:</strong> 1 March 2026 &nbsp;|&nbsp;
  <strong>Version:</strong> 1.0
</p>

<p class="important-notice">
  <strong>Please read these Account Registration Terms carefully before creating your
  PrintHub account.</strong> By clicking "Create Account", "Sign up with Google",
  or "Continue with Facebook", you confirm that you have read, understood, and agree
  to be bound by these terms. If you do not agree, you must not create an account.
</p>

<h2>1. Who You Are Contracting With</h2>

<p>By creating an account on <strong>printhub.africa</strong> ("<strong>Platform</strong>"),
you are entering into a contract with <strong>PrintHub (An Ezana Group Company)</strong>,
a business registered and operating under the laws of the <strong>Republic of Kenya</strong>,
with its principal place of business in Eldoret, Kenya ("<strong>PrintHub</strong>",
"<strong>we</strong>", "<strong>us</strong>").</p>

<p>These Account Registration Terms ("<strong>Account Terms</strong>") govern your creation
and use of a PrintHub account. They supplement and incorporate by reference our:</p>
<ul>
  <li><a href="/terms-of-service">Terms of Service</a></li>
  <li><a href="/privacy-policy">Privacy Policy</a></li>
  <li><a href="/cookie-policy">Cookie Policy</a></li>
  <li><a href="/refund-policy">Refund and Returns Policy</a></li>
</ul>
<p>In the event of any conflict, the Terms of Service shall prevail.</p>

<h2>2. Eligibility</h2>

<h3>2.1 Age</h3>
<p>You must be at least <strong>18 years of age</strong> to create an account. By creating an
account, you represent and warrant that you are 18 years of age or older. If you are under 18,
you must not create an account or use our Platform.</p>

<h3>2.2 Legal Capacity</h3>
<p>You must have full legal capacity to enter into a binding contract under the laws of your
jurisdiction. If you are registering on behalf of a company or other legal entity, you
represent and warrant that you have authority to bind that entity to these Account Terms.</p>

<h3>2.3 Single Account Policy</h3>
<p>You may only hold one personal account on our Platform. Creating multiple accounts to
circumvent restrictions, abuse promotions, or for any other fraudulent purpose is a breach
of these Account Terms and may result in all associated accounts being suspended or terminated
without notice.</p>

<h2>3. Account Registration</h2>

<h3>3.1 Registration Methods</h3>
<p>You may register an account using:</p>
<ul>
  <li><strong>Email and password:</strong> By providing a valid email address and creating a
  secure password. You will be required to verify your email address before your account is
  fully activated.</li>
  <li><strong>Google Sign-In:</strong> Using your Google account via OAuth 2.0. By using
  Google Sign-In, you authorise us to receive your name, email address, and profile picture
  from Google in accordance with Google's privacy policy and your Google account settings.</li>
  <li><strong>Facebook Login:</strong> Using your Facebook account via OAuth 2.0. By using
  Facebook Login, you authorise us to receive your name, email address, and profile picture
  from Meta in accordance with Meta's privacy policy and your Facebook privacy settings.</li>
</ul>

<h3>3.2 Accuracy of Information</h3>
<p>You agree to provide accurate, current, and complete information at the time of registration
and to keep that information up to date. Providing false information, including a false name,
false contact details, or impersonating another person or company, is a breach of these Account
Terms.</p>

<h3>3.3 Email Verification</h3>
<p>Where you register using an email address and password, we will send a verification email to
the address you provide. You must verify your email within <strong>48 hours</strong>. Accounts
where the email address has not been verified may have limited functionality and are subject to
automatic deletion after 30 days of non-verification.</p>

<h2>4. Account Security</h2>

<h3>4.1 Password Responsibility</h3>
<p>You are solely responsible for maintaining the security and confidentiality of your account
password. You agree to: choose a strong password of at least 8 characters; not share your
password; notify us immediately at <strong>hello@printhub.africa</strong> or WhatsApp +254 727 410 320
if you suspect unauthorised access. PrintHub will never ask for your password by email, phone,
or any other communication.</p>

<h2>5. Your Account Data and Privacy</h2>

<p>When you create an account, we collect and process the personal data described in our
<strong>Privacy Policy</strong>. Processing is carried out on the legal bases of contract
performance, legal obligation, and legitimate interests. Where we rely on consent (e.g. marketing
emails), you may withdraw it at any time in Account Settings or via the unsubscribe link in any
marketing email. You may exercise your data protection rights at any time as described in our
Privacy Policy or by contacting dpo@printhub.africa.</p>

<h2>6. Acceptable Use</h2>

<p>Your account is for your personal or business use only. You must not use your account to place
orders for prohibited content, commit fraud, submit abusive content, attempt unauthorised access,
use automated tools to extract data, or facilitate any illegal activity. You must not impersonate
PrintHub or its staff. Breach may result in suspension or termination without notice.</p>

<h2>7. Loyalty, Referrals, and Promotions</h2>

<p>Loyalty points, referral credits, and promotional codes are subject to the programme rules
displayed in your Account. Points and credits have no cash value and are non-transferable. We
reserve the right to modify programmes with reasonable notice and to withhold credits where we
suspect abuse.</p>

<h2>8. Reviews and User-Generated Content</h2>

<p>Product reviews may only be submitted by customers who have purchased and received the
relevant product. By submitting a review or other user-generated content, you grant PrintHub
a non-exclusive, royalty-free licence to use, display, and adapt that content on our Platform
and in our marketing materials. Content must be honest, accurate, and not defamatory or
infringing. We reserve the right to moderate and remove content that violates these standards.</p>

<h2>9. Account Suspension and Termination</h2>

<p>You may close your account at any time via Account Settings → Privacy → Delete My Account.
We may suspend or terminate your account with immediate effect where you breach these Account
Terms or our Terms of Service, we reasonably suspect fraud or abuse, you provide false
information, we are required by law, or your account has been inactive for more than 24 months
(we will provide 30 days' prior notice). Upon termination, your access will cease; loyalty
points will be forfeited; unfulfilled orders will be cancelled and refunded; financial
records will be retained for the periods required by law.</p>

<h2>10. Changes to These Account Terms</h2>

<p>We may update these Account Terms at any time. For material changes, we will provide at
least <strong>14 days' prior notice</strong> by email and by prominent notice on the Platform.
If you do not agree to the revised terms, you may close your account before the effective date.
Continued use after the effective date constitutes acceptance.</p>

<h2>11. Governing Law and Contact</h2>

<p>These Account Terms are governed by the laws of the Republic of Kenya. Disputes are subject
to the dispute resolution process in our Terms of Service.</p>

<p>
<strong>PrintHub — An Ezana Group Company</strong><br>
Email: hello@printhub.africa | WhatsApp: +254 727 410 320<br>
DPO: dpo@printhub.africa | Website: https://printhub.africa
</p>

</div>
`;

const CORPORATE_TERMS_HTML = `
<div class="legal-document">

<p class="effective-date">
  <strong>Effective Date:</strong> 1 March 2026 &nbsp;|&nbsp;
  <strong>Last Updated:</strong> 1 March 2026 &nbsp;|&nbsp;
  <strong>Version:</strong> 1.0
</p>

<p class="important-notice">
  <strong>IMPORTANT:</strong> These Corporate Account Terms and Conditions ("<strong>Corporate
  Terms</strong>") govern the relationship between PrintHub and approved corporate account
  holders. By submitting a corporate account application, you confirm that you have authority
  to bind your company to these Corporate Terms and that your company agrees to be bound by them.
  These Corporate Terms apply in addition to our Terms of Service, Privacy Policy, Refund and
  Returns Policy, and Account Registration Terms, all of which are incorporated herein by
  reference. In the event of conflict, these Corporate Terms prevail over the general Terms
  of Service for matters specific to corporate accounts.
</p>

<h2>1. Definitions</h2>

<p>In these Corporate Terms: "<strong>Corporate Account</strong>" means the approved business
account assigned CORP-XXX upon approval; "<strong>Corporate Customer</strong>" or "<strong>Client</strong>"
means the legal entity that holds the Corporate Account; "<strong>Authorised User</strong>" means
any individual added to the Corporate Account (OWNER, ADMIN, FINANCE, or MEMBER role);
"<strong>Primary Contact</strong>" means the OWNER who applied for the account; "<strong>Credit Limit</strong>"
and "<strong>Payment Terms</strong>" (PREPAID, NET-14, NET-30, NET-60) are as set in the approval
notification; "<strong>Corporate Invoice</strong>" means the consolidated monthly invoice (CINV-YYYY-XXXX);
"<strong>Schedule of Rates</strong>" means agreed pricing issued by PrintHub; "<strong>Brand Assets</strong>"
means logos and creative files uploaded to the account library; "<strong>KES</strong>" and
"<strong>VAT</strong>" have the meanings given in the Terms of Service.</p>

<h2>2. Application and Approval</h2>

<p>To apply, an authorised representative must complete the form at
<strong>printhub.africa/corporate/apply</strong>, providing company name, KRA PIN (mandatory),
VAT number if applicable, industry, company size, primary contact details, billing address in
Kenya, estimated monthly spend, and requested credit terms. We may verify information via KRA
iTax and credit reference. We reserve the right to refuse any application without giving reasons.
Approval is communicated to the Primary Contact; the Agreement commences on the date of that
notification.</p>

<h2>3. Authorised Users and Roles</h2>

<p>OWNER and ADMIN may place orders and manage team (ADMIN may manage MEMBER level only); FINANCE
may view invoices only; MEMBER may place orders within any spending limit set by OWNER. The
Client is responsible for all orders and actions of its Authorised Users. By adding an
Authorised User, the Client represents that it has a lawful basis to share that individual's
data with PrintHub and that the individual has been informed; PrintHub processes such data in
accordance with our Privacy Policy.</p>

<h2>4. Pricing, Discounts, and VAT</h2>

<p>The Client is entitled to the Corporate Discount specified in the approval notification,
applied before VAT. Discounts are subject to change with <strong>14 days' written notice</strong>.
All prices and Corporate Invoices are subject to VAT at <strong>16%</strong> unless a valid KRA
VAT exemption certificate is provided. Tax invoices will be KRA-compliant. PrintHub may
issue a Schedule of Rates for volume orders; Schedule pricing supersedes standard pricing for
those items.</p>

<h2>5. Credit Terms and Payment</h2>

<p>Where approved for credit (NET-14, NET-30, NET-60), PrintHub provides services up to the
approved Credit Limit. We will notify when usage reaches 80% of the limit; orders that would
exceed the limit will be declined until the balance is reduced. Corporate Invoices are
generated at month end and sent to the Primary Contact and FINANCE users. Payment is due
within the agreed period (NET-14: 14 days; NET-30: 30 days; NET-60: 60 days) by M-Pesa Paybill
(quoting invoice number) or bank transfer. Late payment: we may charge interest at
<strong>2% per month</strong> (or the maximum permitted under Kenyan law), suspend the credit
facility and require prepayment, suspend the account, and after <strong>60 days</strong> overdue
may terminate and refer to collections (Client bears costs of recovery). Disputed invoices must
be notified in writing within <strong>7 days</strong> of invoice date; the undisputed portion
must be paid by the due date. PREPAID accounts pay per order at checkout with corporate
discount applied.</p>

<h2>6. Orders, Purchase Orders, and Brand Assets</h2>

<p>Authorised Users place orders subject to role permissions and spending limits; all Orders
are subject to our Terms of Service. The Client may add a PO Reference at checkout. Brand
Assets uploaded to the account are used solely to fulfil the Client's orders; the Client
warrants ownership or licence of all IP in those assets. PrintHub stores Brand Assets in
private, access-controlled storage and will delete them within 30 days of a deletion request
subject to active Order retention needs.</p>

<h2>7. Confidentiality and Intellectual Property</h2>

<p>PrintHub will keep the Client's confidential information (pricing requirements, business
information) confidential and will not disclose it except to staff and sub-processors who
need it, or as required by law. The Client will not disclose PrintHub's pricing, discount
structure, or commercial terms to competitors. The Client retains ownership of its IP in
files, designs, and Brand Assets; PrintHub retains ownership of its Platform and processes.
Designs created by PrintHub for the Client are as agreed in the relevant Quote or design
agreement.</p>

<h2>8. Warranties and Liability</h2>

<p>The Client warrants that it is a legally constituted entity, the applicant has authority to
bind it, all information provided is accurate, and it owns or licenses all IP in submitted
files. PrintHub's total aggregate liability to the Client shall not exceed the total value of
Orders placed in the <strong>12 months</strong> before the event giving rise to the claim
(excluding liability for death or personal injury, fraud, or any liability that cannot be
excluded by law). PrintHub is not liable for indirect, consequential, or economic loss,
including loss of profit or loss arising from print defects affecting time-sensitive events,
to the maximum extent permitted by law.</p>

<h2>9. Term and Termination</h2>

<p>The Agreement runs from approval until terminated. The Client may close the account on
<strong>30 days' written notice</strong> to hello@printhub.africa provided all invoices are
paid and there are no pending orders. PrintHub may terminate for convenience on 30 days'
notice, or with immediate effect where the Client materially breaches and fails to remedy
within 14 days, becomes insolvent, has an invoice overdue by more than 60 days, or provided
false information in its application. Upon termination: all outstanding invoices become
immediately due; Authorised Users lose access; Brand Assets are retained 30 days then deleted;
Order and financial records retained 7 years per KRA; orders already in production will be
completed and invoiced.</p>

<h2>10. Data Protection</h2>

<p>PrintHub acts as Data Controller for Authorised Users' data (account administration, order
fulfilment, marketing where consent is given). Where PrintHub processes data on the Client's
instructions (e.g. third-party delivery addresses), PrintHub acts as Data Processor and this
Agreement with the Privacy Policy constitutes the data processing agreement under Article 28
GDPR and Section 35 Kenya DPA 2019. Both Parties will comply with GDPR and UK GDPR where
applicable. Data subject requests from Authorised Users are handled by PrintHub per the
Privacy Policy; where the Client is Data Controller for any data, the Client is responsible
for responding and PrintHub will provide reasonable assistance.</p>

<h2>11. General</h2>

<p>This Agreement is the entire agreement between the Parties. No variation is effective unless
in writing and signed. Notices to PrintHub: hello@printhub.africa; to the Client: Primary
Contact's email. Force majeure: neither Party is liable for delay or failure due to
circumstances beyond reasonable control; the affected Party must notify within 5 business days;
if force majeure continues more than 30 days, either Party may terminate affected Order(s) with
full refund for unrendered services. The Client may not assign without PrintHub's consent;
PrintHub may assign to a successor in a merger or sale. Governing law: Republic of Kenya.
Disputes: good-faith negotiation, then mediation via Nairobi Centre for International
Arbitration (NCIA), then arbitration under NCIA rules, seat Eldoret, English language. Courts
of Eldoret have non-exclusive jurisdiction for urgent or interim relief.</p>

<h2>12. Contact</h2>

<p><strong>PrintHub — An Ezana Group Company</strong><br>
Corporate Accounts: hello@printhub.africa | WhatsApp: +254 727 410 320<br>
DPO: dpo@printhub.africa | https://printhub.africa/corporate</p>

</div>
`;

const DATA_DELETION_HTML = `
<div class="legal-document">

<p class="effective-date"><strong>Last Updated:</strong> March 2026</p>

<h2>Data Deletion Request</h2>

<p>PrintHub Africa (An Ezana Group Company) is committed to your right to erasure under the Kenya Data Protection Act, 2019 (<strong>Section 26(c)</strong>) and, where applicable, the EU General Data Protection Regulation (<strong>GDPR Article 17</strong>) and UK GDPR. This page explains how to request deletion of your personal data collected through Facebook Login or Google Login on our Platform.</p>

<h3>1. Data we hold from Facebook Login and Google Login</h3>
<p>When you sign in using Facebook or Google, we receive and store:</p>
<ul>
  <li>Full name</li>
  <li>Email address</li>
  <li>Profile picture URL</li>
  <li>A unique identifier from Facebook or Google (used to recognise your account on future logins)</li>
</ul>
<p>We do not receive your password, friends list, contacts, posts, or any other data from your Facebook or Google account.</p>

<h3>2. Your right to erasure</h3>
<p><strong>Kenya Data Protection Act, 2019 — Section 26(c):</strong><br>
You have the right to request erasure of your personal data where:</p>
<ul>
  <li>The data is no longer necessary for the purpose it was collected</li>
  <li>You withdraw consent and there is no other legal basis for processing</li>
  <li>You object to processing and there are no overriding legitimate grounds</li>
  <li>The data has been unlawfully processed</li>
</ul>
<p><strong>EU/UK GDPR — Article 17 (where applicable):</strong><br>
Where EU or UK data protection law applies to your use of our Platform, you have the right to erasure ("right to be forgotten") on the same grounds listed above.</p>

<h3>3. How to request deletion</h3>
<p><strong>Option 1 — Self-service (immediate):</strong><br>
Log in → Account Settings → Privacy → Delete Account<br>
Your account and associated Facebook/Google login data will be permanently and immediately deleted.</p>

<p><strong>Option 2 — Email request:</strong><br>
Email: <a href="mailto:dpo@printhub.africa">dpo@printhub.africa</a><br>
Subject line: Data Deletion Request<br>
Include:</p>
<ul>
  <li>Your full name</li>
  <li>The email address linked to your PrintHub account</li>
  <li>Whether you signed in via Facebook, Google, or email/password</li>
  <li>Your account ID or order number if known (optional but helpful)</li>
</ul>
<p>We will acknowledge your request within 72 hours and action it within 30 days as required by the Kenya Data Protection Act, 2019 and GDPR Article 12. If your request is complex, we may extend this by a further 2 months and will notify you within the initial 30-day period explaining the reason for the extension.</p>

<h3>4. What we delete and what we retain</h3>
<p><strong>DELETED IMMEDIATELY:</strong></p>
<ul>
  <li>Your name, email address, and profile picture from Facebook/Google</li>
  <li>Your account login credentials and session data</li>
  <li>Your account preferences and settings</li>
  <li>Your marketing consent records (after the statutory retention period)</li>
</ul>

<p><strong>ANONYMISED (personal identifiers removed, record retained):</strong></p>
<ul>
  <li>Order history — your name and contact details are removed but the order record is anonymised and retained for financial reporting</li>
</ul>

<p><strong>RETAINED (cannot be deleted — legal obligation):</strong></p>
<ul>
  <li>Financial transaction records, invoices, and payment references are retained for 7 years as required by:
    <ul>
      <li>Kenya Revenue Authority under the Income Tax Act (Cap. 470) and the VAT Act (Cap. 476)</li>
      <li>GDPR Article 17(3)(b) — retention necessary for compliance with a legal obligation</li>
    </ul>
  </li>
  <li>These records will have your personal identifiers removed (anonymised) where technically possible while meeting KRA requirements</li>
</ul>

<h3>5. Verification and response</h3>
<p>To protect your privacy and prevent unauthorised deletion requests, we may need to verify your identity before processing your request. We will never delete an account based on an unverified request.</p>
<p>We will respond to all deletion requests:</p>
<ul>
  <li>Acknowledgement: within 72 hours</li>
  <li>Completion: within 30 days (extendable to 3 months for complex requests under Kenya DPA and GDPR Article 12)</li>
  <li>Confirmation email sent to your registered email address once deletion is complete</li>
</ul>
<p>If we are unable to fulfil your request (e.g. due to a legal retention obligation), we will explain the reason in writing.</p>

<h3>6. Automated deletion callback</h3>
<p>PrintHub Africa supports Meta's automated data deletion callback. When you request deletion of your Facebook data directly through Facebook (Settings → Your Facebook Information → Delete Your Information), Meta will automatically notify our system and trigger deletion of your associated data on our Platform. You do not need to contact us separately if you use Facebook's own deletion tool.</p>

<h3>7. Right to lodge a complaint</h3>
<p><strong>Kenya — Office of the Data Protection Commissioner (ODPC):</strong><br>
If you are unhappy with how we handle your deletion request, you may lodge a complaint with the ODPC:<br>
Website: <a href="https://www.odpc.go.ke" target="_blank">www.odpc.go.ke</a><br>
Email: <a href="mailto:info@odpc.go.ke">info@odpc.go.ke</a><br>
Phone: +254 20 2628 000</p>

<p><strong>EU/UK — Supervisory Authority:</strong><br>
If EU or UK GDPR applies to you, you may lodge a complaint with your local data protection supervisory authority. A list of EU supervisory authorities is available at:<br>
<a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank">https://edpb.europa.eu/about-edpb/about-edpb/members_en</a></p>

<p>We encourage you to contact us first at dpo@printhub.africa so we can attempt to resolve your concern directly.</p>

<h3>8. Contact our Data Protection Officer</h3>
<p>
Data Protection Officer<br>
PrintHub — An Ezana Group Company<br>
Eldoret, Kenya<br>
Email: dpo@printhub.africa<br>
General enquiries: hello@printhub.africa<br>
Website: https://printhub.africa<br>
Last updated: March 2026
</p>

</div>
`;
