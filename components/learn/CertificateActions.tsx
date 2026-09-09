"use client";

import { useState } from "react";

// Share + save actions. Printing to PDF uses the browser's own engine, which
// keeps the certificate a single source of truth — no second rendering path
// that could drift from what's shown here.
export default function CertificateActions({
  certificateName,
  verificationId,
  issuedAt,
}: {
  certificateName: string;
  verificationId: string;
  issuedAt: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const issued = new Date(issuedAt);
  const linkedIn =
    `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME` +
    `&name=${encodeURIComponent(certificateName)}` +
    `&organizationName=${encodeURIComponent("TIBLOGICS")}` +
    `&issueYear=${issued.getFullYear()}` +
    `&issueMonth=${issued.getMonth() + 1}` +
    `&certUrl=${encodeURIComponent(url)}` +
    `&certId=${encodeURIComponent(verificationId)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the URL is visible in the address bar anyway */
    }
  }

  return (
    <>
      {/* Hide everything except the certificate when printing */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none; box-shadow: none;
          }
        }
      `}</style>

      <div className="mt-5 flex flex-wrap justify-center gap-3 print:hidden">
        <a
          href={linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#0A66C2] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Add to LinkedIn
        </a>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Save as PDF
        </button>
        <button
          onClick={copy}
          className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink2)] transition-colors hover:border-[var(--ink3)]"
        >
          {copied ? "✓ Link copied" : "Copy verification link"}
        </button>
      </div>
    </>
  );
}
