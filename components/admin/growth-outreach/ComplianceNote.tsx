"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

/** The B2B cold-email rules this tool enforces, in plain English (CASL + CAN-SPAM). */
export default function ComplianceNote({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[var(--a-radius-card)] border border-[#CFE3D9] bg-[#F1FAF5]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <ShieldCheck size={18} className="text-[var(--a-success)] flex-shrink-0" />
        <span className="font-dm text-sm font-semibold text-[#0F4D3C] flex-1">
          Cold email rules (Canada CASL and US CAN-SPAM): what this tool enforces
        </span>
        <ChevronDown size={16} className={`text-[var(--a-success)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-3 md:grid-cols-2 font-dm text-[13px] leading-relaxed text-[#24493E]">
          <div>
            <p className="font-semibold mb-1">Canada (CASL), the stricter of the two</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You need consent. For B2B cold email the usual basis is <b>implied consent</b>: the address is <b>conspicuously published</b> (e.g. on their website), with no statement that they do not want unsolicited messages, and your message is <b>relevant to their business role</b>. An enquiry or purchase in the last 6 months / 2 years is also implied consent.</li>
              <li>Every message must <b>identify the sender</b> (name, business, postal address, and a way to contact you).</li>
              <li>Every message must have a working <b>unsubscribe</b>, honoured within <b>10 business days</b>. We honour it instantly.</li>
              <li>Keep a record of the consent basis for each lead: set it per lead below. Leads with no basis cannot be emailed.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">United States (CAN-SPAM)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Opt-out model: B2B cold email is allowed, but headers and subject lines must be honest (no fake &ldquo;Re:&rdquo;), and the email must say it is a commercial message where relevant.</li>
              <li>Include a valid <b>physical postal address</b> and a clear opt-out; honour opt-outs within 10 business days and never sell or transfer the address.</li>
            </ul>
            <p className="font-semibold mt-3 mb-1">Built into this tool</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nothing sends without your approval; a daily cap and random spacing keep volume human.</li>
              <li>Footer with sender, postal address (OUTREACH_PHYSICAL_ADDRESS) and one-click unsubscribe on every email, plus a List-Unsubscribe header.</li>
              <li>Global suppression list (unsubscribes, bounces, do-not-contact). Sequences stop on reply or unsubscribe.</li>
              <li>No tracking pixels. Emails are never guessed: only addresses the business publishes. WhatsApp and LinkedIn are manual only (automated cold WhatsApp/SMS breaks Meta policy).</li>
            </ul>
          </div>
          <p className="md:col-span-2 text-[12px] text-[#4D6E63]">This is practical guidance, not legal advice. Other countries (EU/UK GDPR and PECR, Australia) have different rules: do not email leads there without checking.</p>
        </div>
      )}
    </section>
  );
}
