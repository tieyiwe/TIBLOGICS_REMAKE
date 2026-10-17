"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { fmt, type Labels } from "@/lib/growth/acquire/fmt";
import type { RefType } from "./track";

// Email capture for magnets and landing pages. The consent sentence shown
// here is the one the server stores (same dictionary, same language).

export default function CaptureForm({
  refType,
  slug,
  locale,
  labels: L,
  submitLabel,
  mode,
  askBusiness = true,
  askWhatsapp = false,
  answers = null,
  compact = false,
}: {
  refType: RefType;
  slug: string;
  locale: string;
  labels: Labels;
  submitLabel?: string;
  mode: "magnet" | "lead";
  askBusiness?: boolean;
  askWhatsapp?: boolean;
  answers?: number[] | null;
  compact?: boolean;
}) {
  const id = useId();
  const startedAt = useRef<number>(0);
  const statusRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (state === "done") statusRef.current?.focus();
  }, [state]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError(fmt(L, "acquire.form.invalidEmail"));
    if (!consent) return setError(fmt(L, "acquire.form.consentRequired"));
    setState("sending");
    try {
      const res = await fetch("/api/acquire/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refType,
          slug,
          email: email.trim(),
          name: name.trim() || null,
          business: askBusiness ? business.trim() || null : null,
          whatsapp: askWhatsapp ? whatsapp.trim() || null : null,
          consent: true,
          locale,
          answers,
          website: hp || null,
          ts: startedAt.current || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; accessUrl?: string | null };
      if (!res.ok) {
        setState("idle");
        return setError(data.error || fmt(L, "acquire.form.failed"));
      }
      setAccessUrl(data.accessUrl ?? null);
      setState("done");
    } catch {
      setState("idle");
      setError(fmt(L, "acquire.form.failed"));
    }
  }

  if (state === "done") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-2xl border border-[#B6E2D0] bg-[#E7F6F0] p-5 focus:outline-none">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0 text-[#0F6E56]" size={22} aria-hidden />
          <div className="min-w-0">
            <p className="font-syne text-lg font-bold text-[#0D1B2A]">
              {fmt(L, mode === "magnet" ? "acquire.form.doneTitle" : "acquire.form.leadDoneTitle")}
            </p>
            <p className="mt-1 break-words font-dm text-sm text-[#3A4A5C]">
              {fmt(L, mode === "magnet" ? "acquire.form.doneBody" : "acquire.form.leadDoneBody", { email: email.trim() })}
            </p>
            {accessUrl && (
              <a
                href={accessUrl}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-[#1B3A6B] px-5 font-dm text-sm font-bold text-white hover:bg-[#2251A3]"
              >
                {fmt(L, "acquire.form.open")}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const field =
    "mt-1 block w-full min-h-[44px] rounded-xl border border-[#C3CFDD] bg-white px-3.5 font-dm text-[15px] text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:border-[#2251A3] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/25";
  const lab = "block font-dm text-sm font-semibold text-[#0D1B2A]";

  return (
    <form onSubmit={submit} noValidate className={compact ? "space-y-3" : "space-y-3.5"} aria-describedby={error ? `${id}-err` : undefined}>
      <div>
        <label htmlFor={`${id}-email`} className={lab}>
          {fmt(L, "acquire.form.email")}
        </label>
        <div className="relative">
          <Mail size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-[50%] mt-0.5 -translate-y-1/2 text-[#5A6E84]" />
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${field} pl-10`}
            aria-invalid={!!error && !email ? true : undefined}
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-name`} className={lab}>
          {fmt(L, "acquire.form.name")}
        </label>
        <input id={`${id}-name`} autoComplete="given-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      {askBusiness && (
        <div>
          <label htmlFor={`${id}-biz`} className={lab}>
            {fmt(L, "acquire.form.business")}
          </label>
          <input id={`${id}-biz`} autoComplete="organization" value={business} maxLength={160} onChange={(e) => setBusiness(e.target.value)} className={field} />
        </div>
      )}
      {askWhatsapp && (
        <div>
          <label htmlFor={`${id}-wa`} className={lab}>
            {fmt(L, "acquire.form.whatsapp")}
          </label>
          <input id={`${id}-wa`} type="tel" autoComplete="tel" inputMode="tel" value={whatsapp} maxLength={40} onChange={(e) => setWhatsapp(e.target.value)} className={field} />
        </div>
      )}
      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>
      <label htmlFor={`${id}-consent`} className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#F4F7FB] p-3">
        <input
          id={`${id}-consent`}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#1B3A6B]"
          aria-invalid={!!error && !consent ? true : undefined}
        />
        <span className="font-dm text-[13px] leading-relaxed text-[#3A4A5C]">{fmt(L, "acquire.form.consent")}</span>
      </label>
      {error && (
        <p id={`${id}-err`} role="alert" className="rounded-lg bg-[#FDECEC] px-3 py-2 font-dm text-sm font-medium text-[#B91C1C]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#B8500A] px-5 font-dm text-[15px] font-bold text-white shadow-[0_6px_18px_rgba(184,80,10,0.25)] transition-colors hover:bg-[#9c4408] disabled:opacity-70"
      >
        {state === "sending" && <LoaderCircle size={18} className="animate-spin" aria-hidden />}
        {state === "sending" ? fmt(L, "acquire.form.sending") : submitLabel || fmt(L, "acquire.form.submit")}
      </button>
      <p className="text-center font-dm text-xs text-[#5A6E84]">
        {fmt(L, "acquire.form.privacy")}{" "}
        <Link href="/privacy" className="font-semibold text-[#2251A3] underline underline-offset-2">
          {fmt(L, "acquire.form.privacyLink")}
        </Link>
      </p>
    </form>
  );
}
