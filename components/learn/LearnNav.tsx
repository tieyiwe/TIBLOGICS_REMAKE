"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { POINTS_PER_LEVEL } from "@/lib/learn/points";
import { fmtNumber, rankName } from "@/lib/learn/format";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { useLocale, useSetLocale, useT } from "@/lib/i18n/client";

const LINK_KEYS = [
  { href: "/learn", key: "learn.nav.dashboard" },
  { href: "/learn/tracks", key: "learn.nav.myTracks" },
  { href: "/learn/certificates", key: "learn.nav.certificates" },
  { href: "/learn/account", key: "learn.nav.account" },
];

export default function LearnNav({
  studentName,
  points,
  level,
  savedLocale,
}: {
  studentName: string;
  points: number;
  level: { index: number; progress: number; pointsToNext: number; next: number | null };
  /** Student.locale: the language saved on the account. */
  savedLocale?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const LINKS = LINK_KEYS.map((l) => ({ href: l.href, label: t(l.key) }));
  const rank = rankName(t, level.index);

  // Keep the account's language and this browser's in step. A browser that
  // has never chosen a language takes the account's (so the choice follows
  // the learner to a new device); a choice made while signed out is saved to
  // the account (so emails match).
  useEffect(() => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${LOCALE_COOKIE}=`))?.split("=")[1];
    if (!cookie) {
      if (isLocale(savedLocale) && savedLocale !== locale) void setLocale(savedLocale);
    } else if (isLocale(cookie) && cookie !== savedLocale) {
      fetch("/api/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: cookie }),
      }).catch(() => {});
    }
    // Once per page load is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const levelHint =
    level.next == null
      ? t("learn.nav.topLevel")
      : t("learn.nav.toNextLevel", { n: fmtNumber(level.pointsToNext, locale), per: fmtNumber(POINTS_PER_LEVEL, locale) });

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/learn" className="shrink-0 text-base font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
          <span className="ml-1 text-xs font-semibold text-[var(--ink3)]">Learn</span>
        </Link>

        <nav aria-label={t("learn.nav.label")} className="ml-4 hidden gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = l.href === "/learn" ? pathname === "/learn" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-[var(--s2)] text-[var(--ink)]" : "text-[var(--ink3)] hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher className="hidden md:inline-flex" />

          {/* Points + level */}
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-[var(--ink)]">
              {t("learn.nav.points", { n: fmtNumber(points, locale), rank })}
            </p>
            <div
              className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--s3)]"
              role="progressbar"
              aria-valuenow={Math.round(level.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                level.next == null
                  ? t("learn.nav.progressMax")
                  : t("learn.nav.progressLabel", { n: fmtNumber(level.pointsToNext, locale) })
              }
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738]"
                style={{ width: `${Math.round(level.progress * 100)}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={t("learn.nav.menu")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-white"
          >
            {studentName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {open && (
        <div role="menu" className="border-t border-[var(--border)] bg-white px-4 py-3 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ink2)]"
            >
              {l.label}
            </Link>
          ))}
          <p className="mt-1 border-t border-[var(--border)] px-3 pt-3 text-xs text-[var(--ink3)]">
            {t("learn.nav.points", { n: fmtNumber(points, locale), rank })} · {levelHint}
          </p>
          <div className="px-3 py-3">
            <LanguageSwitcher />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            {t("learn.nav.signOut")}
          </button>
        </div>
      )}

      {open && (
        <div className="absolute right-4 top-full mt-1 hidden w-60 rounded-xl border border-[var(--border)] bg-white p-2 shadow-lg sm:block">
          <p className="px-3 py-2 text-xs text-[var(--ink3)]">
            {t("learn.nav.signedInAs")}
            <br />
            <strong className="text-[var(--ink)]">{studentName}</strong>
          </p>
          <p className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--ink3)]">{levelHint}</p>
          <div className="border-t border-[var(--border)] px-3 py-2 md:hidden">
            <LanguageSwitcher />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            {t("learn.nav.signOut")}
          </button>
        </div>
      )}
    </header>
  );
}
