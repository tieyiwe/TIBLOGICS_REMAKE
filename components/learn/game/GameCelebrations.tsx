"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/lib/i18n/client";
import { rankName, fmtNumber } from "@/lib/learn/format";
import { BADGE_BY_ID, TIER_COLORS, badgeDescKey, badgeNameKey, rankIcon } from "@/lib/learn/badge-defs";
import { GAME_EVENT, type GameEventDetail } from "@/lib/learn/game-client";
import { confettiBurst } from "./confetti";

interface Toast {
  id: number;
  kind: "xp" | "badge";
  points?: number;
  reason?: GameEventDetail["reason"];
  badgeId?: string;
}

const TOAST_MS = 4500;

// Mounted once in the member layout. Runners call celebrate() (see
// lib/learn/game-client.ts) with what an API returned; this renders the
// "+N XP" and badge toasts, the level-up dialog and the confetti.
export default function GameCelebrations() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  useEffect(() => {
    const onGame = (e: Event) => {
      const d = (e as CustomEvent<GameEventDetail>).detail ?? {};
      const add: Toast[] = [];
      if ((d.points ?? 0) > 0) add.push({ id: nextId.current++, kind: "xp", points: d.points, reason: d.reason });
      for (const b of d.newBadges ?? []) {
        if (BADGE_BY_ID.has(b)) add.push({ id: nextId.current++, kind: "badge", badgeId: b });
      }
      if (add.length) {
        setToasts((ts) => [...ts, ...add].slice(-4));
        for (const x of add) setTimeout(() => dismiss(x.id), TOAST_MS + (x.kind === "badge" ? 1500 : 0));
      }
      if (d.levelUp) setLevelUp(d.levelUp.index);
      // Confetti for the big moments; a lesson's +10 gets just the toast.
      if (d.levelUp || (d.newBadges?.length ?? 0) > 0 || (d.points ?? 0) >= 40) confettiBurst();
    };
    window.addEventListener(GAME_EVENT, onGame);
    return () => window.removeEventListener(GAME_EVENT, onGame);
  }, [dismiss]);

  return (
    <>
      {/* Polite live region: announced without stealing focus. */}
      <div
        role="status"
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((x) =>
          x.kind === "xp" ? (
            <div
              key={x.id}
              className="game-toast pointer-events-auto flex items-center gap-3 rounded-2xl bg-[var(--ink)] px-4 py-3 text-white shadow-xl"
            >
              <span className="game-xp-pop text-xl font-black text-[#F9A738]">
                {t("game.toast.xp", { n: fmtNumber(x.points ?? 0, locale) })}
              </span>
              <span className="text-sm font-semibold text-white/80">{t(`game.toast.reason.${x.reason ?? "generic"}`)}</span>
              <button
                onClick={() => dismiss(x.id)}
                aria-label={t("game.toast.dismiss")}
                className="ml-1 rounded-full px-1.5 text-white/60 hover:text-white"
              >
                ×
              </button>
            </div>
          ) : (
            <BadgeToast key={x.id} id={x.badgeId!} onDismiss={() => dismiss(x.id)} />
          ),
        )}
      </div>

      {levelUp != null && (
        <LevelUpDialog
          index={levelUp}
          onClose={() => {
            setLevelUp(null);
            router.refresh();
          }}
          title={t("game.levelUp.title")}
          body={t("game.levelUp.body", { rank: rankName(t, levelUp) })}
          rank={rankName(t, levelUp)}
          cta={t("game.levelUp.cta")}
          closeLabel={t("game.toast.dismiss")}
        />
      )}
    </>
  );
}

function BadgeToast({ id, onDismiss }: { id: string; onDismiss: () => void }) {
  const t = useT();
  const def = BADGE_BY_ID.get(id)!;
  return (
    <div className="game-toast pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border-2 border-[#F9A738] bg-white px-4 py-3 shadow-xl">
      <span
        aria-hidden="true"
        className="game-badge-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
        style={{ background: def.tier ? `${TIER_COLORS[def.tier]}22` : "#F9A73822" }}
      >
        {def.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wide text-[var(--orange2)]">{t("game.toast.badge")}</span>
        <span className="block text-sm font-black text-[var(--ink)]">{t(badgeNameKey(id))}</span>
        <span className="block text-xs text-[var(--ink2)]">{t(badgeDescKey(id))}</span>
      </span>
      <button onClick={onDismiss} aria-label={t("game.toast.dismiss")} className="ml-1 self-start rounded-full px-1.5 text-[var(--ink3)] hover:text-[var(--ink)]">
        ×
      </button>
    </div>
  );
}

function LevelUpDialog({
  index,
  onClose,
  title,
  body,
  rank,
  cta,
  closeLabel,
}: {
  index: number;
  onClose: () => void;
  title: string;
  body: string;
  rank: string;
  cta: string;
  closeLabel: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // Held in a ref so a parent re-render does not re-run the effect (which
  // would move focus and lose the element to return it to).
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    button.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== "Tab" || !box.current) return;
      // Focus trap: cycle within the dialog.
      const items = box.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])");
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[rgba(13,27,42,0.55)] p-4" onClick={onClose}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="levelup-title"
        aria-describedby="levelup-body"
        onClick={(e) => e.stopPropagation()}
        className="game-modal relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-3 top-3 rounded-full px-2 py-1 text-lg text-[var(--ink3)] hover:text-[var(--ink)]"
        >
          ×
        </button>
        <div
          aria-hidden="true"
          className="game-badge-pop mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--orange)] to-[#F9A738] text-5xl shadow-lg"
        >
          {rankIcon(index)}
        </div>
        <p id="levelup-title" className="mt-5 text-xs font-bold uppercase tracking-widest text-[var(--orange2)]">
          {title}
        </p>
        <p className="mt-1 text-2xl font-black text-[var(--ink)]">{rank}</p>
        <p id="levelup-body" className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
          {body}
        </p>
        <button
          ref={button}
          onClick={onClose}
          className="mt-6 rounded-full bg-[var(--ink)] px-7 py-3 text-sm font-bold text-white hover:opacity-90"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
