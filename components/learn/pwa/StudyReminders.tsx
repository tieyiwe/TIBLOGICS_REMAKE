"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import type { ReminderSettings } from "@/lib/learn/reminders/store";
import { normalizePhone } from "@/lib/learn/reminders/shared";

const FALLBACK_ZONES = ["UTC", "Africa/Abidjan", "Africa/Lagos", "Africa/Douala", "Africa/Kinshasa", "Africa/Nairobi", "Africa/Dar_es_Salaam", "Africa/Johannesburg", "Europe/London", "Europe/Paris", "America/New_York", "America/Toronto", "America/Chicago", "America/Los_Angeles"];
// Monday first.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Account settings: study reminders by WhatsApp (opt-in, with consent) or email. */
export default function StudyReminders({ initial, email, isNew }: { initial: ReminderSettings; email: string; isNew: boolean }) {
  const t = useT();
  const locale = useLocale();
  const [s, setS] = useState<ReminderSettings>(initial);
  const [whatsappOn, setWhatsappOn] = useState(initial.whatsappOn);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [emailOn, setEmailOn] = useState(initial.emailOn);
  const [timeLocal, setTimeLocal] = useState(initial.timeLocal);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [days, setDays] = useState<number[]>(initial.days);
  const [language, setLanguage] = useState(initial.language);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [zones, setZones] = useState<string[]>(FALLBACK_ZONES);

  useEffect(() => {
    const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const all = (Intl as typeof Intl & { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? FALLBACK_ZONES;
    setZones([...new Set(["UTC", ...all, own, initial.timezone].filter(Boolean))]);
    // A learner who never saved reminders starts in this device's zone.
    if (isNew && own) setTimezone(own);
  }, [initial.timezone, isNew]);

  const dayNames = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    // 2023-01-01 was a Sunday.
    return Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, f.format(new Date(Date.UTC(2023, 0, 1 + d)))]));
  }, [locale]);

  const fmt = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));

  // Consent is asked again for a new number or after an opt-out.
  const needsConsent = whatsappOn && !(s.whatsappOn && s.consentAt && !s.optedOutAt && s.phone === normalizePhone(phone));
  const phoneValid = !phone.trim() || !!normalizePhone(phone);

  async function call(method: "PATCH" | "DELETE") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/learn/reminders", {
        method,
        headers: { "Content-Type": "application/json" },
        body:
          method === "PATCH"
            ? JSON.stringify({ whatsappOn, phone: phone.trim() || null, emailOn, timeLocal, timezone, days, language, consent })
            : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? t("learn.api.saveFailed") });
        return;
      }
      const next = data as ReminderSettings;
      setS(next);
      setWhatsappOn(next.whatsappOn);
      setEmailOn(next.emailOn);
      setPhone(next.phone ?? "");
      setConsent(false);
      setMsg({ ok: true, text: method === "DELETE" ? t("pwa.reminders.stopped") : t("pwa.reminders.saved") });
    } catch {
      setMsg({ ok: false, text: t("learn.api.saveFailed") });
    } finally {
      setBusy(false);
    }
  }

  const label = "block text-xs font-semibold text-[var(--ink2)]";
  const field =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)] min-h-[40px]";

  return (
    <section id="reminders" aria-labelledby="reminders-title" className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6" data-testid="study-reminders">
      <h2 id="reminders-title" className="text-sm font-bold text-[var(--ink)]">
        {t("pwa.reminders.title")}
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("pwa.reminders.intro")}</p>

      {s.pausedUntil && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{t("pwa.reminders.paused", { date: fmt(s.pausedUntil) })}</p>
      )}
      {s.optOutSource === "whatsapp_stop" && s.optedOutAt && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900" data-testid="wa-stopped">
          {t("pwa.reminders.optedOutWa", { date: fmt(s.optedOutAt) })}
        </p>
      )}

      <form
        className="mt-4 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void call("PATCH");
        }}
      >
        {/* WhatsApp */}
        <fieldset className="rounded-xl border border-[var(--border)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--ink)]">{t("pwa.reminders.whatsapp")}</legend>
          {s.whatsappAvailable ? (
            <>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="whatsappOn"
                  checked={whatsappOn}
                  onChange={(e) => setWhatsappOn(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--orange)]"
                />
                <span className="text-sm text-[var(--ink2)]">{t("pwa.reminders.whatsappHelp")}</span>
              </label>
              {whatsappOn && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="wa-phone" className={label}>
                      {t("pwa.reminders.phone")}
                    </label>
                    <input
                      id="wa-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+225 07 01 02 03 04"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-invalid={!phoneValid}
                      aria-describedby="wa-phone-help"
                      className={field}
                    />
                    <p id="wa-phone-help" className={`mt-1 text-xs ${phoneValid ? "text-[var(--ink3)]" : "font-semibold text-red-700"}`}>
                      {phoneValid ? t("pwa.reminders.phoneHelp") : t("pwa.reminders.err.phone")}
                    </p>
                  </div>
                  {needsConsent ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-[var(--s2)] p-3">
                      <input
                        type="checkbox"
                        name="consent"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--orange)]"
                      />
                      <span className="text-xs text-[var(--ink)]">{t("pwa.reminders.consent")}</span>
                    </label>
                  ) : (
                    s.consentAt && <p className="text-xs text-[var(--ink3)]">{t("pwa.reminders.consentGiven", { date: fmt(s.consentAt) })}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-[var(--ink3)]">{t("pwa.reminders.unavailable")}</p>
          )}
        </fieldset>

        {/* Email */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="emailOn"
            checked={emailOn}
            onChange={(e) => setEmailOn(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--orange)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">{t("pwa.reminders.email")}</span>
            <span className="mt-0.5 block text-xs text-[var(--ink3)]">{t("pwa.reminders.emailHelp", { email })}</span>
          </span>
        </label>

        {/* Schedule */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rem-time" className={label}>
              {t("pwa.reminders.time")}
            </label>
            <input id="rem-time" type="time" step={900} value={timeLocal} onChange={(e) => setTimeLocal(e.target.value)} className={field} required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="rem-tz" className={label}>
              {t("pwa.reminders.timezone")}
            </label>
            <select id="rem-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} className={field}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className={label}>{t("pwa.reminders.days")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEK.map((d) => {
              const on = days.includes(d);
              return (
                <label
                  key={d}
                  className={`flex min-h-[40px] cursor-pointer items-center rounded-full border px-3 text-xs font-semibold focus-within:ring-2 focus-within:ring-[var(--orange)] ${
                    on ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--border)] bg-white text-[var(--ink2)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => setDays((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d]))}
                  />
                  {dayNames[d]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="rem-lang" className={label}>
            {t("pwa.reminders.language")}
          </label>
          <select id="rem-lang" value={language} onChange={(e) => setLanguage(e.target.value === "fr" ? "fr" : "en")} className={`${field} sm:w-60`}>
            <option value="en">{t("pwa.reminders.lang.en")}</option>
            <option value="fr">{t("pwa.reminders.lang.fr")}</option>
          </select>
        </div>

        {s.whatsappOn && s.lastStatus && ["sent", "delivered", "read", "failed"].includes(s.lastStatus) && (
          <p className="text-xs text-[var(--ink3)]" data-testid="wa-last-status">
            {t("pwa.reminders.lastStatus", { status: t(`pwa.reminders.status.${s.lastStatus}`) })}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy || (whatsappOn && (!phoneValid || !phone.trim() || (needsConsent && !consent)))}
            className="min-h-[44px] rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? t("pwa.reminders.saving") : t("pwa.reminders.save")}
          </button>
          {(s.whatsappOn || s.emailOn) && (
            <button type="button" onClick={() => void call("DELETE")} disabled={busy} className="text-sm font-semibold text-red-700 underline">
              {t("pwa.reminders.stopAll")}
            </button>
          )}
        </div>
        {msg && (
          <p role={msg.ok ? "status" : "alert"} className={`text-xs font-semibold ${msg.ok ? "text-green-700" : "text-red-700"}`}>
            {msg.text}
          </p>
        )}
      </form>
    </section>
  );
}
