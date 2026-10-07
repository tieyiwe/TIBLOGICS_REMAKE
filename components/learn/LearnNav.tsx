"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import ReadingPrefsPanel from "@/components/a11y/ReadingPrefsPanel";
import InboxBell from "@/components/learn/InboxBell";
import InstallButton from "@/components/learn/pwa/InstallButton";
import { POINTS_PER_LEVEL } from "@/lib/learn/points-shared";
import { fmtNumber, rankName } from "@/lib/learn/format";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { useLocale, useSetLocale, useT } from "@/lib/i18n/client";

// Wide screens show the first PRIMARY links in the bar and the rest under
// "More"; the mobile panel lists everything.
const PRIMARY = 5;
const LINK_KEYS = [
  { href: "/learn", key: "learn.nav.dashboard" },
  { href: "/learn/tracks", key: "learn.nav.myTracks" },
  { href: "/learn/studio", key: "studio.nav" },
  { href: "/learn/community", key: "community.nav" },
  { href: "/learn/live", key: "live.nav" },
  { href: "/learn/review", key: "method.nav.review" },
  { href: "/learning-box/glossary", key: "learn.glossary.nav" },
  { href: "/learn/certificates", key: "learn.nav.certificates" },
  { href: "/learn/badges", key: "badges.nav" },
  { href: "/learn/portfolio", key: "method.nav.portfolio" },
  { href: "/learn/leaderboard", key: "game.nav.leaderboard" },
  { href: "/learn/team", key: "team.nav" },
  { href: "/learn/referrals", key: "referrals.nav" },
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
  const [moreOpen, setMoreOpen] = useState(false);
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

  // Escape closes the account panel and the More list.
  useEffect(() => {
    if (!open && !moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, moreOpen]);

  // Navigating closes the More list.
  useEffect(() => setMoreOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/learn" ? pathname === "/learn" : pathname.startsWith(href));
  const moreLinks = LINKS.slice(PRIMARY);
  const moreActive = moreLinks.some((l) => isActive(l.href));

  const levelHint =
    level.next == null
      ? t("learn.nav.topLevel")
      : t("learn.nav.toNextLevel", { n: fmtNumber(level.pointsToNext, locale), per: fmtNumber(POINTS_PER_LEVEL, locale) });

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <div className="flex shrink-0 items-center gap-2.5">
          <Link href="/learn" className="inline-block">
            <ArfaWordmark size="sm" academyLabel={t("learn.brand.academy")} />
          </Link>
          <Link
            href="/"
            className="hidden border-l border-[var(--border)] pl-2.5 text-[11px] leading-tight text-[var(--ink3)] hover:text-[var(--ink)] sm:block"
          >
            {t("learn.brand.by")}
            <span className="block font-black tracking-tight text-[var(--ink)]">
              TIB<span className="text-[var(--orange)]">LOGICS</span>
            </span>
          </Link>
        </div>

        <nav aria-label={t("learn.nav.label")} className="ml-1 hidden min-w-0 items-center xl:flex">
          {LINKS.slice(0, PRIMARY).map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors ${
                  active ? "bg-[var(--s2)] text-[var(--ink)]" : "text-[var(--ink3)] hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <div
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMoreOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-controls="learn-nav-more"
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors ${
                moreActive ? "bg-[var(--s2)] text-[var(--ink)]" : "text-[var(--ink3)] hover:text-[var(--ink)]"
              }`}
            >
              {t("learn.nav.more")}
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" className={moreOpen ? "rotate-180" : ""}>
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            {moreOpen && (
              <ul
                id="learn-nav-more"
                className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-lg"
              >
                {moreLinks.map((l) => {
                  const active = isActive(l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMoreOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
                          active ? "bg-[var(--s2)] text-[var(--ink)]" : "text-[var(--ink2)] hover:bg-[var(--s2)]"
                        }`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher className="hidden md:inline-flex" />
          {/* Shown only when this browser can install ARFA and it isn't installed */}
          <InstallButton />
          <ReadingPrefsPanel />

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

          <InboxBell />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t("learn.nav.menu")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-white"
          >
            {studentName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] bg-white px-4 py-3 xl:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
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
          <InstallButton variant="row" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            {t("learn.nav.signOut")}
          </button>
        </div>
      )}

      {open && (
        <div className="absolute right-4 top-full mt-1 hidden w-60 rounded-xl border border-[var(--border)] bg-white p-2 shadow-lg xl:block">
          <p className="px-3 py-2 text-xs text-[var(--ink3)]">
            {t("learn.nav.signedInAs")}
            <br />
            <strong className="text-[var(--ink)]">{studentName}</strong>
          </p>
          <p className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--ink3)]">{levelHint}</p>
          <div className="border-t border-[var(--border)] px-3 py-2 md:hidden">
            <LanguageSwitcher />
          </div>
          <InstallButton variant="row" />
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
