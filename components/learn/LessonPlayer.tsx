"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LessonVideo from "./LessonVideo";
import LessonMedia from "./video/LessonMedia";
import type { LessonVideoData } from "@/lib/learn/video/shared";
import MicroCheck from "./MicroCheck";
import PracticePanel from "./PracticePanel";
import PracticePad from "./PracticePad";
import Markdown from "./Markdown";
import { fmtMinutes } from "@/lib/learn/format";
import { useT } from "@/lib/i18n/client";
import { celebrate } from "@/lib/learn/game-client";
import { queueCompletion } from "@/lib/learn/pwa/client";
import LessonListen from "@/components/a11y/LessonListen";

interface LessonView {
  id: string;
  title: string;
  bodyMd: string;
  /** The English body, when bodyMd is a translation (finds the task section). */
  sourceMd?: string;
  videoUrl: string | null;
  /** The video with chapters, captions and the learner's place (lib/learn/video/store.ts). */
  video?: LessonVideoData | null;
  contentType: string;
  durationMinutes: number;
  objective: string | null;
  hasPractice: boolean;
}

interface ResourceView {
  id: string;
  title: string;
  url: string;
  resourceType: string;
  isFree: boolean;
  isRequired: boolean;
  notes: string | null;
}

interface OutlineModule {
  id: string;
  title: string;
  quizId: string | null;
  lessons: Array<{ id: string; title: string; durationMinutes: number; done: boolean }>;
}

export default function LessonPlayer({
  lesson,
  resources,
  microCheck,
  modules,
  currentModuleId,
  moduleQuizId,
  moduleComplete,
  alreadyComplete,
  prevId,
  nextId,
  trackSlug,
  accentColor,
  loop,
  footer,
}: {
  lesson: LessonView;
  resources: ResourceView[];
  microCheck: { id: string; passScore: number; questionsServed: number } | null;
  modules: OutlineModule[];
  currentModuleId: string;
  moduleQuizId: string | null;
  moduleComplete: boolean;
  alreadyComplete: boolean;
  prevId: string | null;
  nextId: string | null;
  trackSlug: string;
  accentColor: string;
  /** The Learning Loop strip, shown under the header. */
  loop?: React.ReactNode;
  /** Shown at the end of the lesson, after the quick check (the reflection). */
  footer?: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const [done, setDone] = useState(alreadyComplete);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [outlineOpen, setOutlineOpen] = useState(false);

  async function complete() {
    if (saving) return;
    setSaving(true);
    try {
      // Offline (a downloaded lesson): keep it on this device and send it
      // when the connection returns (lib/learn/pwa/client.ts). The server
      // stays the authority; the call is idempotent.
      const res = await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      }).catch(() => null);
      if (!res) {
        const queued = await queueCompletion(lesson.id);
        if (queued) setDone(true);
        setToast(t(queued ? "pwa.lesson.queued" : "pwa.lesson.queueFailed"));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        if (data.pointsAwarded > 0) setToast(t("learn.lesson.pointsToast", { n: data.pointsAwarded }));
        celebrate({ points: data.pointsAwarded, reason: "lesson", newBadges: data.newBadges, levelUp: data.levelUp });
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-focus-grid className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
      {/* ── Main column ─────────────────────────────────────────────────── */}
      <article id="lesson-article" className="min-w-0">
        <header>
          <h1 data-narrate className="text-2xl font-black leading-tight text-[var(--ink)]">{lesson.title}</h1>
          <p className="mt-2 text-sm text-[var(--ink3)]">
            {fmtMinutes(t, lesson.durationMinutes)}
            {done && (
              <span className="ml-3 font-semibold text-green-700" role="status">
                ✓ {t("learn.lesson.completed")}
              </span>
            )}
          </p>
          {lesson.objective && (
            <p
              data-narrate
              className="mt-4 rounded-xl border-l-4 bg-white p-4 text-sm leading-relaxed text-[var(--ink2)]"
              style={{ borderLeftColor: accentColor }}
            >
              <strong className="text-[var(--ink)]">{t("learn.lesson.objective")} </strong>
              {lesson.objective}
            </p>
          )}
          {/* Read aloud (Web Speech API); hidden where unsupported. */}
          <LessonListen targetId="lesson-article" />
          {loop}
        </header>

        {/* A lesson with a video gets the Video / Read switch (components/learn/video). */}
        {lesson.video ? (
          <LessonMedia lessonId={lesson.id} title={lesson.title} video={lesson.video} accentColor={accentColor}>
            {lesson.bodyMd && (
              <div data-narrate className="rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
                <Markdown source={lesson.bodyMd} />
              </div>
            )}
          </LessonMedia>
        ) : (
          <>
            {lesson.videoUrl && (
              <div className="mt-6">
                <LessonVideo url={lesson.videoUrl} title={lesson.title} />
              </div>
            )}

            {lesson.bodyMd && (
              <div data-narrate className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6 sm:p-8">
                <Markdown source={lesson.bodyMd} />
              </div>
            )}
          </>
        )}

        {/* Practice It — the tools/resources for this lesson */}
        {resources.length > 0 && (
          <div className="mt-6">
            <PracticePanel resources={resources} accentColor={accentColor} />
          </div>
        )}

        {/* Built-in AI practice pad: every lesson is hands-on */}
        <div className="mt-6">
          <PracticePad lessonId={lesson.id} bodyMd={lesson.bodyMd} sourceMd={lesson.sourceMd} accentColor={accentColor} />
        </div>

        {/* Quick check */}
        {microCheck && (
          <div className="mt-6">
            <MicroCheck
              microCheckId={microCheck.id}
              passScore={microCheck.passScore}
              accentColor={accentColor}
            />
          </div>
        )}

        {footer && <div className="mt-6">{footer}</div>}

        {/* Complete + navigation */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
          {prevId && (
            <Link
              href={`/learn/lesson/${prevId}`}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
            >
              ← {t("learn.lesson.previous")}
            </Link>
          )}

          {!done && (
            <button
              onClick={complete}
              disabled={saving}
              className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: accentColor }}
            >
              {saving ? t("learn.lesson.saving") : t("learn.lesson.markComplete")}
            </button>
          )}

          {nextId ? (
            <Link
              href={`/learn/lesson/${nextId}`}
              className="rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              {t("learn.lesson.next")} →
            </Link>
          ) : (
            <Link
              href={`/learn/track/${trackSlug}`}
              className="rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-bold text-white"
            >
              {t("learn.lesson.backToTrack")} →
            </Link>
          )}

          {toast && (
            <span role="status" className="text-sm font-bold text-[var(--orange2)]">
              {toast}
            </span>
          )}
        </div>

        {/* Module quiz prompt */}
        {moduleQuizId && moduleComplete && (
          <div className="mt-6 rounded-2xl border-2 border-dashed p-6 text-center" style={{ borderColor: accentColor }}>
            <p className="text-sm font-bold text-[var(--ink)]">
              {t("learn.lesson.moduleFinished")}
            </p>
            <p className="mt-1 text-sm text-[var(--ink2)]">
              {t("learn.lesson.takeQuizToUnlock")}
            </p>
            <Link
              href={`/learn/quiz/${moduleQuizId}`}
              className="mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-bold text-white"
              style={{ background: accentColor }}
            >
              {t("learn.lesson.startQuiz")} →
            </Link>
          </div>
        )}
      </article>

      {/* ── Outline rail ────────────────────────────────────────────────── */}
      <aside data-focus-hide className="mt-8 lg:mt-0">
        <button
          onClick={() => setOutlineOpen((v) => !v)}
          aria-expanded={outlineOpen}
          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink)] lg:hidden"
        >
          {t("learn.lesson.outline")}
          <span aria-hidden="true">{outlineOpen ? "−" : "+"}</span>
        </button>

        <nav
          aria-label={t("learn.lesson.outline")}
          className={`${outlineOpen ? "block" : "hidden"} mt-3 lg:sticky lg:top-20 lg:mt-0 lg:block`}
        >
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-4">
            {modules.map((m, mi) => (
              <div key={m.id} className="mb-4 last:mb-0">
                <p
                  className={`text-xs font-bold uppercase tracking-wide ${
                    m.id === currentModuleId ? "text-[var(--ink)]" : "text-[var(--ink3)]"
                  }`}
                >
                  {mi + 1}. {m.title}
                </p>
                <ul className="mt-2 space-y-1">
                  {m.lessons.map((l) => {
                    const current = l.id === lesson.id;
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/learn/lesson/${l.id}`}
                          aria-current={current ? "page" : undefined}
                          className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs leading-snug transition-colors ${
                            current
                              ? "bg-[var(--s2)] font-bold text-[var(--ink)]"
                              : "text-[var(--ink2)] hover:bg-[var(--s2)]"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="mt-0.5 shrink-0"
                            style={{ color: l.done ? "#22A387" : "var(--ink3)" }}
                          >
                            {l.done ? "✓" : "○"}
                          </span>
                          <span className="min-w-0 flex-1">{l.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {m.quizId && (
                    <li>
                      <Link
                        href={`/learn/quiz/${m.quizId}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--blue2)] hover:bg-[var(--s2)]"
                      >
                        <span aria-hidden="true">📝</span> {t("learn.lesson.moduleQuiz")}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
}
