"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { GAME_EVENT, type GameEventDetail } from "@/lib/learn/game-client";
import { LOOP_EVENT, readLoop, type LoopEventDetail, type LoopStep } from "@/lib/learn/method/loop-client";

// The Learning Loop strip under a lesson's header: Understand, Try, Play,
// Apply, Reflect, each ticked when done. Server facts (lesson completed, lab
// passed, Studio challenge done, reflection saved) come in as props; reading
// to the end and running the practice pad are remembered in this browser.

export interface LearningLoopProps {
  lessonId: string;
  understand: boolean;
  play: { done: boolean } | null;
  apply: { done: boolean; href: string; title: string } | null;
  reflect: boolean;
  accentColor: string;
}

export default function LearningLoop({ lessonId, understand, play, apply, reflect, accentColor }: LearningLoopProps) {
  const t = useT();
  const [local, setLocal] = useState<Partial<Record<LoopStep, boolean>>>({});
  const [whyOpen, setWhyOpen] = useState(false);
  const whyId = useId();
  const whyBtn = useRef<HTMLButtonElement>(null);
  const whyBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocal(readLoop(lessonId));
    const onLoop = (e: Event) => {
      const d = (e as CustomEvent<LoopEventDetail>).detail;
      if (d?.lessonId === lessonId) setLocal((cur) => ({ ...cur, [d.step]: d.done }));
    };
    // A Studio challenge completed in an embed on this page.
    const onGame = (e: Event) => {
      const d = (e as CustomEvent<GameEventDetail>).detail;
      if (d?.reason === "studio") setLocal((cur) => ({ ...cur, play: true }));
    };
    window.addEventListener(LOOP_EVENT, onLoop);
    window.addEventListener(GAME_EVENT, onGame);
    return () => {
      window.removeEventListener(LOOP_EVENT, onLoop);
      window.removeEventListener(GAME_EVENT, onGame);
    };
  }, [lessonId]);

  // Close the explainer on Escape or a click outside it.
  useEffect(() => {
    if (!whyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setWhyOpen(false);
        whyBtn.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!whyBox.current?.contains(n) && !whyBtn.current?.contains(n)) setWhyOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [whyOpen]);

  const steps: Array<{ id: LoopStep; done: boolean; href?: string }> = [
    { id: "understand", done: understand || !!local.understand },
    { id: "try", done: !!local.try, href: "#pad-heading" },
    ...(play ? [{ id: "play" as const, done: play.done || !!local.play }] : []),
    ...(apply ? [{ id: "apply" as const, done: apply.done, href: apply.href }] : []),
    { id: "reflect", done: local.reflect ?? reflect, href: "#reflect" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section
      aria-label={t("method.loop.label")}
      className="relative mt-4 rounded-2xl border border-[var(--border)] bg-white px-3 py-3 sm:px-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
          {t("method.loop.title")}{" "}
          <span className="ml-1 font-semibold normal-case tracking-normal text-[var(--ink2)]">
            · {t("method.loop.progress", { done: doneCount, total: steps.length })}
          </span>
        </p>
        <button
          ref={whyBtn}
          type="button"
          onClick={() => setWhyOpen((v) => !v)}
          aria-expanded={whyOpen}
          aria-controls={whyId}
          className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-[var(--border)] px-3 text-xs font-semibold text-[var(--blue2)] hover:border-[var(--ink3)]"
        >
          <span aria-hidden="true">ⓘ</span> {t("method.loop.why")}
        </button>
      </div>

      <ol className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const name = t(`method.loop.step.${s.id}`);
          const label = s.done
            ? t("method.loop.stepDone", { step: name })
            : t("method.loop.stepTodo", { step: name, hint: t(`method.loop.hint.${s.id}`) });
          const body = (
            <>
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-black transition-colors motion-reduce:transition-none"
                style={
                  s.done
                    ? { background: "#22A387", borderColor: "#22A387", color: "#fff" }
                    : { borderColor: accentColor, color: accentColor, background: "#fff" }
                }
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className={`mt-1 block truncate text-[11px] font-semibold sm:text-xs ${s.done ? "text-[var(--ink)]" : "text-[var(--ink2)]"}`}>
                {name}
              </span>
            </>
          );
          const cls = "flex min-w-0 flex-col items-center rounded-lg px-0.5 py-1 text-center";
          return (
            <li key={s.id} className="min-w-0" title={label}>
              {s.href && !s.done ? (
                s.href.startsWith("#") ? (
                  <a href={s.href} aria-label={label} className={`${cls} hover:bg-[var(--s2)]`}>
                    {body}
                  </a>
                ) : (
                  <Link href={s.href} aria-label={label} className={`${cls} hover:bg-[var(--s2)]`}>
                    {body}
                  </Link>
                )
              ) : (
                <span className={cls} aria-label={label} role="img">
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {apply && !apply.done && (
        <p className="mt-2 text-center text-xs text-[var(--ink3)]">
          <Link href={apply.href} className="font-semibold text-[var(--blue2)] underline">
            {t("method.loop.openLab")}: {apply.title}
          </Link>
        </p>
      )}

      {whyOpen && (
        <div
          ref={whyBox}
          id={whyId}
          role="region"
          aria-label={t("method.loop.why")}
          className="absolute left-2 right-2 top-12 z-20 rounded-xl border border-[var(--border)] bg-white p-4 text-sm leading-relaxed text-[var(--ink2)] shadow-lg sm:left-auto sm:w-96"
        >
          <p className="font-semibold text-[var(--ink)]">{t("method.loop.why.intro")}</p>
          <ul className="mt-2 space-y-1.5">
            {(["understand", "try", "play", "apply", "reflect", "remember"] as const).map((k) => (
              <li key={k}>{t(`method.loop.why.${k}`)}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setWhyOpen(false);
              whyBtn.current?.focus();
            }}
            className="mt-3 rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-semibold text-[var(--ink2)]"
          >
            {t("method.loop.whyClose")}
          </button>
        </div>
      )}
    </section>
  );
}
