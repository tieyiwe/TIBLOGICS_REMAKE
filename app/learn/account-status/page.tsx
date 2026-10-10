import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Ban, LogOut, PauseCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import { getLocale, getT } from "@/lib/i18n/server";
import { readAccountState, readStatusToken, type AccountState } from "@/lib/learn/account-status";
import { ARFA_EMAIL } from "@/lib/learn/emails";
import ClearSession from "./ClearSession";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("accountStatus.metaTitle"), robots: { index: false } };
}

// Where a suspended or blocked learner lands: from a refused sign-in (with a
// short-lived signed token, ?t=) or from an existing session that
// lib/learn/session.ts refused. Shows the status, the end date and the reason
// the admin wrote, then clears the session cookie. Never calls getStudent()
// (which would send this page back to itself).
export default async function AccountStatusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  let studentId = readStatusToken(one("t"));
  let hasSession = false;
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.studentId) {
      hasSession = true;
      studentId ??= session.user.studentId;
    }
  } catch {
    /* no session */
  }

  let state: AccountState | null = studentId ? await readAccountState(studentId) : null;
  if (state && state.status === "active") state = null;
  const blockedOnly = !state && one("blocked") === "1";

  const kind: "suspended" | "blocked" | "signedout" =
    state?.status === "suspended" ? "suspended" : state || blockedOnly ? "blocked" : "signedout";
  const Icon = kind === "suspended" ? PauseCircle : kind === "blocked" ? Ban : LogOut;
  const contact = t("accountStatus.contact", { email: ARFA_EMAIL }).split(ARFA_EMAIL);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      {hasSession && <ClearSession />}
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link href="/learning-box" className="inline-block">
            <ArfaWordmark size="md" academyLabel={t("learn.brand.academy")} />
          </Link>
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <span
            className={`grid h-12 w-12 place-items-center rounded-2xl ${kind === "blocked" ? "bg-red-50 text-red-700" : kind === "suspended" ? "bg-amber-50 text-amber-800" : "bg-[var(--s2)] text-[var(--ink2)]"}`}
            aria-hidden
          >
            <Icon size={24} />
          </span>
          <h1 className="mt-4 text-xl font-black text-[var(--ink)]">
            {kind === "suspended" ? t("accountStatus.suspendedTitle") : kind === "blocked" ? t("accountStatus.blockedTitle") : t("accountStatus.signedOutTitle")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
            {kind === "suspended"
              ? state?.suspendedUntil
                ? t("accountStatus.suspendedUntil", {
                    date: state.suspendedUntil.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
                  })
                : t("accountStatus.suspendedOpen")
              : kind === "blocked"
                ? t("accountStatus.blockedBody")
                : t("accountStatus.signedOutBody", { email: ARFA_EMAIL })}
          </p>
          {state?.statusReason && (kind === "suspended" || kind === "blocked") && (
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--s2)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("accountStatus.reason")}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-[var(--ink)]">{state.statusReason}</p>
            </div>
          )}
          {kind !== "signedout" && (
            <p className="mt-4 text-sm text-[var(--ink2)]">
              {contact[0]}
              <a href={`mailto:${ARFA_EMAIL}`} className="font-semibold text-[var(--blue2)] underline underline-offset-2">
                {ARFA_EMAIL}
              </a>
              {contact[1]}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--s2)]">
              {t("accountStatus.backHome")}
            </Link>
            <Link href="/learn/login" className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              {t("accountStatus.signIn")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
