"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

// Parent dashboard: the child's Game Forge share links (/play/[token]), each
// with "Play" and "Turn off". The server checks the parent link and that the
// game belongs to this child (app/api/parent/[token], action "revokeGame").
export interface ParentGame {
  token: string;
  title: string;
  template: string;
  views: number;
  createdAt: string;
}

const ICON: Record<string, string> = { clicker: "🍪", quiz: "❓", platformer: "🐸", adventure: "🗺️" };

export default function ParentGames({ token, games, firstName, dates }: { token: string; games: ParentGame[]; firstName: string; dates: Record<string, string> }) {
  const t = useT();
  const [list, setList] = useState(games);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function revoke(share: string) {
    setBusy(share);
    setMsg(null);
    const res = await fetch(`/api/parent/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revokeGame", share }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(null);
    if (!res?.ok) return setMsg({ ok: false, text: data.error ?? t("learn.parent.err.failed") });
    setList((l) => l.filter((g) => g.token !== share));
    setMsg({ ok: true, text: data.message ?? "" });
  }

  return (
    <section aria-labelledby="parent-games" className="rounded-2xl border border-[var(--border)] bg-white p-5" data-testid="parent-games">
      <h2 id="parent-games" className="text-base font-bold text-[var(--ink)]">🎮 {t("learn.parent.games.title")}</h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("learn.parent.games.intro", { name: firstName })}</p>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      )}
      {list.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--ink3)]">{t("learn.parent.games.none", { name: firstName })}</p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {list.map((g) => (
            <li key={g.token} className="flex flex-wrap items-center justify-between gap-3 py-3" data-testid="parent-game">
              <span className="min-w-0 text-sm text-[var(--ink)]">
                <span aria-hidden="true">{ICON[g.template] ?? "🎮"}</span> <strong className="break-words">{g.title}</strong>
                <span className="block text-xs text-[var(--ink3)]">{t("learn.parent.games.meta", { date: dates[g.token] ?? "", n: g.views })}</span>
              </span>
              <span className="flex gap-2">
                <a
                  href={`/play/${g.token}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] hover:bg-[var(--s2)]"
                >
                  {t("learn.parent.games.play")}
                </a>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => revoke(g.token)}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  data-testid="parent-game-revoke"
                >
                  {busy === g.token ? "…" : t("learn.parent.games.revoke")}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
