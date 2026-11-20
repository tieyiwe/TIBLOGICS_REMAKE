"use client";

import { useEffect, useState } from "react";

// The /review form (app/(fullpage)/review/page.tsx), phone first. Labels come
// from the server in the invitation's language (the "reviews." namespace is
// server only). Every rule is enforced again by POST /api/reviews.

export type ReviewFormLabels = Record<
  | "name" | "role" | "rolePh" | "company" | "optional" | "rating" | "quote" | "quotePh" | "quoteHint"
  | "consent" | "consentHint" | "submit" | "sending" | "errRating" | "errName" | "errRole" | "errQuoteShort"
  | "errQuoteLong" | "errGeneric" | "thanksTitle" | "thanksBody" | "thanksBodyPrivate" | "thanksHome"
  | "alreadyTitle" | "alreadyBody" | "star1" | "star2" | "star3" | "star4" | "star5",
  string
>;

const input =
  "mt-1.5 w-full rounded-xl border border-[#D2DCE8] bg-white px-3.5 py-3 text-base text-[#0D1B2A] shadow-sm transition-colors placeholder:text-[#8A9BAE] focus:border-[#2251A3] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20";
const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

export default function ReviewForm(props: {
  token: string;
  locale: string;
  initialName: string;
  labels: ReviewFormLabels;
  quoteMin: number;
  quoteMax: number;
}) {
  const L = props.labels;
  const [name, setName] = useState(props.initialName);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [quote, setQuote] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [ts, setTs] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "thanks" | "already">(null);
  const [published, setPublished] = useState(false);

  useEffect(() => setTs(Date.now()), []);

  const len = quote.trim().length;
  const first = name.trim().split(/\s+/)[0] ?? "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rating) return setError(L.errRating);
    if (name.trim().length < 2) return setError(L.errName);
    if (role.trim().length < 2) return setError(L.errRole);
    if (len < props.quoteMin) return setError(L.errQuoteShort);
    if (len > props.quoteMax) return setError(L.errQuoteLong);
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: props.token, name, role, company: company || null, quote, rating, consent, locale: props.locale, website, ts }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string; published?: boolean };
      if (res.ok) {
        setPublished(!!body.published);
        setDone("thanks");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (res.status === 409 && body.code === "duplicate") {
        setDone("already");
      } else {
        setError(body.error || L.errGeneric);
      }
    } catch {
      setError(L.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-[#D2DCE8] bg-white p-7 text-center shadow-[0_8px_32px_rgba(27,58,107,0.10)]" role="status" data-testid={done === "thanks" ? "review-thanks" : "review-already"}>
        <div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F6EF] text-2xl text-[#0F6E56]">✓</div>
        <h2 className="mt-4 font-syne text-2xl font-extrabold text-[#0D1B2A]">{done === "thanks" ? L.thanksTitle.replace("{name}", first || name) : L.alreadyTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-[#3A4A5C]">
          {done === "thanks" ? (published ? L.thanksBody : L.thanksBodyPrivate) : L.alreadyBody}
        </p>
        <a href="/" className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#0D1B2A] px-6 text-sm font-bold text-white hover:opacity-90">
          {L.thanksHome}
        </a>
      </div>
    );
  }

  const shown = hover || rating;
  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border border-[#D2DCE8] bg-white p-5 shadow-[0_8px_32px_rgba(27,58,107,0.10)] sm:p-7" data-testid="review-form">
      <fieldset>
        <legend className="text-sm font-bold text-[#0D1B2A]">{L.rating}</legend>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-lg p-1 focus-within:ring-2 focus-within:ring-[#2251A3]" onMouseEnter={() => setHover(n)} data-testid={`review-star-${n}`}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <span className="sr-only">{L[`star${n}` as keyof ReviewFormLabels]}</span>
              <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true" className="transition-transform duration-150 hover:scale-110">
                <path d={STAR} fill={n <= shown ? "#F5A524" : "#E3E9F1"} />
              </svg>
            </label>
          ))}
        </div>
        <p className="mt-1 h-5 text-sm font-semibold text-[#B8500A]" aria-live="polite">{shown ? L[`star${shown}` as keyof ReviewFormLabels] : ""}</p>
      </fieldset>

      <div>
        <label htmlFor="rv-quote" className="text-sm font-bold text-[#0D1B2A]">{L.quote}</label>
        <textarea
          id="rv-quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          rows={5}
          maxLength={props.quoteMax + 50}
          placeholder={L.quotePh}
          className={`${input} resize-y leading-relaxed`}
          aria-describedby="rv-quote-hint"
          data-testid="review-quote"
        />
        <div id="rv-quote-hint" className="mt-1 flex justify-between gap-3 text-xs text-[#5A6E84]">
          <span>{L.quoteHint}</span>
          <span className={`shrink-0 tabular-nums ${len > props.quoteMax ? "font-bold text-red-700" : ""}`}>{len}/{props.quoteMax}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className="text-sm font-bold text-[#0D1B2A]">{L.name}</label>
          <input id="rv-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} className={input} data-testid="review-name" />
        </div>
        <div>
          <label htmlFor="rv-role" className="text-sm font-bold text-[#0D1B2A]">{L.role}</label>
          <input id="rv-role" value={role} onChange={(e) => setRole(e.target.value)} autoComplete="organization-title" maxLength={80} placeholder={L.rolePh} className={input} data-testid="review-role" />
        </div>
      </div>
      <div>
        <label htmlFor="rv-company" className="text-sm font-bold text-[#0D1B2A]">
          {L.company} <span className="font-normal text-[#5A6E84]">({L.optional})</span>
        </label>
        <input id="rv-company" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" maxLength={100} className={input} data-testid="review-company" />
      </div>

      {/* Honeypot: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="rv-website">Website</label>
        <input id="rv-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#F4F7FB] p-4">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#F47C20]" data-testid="review-consent" />
        <span>
          <span className="block text-sm font-semibold leading-snug text-[#0D1B2A]">{L.consent}</span>
          <span className="mt-1 block text-xs leading-relaxed text-[#5A6E84]">{L.consentHint}</span>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800" data-testid="review-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-gradient-to-r from-[#F47C20] to-[#F9A738] px-6 text-base font-extrabold text-[#0D1B2A] shadow-[0_6px_20px_rgba(244,124,32,0.35)] transition hover:brightness-105 disabled:opacity-60"
        data-testid="review-submit"
      >
        {busy ? L.sending : L.submit}
      </button>
    </form>
  );
}
