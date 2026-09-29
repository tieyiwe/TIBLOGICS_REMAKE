"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, ExternalLink, RotateCcw, Star } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { StudioChallengeMeta } from "@/lib/learn/studio/types";

// Shared building blocks for the four prompt-engineering Studio tools
// (prompt-builder, prompt-arena, critic-mode, test-bench). Shared text lives in
// lib/i18n/messages/studio-prompt-builder.ts under "studio.prompt-builder.ui.*".

export const ACCENT = "#F47C20";
const UI = "studio.prompt-builder.ui";

export type Progress = Record<string, { done: boolean; perfect: boolean }>;

export function Stars({ n, size = 18, label }: { n: number; size?: number; label?: string }) {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? t(`${UI}.stars`, { n })}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          style={{ width: size, height: size }}
          className={i <= n ? "fill-[#F47C20] text-[#F47C20]" : "text-[var(--border)]"}
        />
      ))}
    </span>
  );
}

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("ok");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 2200);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${className}`}
    >
      {state === "ok" ? <Check className="h-3.5 w-3.5 text-green-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      <span aria-live="polite">{state === "ok" ? t(`${UI}.copied`) : state === "fail" ? t(`${UI}.copyFail`) : t(`${UI}.copy`)}</span>
    </button>
  );
}

/** "Try it for real": a copyable prompt and a note about free AI accounts. */
export function TryForReal({ prompt, intro }: { prompt: string; intro?: string }) {
  const t = useT();
  return (
    <section aria-label={t(`${UI}.real.title`)} className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--s2)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[var(--ink)]">
          <span aria-hidden="true">🚀</span> {t(`${UI}.real.title`)}
        </h3>
        <CopyButton text={prompt} />
      </div>
      <p className="mt-1 text-xs text-[var(--ink2)]">{intro ?? t(`${UI}.real.body`)}</p>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-relaxed text-[var(--ink)]">{prompt}</pre>
      <p className="mt-2 text-xs text-[var(--ink3)]">
        {t(`${UI}.real.note`)}{" "}
        <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-[var(--blue2)] underline">
          Claude <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>{" "}
        ·{" "}
        <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-[var(--blue2)] underline">
          ChatGPT <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </p>
    </section>
  );
}

/** Grid of challenge cards, plus an optional free-play card. */
export function ChallengePicker({
  ns,
  challenges,
  progress,
  onPick,
  freePlay,
  compact,
}: {
  ns: string;
  challenges: StudioChallengeMeta[];
  progress: Progress;
  onPick: (id: string | null) => void;
  freePlay?: boolean;
  compact?: boolean;
}) {
  const t = useT();
  return (
    <div>
      <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-[var(--ink3)]">{t("studio.challenges")}</h2>
      <ul className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {challenges.map((c) => {
          const p = progress[c.id];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="flex h-full w-full flex-col rounded-2xl border-2 border-[var(--border)] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
                    <span aria-hidden="true">{"●".repeat(c.difficulty)}{"○".repeat(3 - c.difficulty)}</span> {t(`studio.difficulty.${c.difficulty}`)}
                  </span>
                  {p?.done && <Stars n={p.perfect ? 3 : 1} size={14} label={p.perfect ? t("studio.perfect") : t("studio.done")} />}
                </span>
                <span className="mt-1.5 font-bold text-[var(--ink)]">{t(`${ns}.ch.${c.id}.title`)}</span>
                <span className="mt-1 text-sm text-[var(--ink2)]">{t(`${ns}.ch.${c.id}.brief`)}</span>
              </button>
            </li>
          );
        })}
        {freePlay && (
          <li>
            <button
              type="button"
              onClick={() => onPick(null)}
              className="flex h-full w-full flex-col rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--s2)] p-4 text-left hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
            >
              <span className="font-bold text-[var(--ink)]">
                <span aria-hidden="true">🎨</span> {t("studio.sandbox")}
              </span>
              <span className="mt-1 text-sm text-[var(--ink2)]">{t(`${ns}.freePlayBody`)}</span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

/** Header strip above a running challenge: back link, title, difficulty. */
export function ChallengeHeader({
  ns,
  challenge,
  onBack,
  right,
}: {
  ns: string;
  challenge: StudioChallengeMeta | null;
  onBack: () => void;
  right?: ReactNode;
}) {
  const t = useT();
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <button type="button" onClick={onBack} className="text-xs font-semibold text-[var(--blue2)] underline">
          ← {t(`${UI}.allChallenges`)}
        </button>
        <h2 className="mt-1 text-lg font-black leading-tight text-[var(--ink)]">
          {challenge ? t(`${ns}.ch.${challenge.id}.title`) : t("studio.sandbox")}
        </h2>
        {challenge && (
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
            {t(`studio.difficulty.${challenge.difficulty}`)}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/** The end-of-challenge card. */
export function ResultCard({
  stars,
  title,
  body,
  onRetry,
  onNext,
  children,
}: {
  stars: number;
  title?: string;
  body?: ReactNode;
  onRetry: () => void;
  onNext?: () => void;
  children?: ReactNode;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      initial={reduce ? false : { scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-2xl border-2 border-[#F47C20] bg-[#FFF6EE] p-4 text-center"
    >
      <p className="text-3xl" aria-hidden="true">{stars >= 3 ? "🏆" : stars === 2 ? "🎉" : "✅"}</p>
      <p className="mt-1 text-lg font-black text-[var(--ink)]">{title ?? t(`${UI}.complete`)}</p>
      <div className="mt-1 flex justify-center">
        <Stars n={stars} size={26} />
      </div>
      {body && <div className="mx-auto mt-2 max-w-xl text-sm text-[var(--ink2)]">{body}</div>}
      {children}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={onRetry} className={BTN_SECONDARY}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t(`${UI}.retry`)}
        </button>
        {onNext && (
          <button type="button" onClick={onNext} className={BTN_PRIMARY}>
            {t(`${UI}.next`)} →
          </button>
        )}
      </div>
    </motion.div>
  );
}

export const BTN_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#F47C20] px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:cursor-not-allowed disabled:opacity-50";
export const CHIP =
  "inline-flex min-h-[36px] items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] motion-reduce:transition-none";

/** A small "pre-written example" disclaimer. */
export function Illustrative() {
  const t = useT();
  return <p className="text-[11px] italic text-[var(--ink3)]">{t(`${UI}.illustrative`)}</p>;
}

/** Next challenge id after `id`, or null when it is the last. */
export function nextChallenge(challenges: StudioChallengeMeta[], id: string | null): string | null {
  if (!id) return null;
  const i = challenges.findIndex((c) => c.id === id);
  return i >= 0 && i < challenges.length - 1 ? challenges[i + 1].id : null;
}

/** A labelled AI reply bubble. */
export function ReplyBubble({ label, children, tone = "neutral" }: { label: string; children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  const ring = tone === "good" ? "border-green-300 bg-green-50" : tone === "bad" ? "border-red-200 bg-red-50" : "border-[var(--border)] bg-white";
  return (
    <div className={`rounded-2xl border-2 p-3 ${ring}`}>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">
        <span aria-hidden="true">🤖</span> {label}
      </p>
      <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink)]">{children}</div>
    </div>
  );
}
