"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES, isLocale, type Locale } from "@/lib/i18n/config";
import { useLocale, useSetLocale, useT } from "@/lib/i18n/client";

// Accessibility mode (Part B rule 7) is a stored preference, not a cosmetic
// toggle — the exam engine reads it server-side to grant 1.5x time.
export default function AccountSettings({
  accessibilityMode,
  leaderboardOptIn,
}: {
  accessibilityMode: boolean;
  leaderboardOptIn: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const router = useRouter();
  const [a11y, setA11y] = useState(accessibilityMode);
  const [board, setBoard] = useState(leaderboardOptIn);
  const [saved, setSaved] = useState("");
  const [failed, setFailed] = useState("");

  function flashSaved() {
    setSaved(t("learn.account.saved"));
    setTimeout(() => setSaved(""), 2000);
  }

  async function save(patch: { accessibilityMode?: boolean; leaderboardOptIn?: boolean }) {
    setSaved("");
    setFailed("");
    const res = await fetch("/api/learn/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (res?.ok) {
      flashSaved();
      router.refresh();
    } else {
      const d = res ? await res.json().catch(() => ({})) : {};
      setFailed(d.error ?? t("learn.account.saveFailed"));
    }
  }

  const Toggle = ({
    id,
    checked,
    onChange,
    title,
    description,
  }: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    title: string;
    description: string;
  }) => (
    <div className="flex items-start justify-between gap-5 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-[var(--ink)]">
          {title}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink2)]">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--orange)]" : "bg-[var(--s3)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--ink)]">{t("learn.account.preferences")}</h2>
        {saved && (
          <span role="status" className="text-xs font-semibold text-green-700">
            ✓ {saved}
          </span>
        )}
      </div>
      {failed && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {failed}
        </p>
      )}

      <div className="mt-2 divide-y divide-[var(--border)]">
        <Toggle
          id="a11y"
          checked={a11y}
          onChange={(v) => {
            setA11y(v);
            save({ accessibilityMode: v });
          }}
          title={t("learn.account.accessibilityMode")}
          description={t("learn.account.accessibilityDesc")}
        />
        <Toggle
          id="board"
          checked={board}
          onChange={(v) => {
            setBoard(v);
            save({ leaderboardOptIn: v });
          }}
          title={t("learn.account.leaderboard")}
          description={t("learn.account.leaderboardDesc")}
        />

        {/* Language: the same choice as the switcher in the menu. It is saved
            on the account (so it follows the learner to other devices and
            into emails) and as a cookie for this browser. */}
        <div className="py-4">
          <label htmlFor="locale" className="block text-sm font-semibold text-[var(--ink)]">
            {t("common.language")}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ink2)]">{t("learn.account.languageDesc")}</p>
          <select
            id="locale"
            value={locale}
            onChange={async (e) => {
              const v = e.target.value;
              if (!isLocale(v)) return;
              await setLocale(v as Locale);
              flashSaved();
            }}
            className="mt-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_NAMES[l]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
