"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText, Linkedin, PartyPopper } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import Confetti from "./Confetti";

// The certificate as people see it: the image (A4 landscape), and what to do
// with it: download the PDF or the image, add it to LinkedIn, copy the
// verification link. With confetti on the learner's own page.
export default function CertificateView({
  reference,
  imageUrl,
  pdfUrl,
  pngUrl,
  verifyUrl,
  linkedInUrl,
  alt,
  celebrate = false,
}: {
  reference: string;
  imageUrl: string;
  pdfUrl: string;
  pngUrl: string;
  verifyUrl: string;
  linkedInUrl?: string;
  alt: string;
  celebrate?: boolean;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(celebrate ? 1 : 0);
  const btn = "inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-bold";
  return (
    <div>
      {burst > 0 && <Confetti key={burst} />}
      <figure className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} width={2000} height={1414} className="block h-auto w-full" data-testid="certificate-image" />
      </figure>
      <p className="mt-3 text-center font-mono text-xs text-[var(--ink3)]">
        {t("learn.certview.reference")} <b className="text-[var(--ink)]">{reference}</b>
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <a href={pdfUrl} className={`${btn} bg-[#1B3A6B] text-white hover:bg-[#2251A3]`} data-testid="cert-pdf">
          <FileText size={16} aria-hidden /> {t("learn.certview.pdf")}
        </a>
        <a href={pngUrl} className={`${btn} border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--s2)]`} data-testid="cert-png">
          <Download size={16} aria-hidden /> {t("learn.certview.png")}
        </a>
        {linkedInUrl && (
          <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#0A66C2] text-white hover:opacity-90`} data-testid="cert-linkedin">
            <Linkedin size={16} aria-hidden /> {t("learn.certview.linkedin")}
          </a>
        )}
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(verifyUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              /* clipboard blocked */
            }
          }}
          className={`${btn} border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--s2)]`}
        >
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied ? t("learn.certview.copied") : t("learn.certview.copy")}
        </button>
        {celebrate && (
          <button type="button" onClick={() => setBurst((b) => b + 1)} className={`${btn} border border-[var(--border)] bg-white text-[var(--ink)] hover:bg-[var(--s2)]`} aria-label={t("learn.certview.celebrate")}>
            <PartyPopper size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
