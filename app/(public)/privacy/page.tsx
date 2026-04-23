export const metadata = {
  title: "Privacy Policy | TIBLOGICS",
  description: "How TIBLOGICS collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-40 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <img src="/logo-full.svg" alt="TIBLOGICS" className="h-9 w-auto" />
          </div>
          <span className="section-tag">Legal</span>
          <h1 className="font-syne font-extrabold text-4xl text-[#0D1B2A] mt-3">Privacy Policy</h1>
          <p className="font-dm text-[#7A8FA6] text-sm mt-2">
            Effective Date: April 20, 2026 &nbsp;·&nbsp; Last Updated: April 20, 2026
          </p>
        </div>

        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-8 md:p-10 space-y-10 font-dm text-[#3A4A5C] leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              TIBLOGICS LLC ("<strong>TIBLOGICS</strong>", "<strong>we</strong>", "<strong>us</strong>", or
              "<strong>our</strong>") is an AI implementation and digital solutions company. We operate the website located at{" "}
              <strong>tiblogics.com</strong> (the "<strong>Site</strong>") and provide related services,
              products, and consultations (collectively, the "<strong>Services</strong>").
            </p>
            <p className="mt-4">
              This Privacy Policy explains what information we collect, how we use it, how we protect it,
              and your rights regarding your personal information. By using our Site or Services, you agree
              to the practices described in this policy.
            </p>
            <p className="mt-4">
              If you do not agree with any part of this Privacy Policy, please discontinue use of our
              Site and Services immediately.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">1. Information We Collect</h2>

            <h3 className="font-semibold text-[#0D1B2A] mb-2">1.1 Information You Provide Directly</h3>
            <p>We collect information you voluntarily provide when you:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fill out a contact, inquiry, or service-request form</li>
              <li>Book a consultation or appointment through our booking system</li>
              <li>Subscribe to our newsletter or email communications</li>
              <li>Communicate with us via email, phone, or chat</li>
              <li>Make a payment for our services</li>
              <li>Create or access an account or admin interface</li>
            </ul>
            <p className="mt-3">This may include: full name, email address, phone number, company name, billing address, project details, and any other information you choose to share.</p>

            <h3 className="font-semibold text-[#0D1B2A] mt-6 mb-2">1.2 Information Collected Automatically</h3>
            <p>When you visit our Site, we automatically collect certain technical information, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Anonymised IP address (truncated to subnet level — we do not store your full IP)</li>
              <li>Browser type, operating system, and device type</li>
              <li>Pages visited, referral source, and session duration</li>
              <li>Time and date of your visit</li>
            </ul>
            <p className="mt-3">We anonymise IP addresses before storage and do not use fingerprinting or cross-site tracking technologies.</p>

            <h3 className="font-semibold text-[#0D1B2A] mt-6 mb-2">1.3 Payment Information</h3>
            <p>
              We do not store credit card numbers or full payment details. All payment processing is handled
              by <strong>Stripe, Inc.</strong>, a PCI-DSS compliant third-party processor. We receive only
              limited transaction metadata (payment status, amount, and an anonymised transaction ID) from
              Stripe. Please review Stripe's privacy policy at stripe.com/privacy.
            </p>

            <h3 className="font-semibold text-[#0D1B2A] mt-6 mb-2">1.4 Communications with AI Systems</h3>
            <p>
              Our Site includes AI-powered features (such as our Tibo assistant). Conversations you have
              with these features may be processed by Anthropic's API and are subject to Anthropic's usage
              policies. We do not permanently store the full content of AI chat sessions beyond what is
              necessary to respond to your inquiry in the same session.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Respond to inquiries and deliver the Services you request</li>
              <li>Schedule, confirm, and manage appointments and consultations</li>
              <li>Process payments and send receipts</li>
              <li>Send transactional emails (booking confirmations, meeting links, invoices)</li>
              <li>Send marketing and newsletter emails, <strong>only with your explicit consent</strong></li>
              <li>Improve and optimise our Site and Services</li>
              <li>Monitor and analyse usage patterns (using anonymised data only)</li>
              <li>Detect, prevent, and respond to fraud, abuse, or security incidents</li>
              <li>Comply with applicable legal obligations</li>
              <li>Enforce our Terms of Service and protect our legal rights</li>
            </ul>
            <p className="mt-4">
              We do not sell, rent, or trade your personal information to third parties for their own
              marketing purposes. Ever.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">3. Legal Basis for Processing (GDPR)</h2>
            <p>If you are located in the European Economic Area (EEA) or the United Kingdom, we process your personal data under the following legal bases:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Contractual necessity</strong> — to deliver Services you have requested or contracted for</li>
              <li><strong>Legitimate interests</strong> — to operate, secure, and improve our business, provided your rights are not overridden</li>
              <li><strong>Consent</strong> — for marketing emails and newsletter subscriptions, which you may withdraw at any time</li>
              <li><strong>Legal obligation</strong> — to comply with applicable laws, regulations, and court orders</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">4. How We Share Your Information</h2>
            <p>We share personal information only in the following limited circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Service providers:</strong> We share data with vetted third-party vendors who help us operate our Services (e.g., Stripe for payments, Resend for transactional email, Anthropic for AI features, Zoom/Google for video meetings). These vendors are contractually bound to process data only as directed by us and to maintain appropriate security standards.</li>
              <li><strong>Legal compliance:</strong> We may disclose your information if required by law, subpoena, court order, or other governmental authority, or if we believe in good faith that disclosure is necessary to protect the rights, property, or safety of TIBLOGICS, our clients, or the public.</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, sale, or transfer of all or a portion of our assets, your information may be transferred as part of that transaction. We will notify you via email or prominent notice on our Site before your data is transferred and becomes subject to a different privacy policy.</li>
              <li><strong>With your consent:</strong> We may share your information for any other purpose with your explicit prior consent.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">5. Data Retention</h2>
            <p>We retain personal information for as long as necessary to fulfil the purposes described in this policy, unless a longer retention period is required or permitted by law. Specifically:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Appointment and booking records: retained for 3 years for business and accounting purposes</li>
              <li>Email communications: retained for 2 years</li>
              <li>Newsletter subscriber records: retained until you unsubscribe, plus 30 days</li>
              <li>Anonymised analytics data: retained indefinitely (no personal identifiers)</li>
              <li>Payment records: retained for 7 years to comply with tax and accounting regulations</li>
            </ul>
            <p className="mt-4">Upon request, we will delete or anonymise your personal information within 30 days, subject to legal retention requirements.</p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">6. Cookies and Tracking Technologies</h2>
            <p>Our Site uses minimal cookies. Specifically:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Session cookies:</strong> Required for secure authentication to our admin interfaces. These are deleted when you close your browser.</li>
              <li><strong>Functional cookies:</strong> Used to remember preferences such as language or theme settings.</li>
            </ul>
            <p className="mt-4">
              We do not use third-party advertising cookies, tracking pixels, or behavioural advertising
              technologies. We do not participate in cross-site tracking networks.
            </p>
            <p className="mt-4">
              You may configure your browser to refuse all cookies; however, some features of the Site
              (such as the admin panel) may not function correctly without session cookies.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">7. Data Security</h2>
            <p>We implement industry-standard technical and organisational safeguards to protect your personal information, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>TLS/HTTPS encryption for all data in transit</li>
              <li>Bcrypt hashing for all stored credentials</li>
              <li>IP anonymisation before analytics storage</li>
              <li>Strict HTTP security headers (HSTS, CSP, X-Frame-Options, etc.)</li>
              <li>Input validation and output encoding to prevent injection attacks</li>
              <li>Role-based access controls limiting data access to authorised personnel only</li>
              <li>Regular security reviews of our codebase and infrastructure</li>
            </ul>
            <p className="mt-4">
              Despite these measures, no method of transmission over the internet or electronic storage
              is 100% secure. We cannot guarantee absolute security. In the event of a data breach that
              affects your personal information, we will notify you as required by applicable law.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">8. Your Rights and Choices</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request erasure of your personal data ("right to be forgotten")</li>
              <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to our processing of your data based on legitimate interests</li>
              <li><strong>Restriction:</strong> Request that we restrict processing of your data in certain circumstances</li>
              <li><strong>Withdrawal of consent:</strong> Withdraw consent for marketing communications at any time by clicking "Unsubscribe" in any email or contacting us directly</li>
              <li><strong>Do Not Sell:</strong> We do not sell personal data. California residents may still exercise CCPA rights by contacting us.</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:info@tiblogics.com" className="text-[#2251A3] hover:underline">info@tiblogics.com</a>.
              We will respond within 30 days. We may need to verify your identity before processing your request.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">9. Children's Privacy</h2>
            <p>
              Our Services are not directed to individuals under the age of 16. We do not knowingly collect
              personal information from children under 16. If you believe we have inadvertently collected
              information from a child, please contact us immediately at{" "}
              <a href="mailto:info@tiblogics.com" className="text-[#2251A3] hover:underline">info@tiblogics.com</a>{" "}
              and we will delete the information promptly.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">10. International Data Transfers</h2>
            <p>
              TIBLOGICS is based in the United States. If you access our Services from outside the United
              States, your information may be transferred to, stored, and processed in the United States,
              where data protection laws may differ from those in your country.
            </p>
            <p className="mt-4">
              For users in the EEA, UK, or Switzerland, we rely on Standard Contractual Clauses (SCCs)
              approved by the European Commission as a transfer mechanism where applicable. By using our
              Services, you consent to this transfer.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">11. Third-Party Links</h2>
            <p>
              Our Site may contain links to third-party websites, tools, or services. This Privacy Policy
              does not apply to those third-party sites. We are not responsible for the privacy practices
              of external sites and encourage you to review their policies before sharing any personal
              information with them.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, legal requirements, or other factors. When we make material changes, we will
              update the "Last Updated" date at the top of this page and, where appropriate, notify you
              by email or prominent notice on the Site.
            </p>
            <p className="mt-4">
              Your continued use of our Site or Services after the effective date of the revised policy
              constitutes your acceptance of the updated terms.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="font-syne font-bold text-xl text-[#0D1B2A] mb-4">13. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
            <div className="mt-4 bg-[#F4F7FB] rounded-xl p-5 border border-[#E8EFF8]">
              <p><strong>TIBLOGICS LLC</strong></p>
              <p className="mt-2">
                Email:{" "}
                <a href="mailto:info@tiblogics.com" className="text-[#2251A3] hover:underline">info@tiblogics.com</a>
              </p>
              <p>
                Website:{" "}
                <a href="https://tiblogics.com" className="text-[#2251A3] hover:underline">tiblogics.com</a>
              </p>
            </div>
            <p className="mt-4 text-sm text-[#7A8FA6]">
              If you are located in the EU/EEA and believe your rights have not been adequately addressed,
              you have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
