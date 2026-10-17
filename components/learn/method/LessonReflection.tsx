"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { celebrate } from "@/lib/learn/game-client";
import { markLoop } from "@/lib/learn/method/loop-client";
import { REFLECTION_MAX_CHARS, REFLECTION_MIN_WORDS, countWords } from "@/lib/learn/method/words";
import { fmtDate } from "@/lib/learn/format";

// The Learning Loop's Reflect step, at the bottom of a lesson. Private to the
// learner. Reaching it also counts as having read the lesson to the end.
export default function LessonReflection({
  lessonId,
  initialText,
  initialUpdatedAt,
  xp,
  accentColor,
}: {
  lessonId: string;
  initialText: string;
  initialUpdatedAt: string | null;
  xp: number;
  accentColor: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [text, setText] = useState(initialText);
  const [saved, setSaved] = useState(initialText);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);
  const box = useRef<HTMLElement>(null);

  // Scrolled to the end of the lesson: the Understand step is done.
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          markLoop(lessonId, "understand");
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lessonId]);

  const words = countWords(text);
  const dirty = text.trim() !== saved.trim();
  const tooLong = text.length > REFLECTION_MAX_CHARS;

  async function save() {
    if (busy || tooLong || !dirty) return;
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/learn/reflection", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, text }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setStatus({ kind: "error", msg: d.error ?? t("method.reflect.error") });
      return;
    }
    setSaved(text.trim());
    setUpdatedAt(d.updatedAt ?? null);
    setStatus({ kind: "ok", msg: d.deleted ? t("method.reflect.deleted") : t("method.reflect.saved") });
    markLoop(lessonId, "reflect", !d.deleted && countWords(text) >= REFLECTION_MIN_WORDS);
    celebrate({ points: d.pointsAwarded, reason: "reflection", newBadges: d.newBadges, levelUp: d.levelUp });
  }

  return (
    <section
      id="reflect"
      ref={box}
      aria-labelledby="reflect-heading"
      className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-white p-6"
    >
      <h2 id="reflect-heading" className="flex items-center gap-2 text-base font-bold text-[var(--ink)]">
        <span aria-hidden="true">✍️</span> {t("method.reflect.title")}
      </h2>
      <label htmlFor={`reflect-${lessonId}`} className="mt-2 block text-sm font-semibold text-[var(--ink)]">
        {t("method.reflect.prompt")}
      </label>
      <p id={`reflect-help-${lessonId}`} className="mt-1 text-xs leading-relaxed text-[var(--ink3)]">
        <span aria-hidden="true">🔒 </span>
        {t("method.reflect.private")}
      </p>
      <textarea
        id={`reflect-${lessonId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={REFLECTION_MAX_CHARS + 200}
        placeholder={t("method.reflect.placeholder")}
        aria-describedby={`reflect-help-${lessonId} reflect-count-${lessonId}`}
        aria-invalid={tooLong || undefined}
        className="mt-3 w-full rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--ink)] focus:border-[var(--ink3)] focus:outline-none"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p id={`reflect-count-${lessonId}`} className={tooLong ? "font-semibold text-red-600" : "text-[var(--ink3)]"}>
          {tooLong
            ? t("method.reflect.tooLong")
            : `${t(words === 1 ? "method.reflect.words.one" : "method.reflect.words.other", { n: words })} · ${t("method.reflect.goal", { xp })}`}
        </p>
        {updatedAt && !dirty && (
          <p className="text-[var(--ink3)]">{t("method.reflect.lastSaved", { date: fmtDate(updatedAt, locale) })}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || tooLong || !dirty}
          className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: accentColor }}
        >
          {busy ? t("method.reflect.saving") : t("method.reflect.save")}
        </button>
        <p role="status" aria-live="polite" className={`text-sm font-semibold ${status?.kind === "error" ? "text-red-600" : "text-green-700"}`}>
          {status?.msg ?? ""}
        </p>
      </div>
    </section>
  );
}
