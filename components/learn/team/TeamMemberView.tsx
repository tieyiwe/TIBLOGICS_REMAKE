"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { fmtDate } from "@/lib/learn/format";

export interface MemberAssignmentView {
  id: string;
  slug: string;
  title: string;
  dueAt: string | null;
  percent: number;
  overdue: boolean;
}

/** What a member sees: who manages them, exactly what is shared, assignments, and a way out. */
export default function TeamMemberView({
  teamName,
  managers,
  assignments,
  role,
  entitled,
}: {
  teamName: string;
  managers: string[];
  assignments: MemberAssignmentView[];
  role: string;
  entitled: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leave() {
    if (!window.confirm(t("team.leave.confirm", { team: teamName }))) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/team/leave", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("team.error.generic"));
      router.push("/learn");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("team.error.generic"));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.member.kicker")}</p>
        <h1 className="break-words text-2xl font-black text-[var(--ink)]">{teamName}</h1>
        <p className="mt-1 text-sm text-[var(--ink2)]">{t(`team.role.${role}`)}</p>
      </header>
      {!entitled && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{t("team.member.inactive")}</p>}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-base font-bold text-[var(--ink)]">{t("team.member.managedBy")}</h2>
        <p className="mt-1 text-sm text-[var(--ink2)]">{managers.join(", ") || "–"}</p>
        <TeamPrivacyNote />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-base font-bold text-[var(--ink)]">{t("team.assigned.title")}</h2>
        {assignments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink3)]">{t("team.assigned.none")}</p>
        ) : (
          <AssignmentList items={assignments} locale={locale} />
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-base font-bold text-[var(--ink)]">{t("team.leave.title")}</h2>
        <p className="mt-1 text-sm text-[var(--ink2)]">{t("team.leave.body")}</p>
        <button type="button" onClick={leave} disabled={busy} className="mt-4 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
          {busy ? t("team.busy") : t("team.leave.cta")}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </section>
    </div>
  );
}

export function AssignmentList({ items, locale }: { items: MemberAssignmentView[]; locale: string }) {
  const t = useT();
  return (
    <ul className="mt-3 divide-y divide-[var(--border)]">
      {items.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <Link href={`/learn/track/${a.slug}`} className="text-sm font-bold text-[var(--ink)] hover:underline">{a.title}</Link>
            <p className={`text-xs ${a.overdue ? "font-bold text-red-700" : "text-[var(--ink3)]"}`}>
              {a.dueAt ? t(a.overdue ? "team.assign.overdue" : "team.assign.dueOn", { date: fmtDate(a.dueAt, locale) }) : t("team.assign.noDue")}
            </p>
          </div>
          <span className="shrink-0 text-sm font-black tabular-nums text-[var(--ink)]">{a.percent}%</span>
        </li>
      ))}
    </ul>
  );
}

/** "Your team manager can see: ... Not your drafts, reflections or Tutor chats." */
export function TeamPrivacyNote() {
  const t = useT();
  return (
    <div className="mt-4 rounded-xl bg-[var(--s2)] p-4 text-sm">
      <p className="font-semibold text-[var(--ink)]">{t("team.privacy.short")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.privacy.sees")}</p>
          <ul className="mt-1 space-y-1 text-[var(--ink2)]">
            {["progress", "scores", "certificates", "studio", "review", "activity"].map((k) => (
              <li key={k} className="flex gap-2"><span aria-hidden="true" className="text-green-700">✓</span>{t(`team.privacy.shared.${k}`)}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.privacy.never")}</p>
          <ul className="mt-1 space-y-1 text-[var(--ink2)]">
            {["drafts", "reflections", "tutor", "practice"].map((k) => (
              <li key={k} className="flex gap-2"><span aria-hidden="true" className="text-red-700">✕</span>{t(`team.privacy.private.${k}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
