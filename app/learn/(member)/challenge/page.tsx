import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { isOwnerStudent } from "@/lib/learn/owner";
import { getLocale, getT } from "@/lib/i18n/server";
import { ANSWER_MAX, ANSWER_MIN, CHALLENGE_MAX_POINTS, CRITERION_POINTS } from "@/lib/learn/challenge/content";
import { currentWeek, previousWeek } from "@/lib/learn/challenge/week";
import { MAX_EDITS, getEntry, isOnBoards, weekBoard, type ChallengeBoardRow } from "@/lib/learn/challenge/server";
import ChallengeForm from "@/components/learn/challenge/ChallengeForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("learn.challenge.metaTitle") };
}

const MEDALS = ["🥇", "🥈", "🥉"];

/** A UTC calendar day ("6 October"): weeks run Monday to Sunday UTC. */
const utcDay = (d: Date, locale: string) => d.toLocaleDateString(locale, { timeZone: "UTC", day: "numeric", month: "long" });

// The weekly 10-minute challenge: this week's task (the same for everyone,
// Monday to Sunday UTC), the learner's answer and grade, the week's board
// and last week's winners.
export default async function ChallengePage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const week = currentWeek();
  const last = previousWeek();
  const ch = week.challenge;

  const [entry, board, lastBoard, onBoards, owner] = await Promise.all([
    getEntry(student.id, week.key).catch((err) => {
      console.error("[challenge] entry", err);
      return undefined;
    }),
    weekBoard(week.key, student.id).catch((err) => {
      console.error("[challenge] board", err);
      return null;
    }),
    weekBoard(last.key, null, 3).catch(() => null),
    isOnBoards(student.id),
    isOwnerStudent(student.id),
  ]);
  // The page cannot load entries (database trouble): say so, no form.
  const unavailable = entry === undefined;

  const Row = ({ r }: { r: ChallengeBoardRow }) => (
    <li
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        r.isMe ? "border-2 border-[var(--orange)] bg-[var(--orange-light)]" : "border border-[var(--border)] bg-white"
      }`}
      aria-current={r.isMe ? "true" : undefined}
    >
      <span className="w-9 shrink-0 text-center text-sm font-black text-[var(--ink2)]">
        {r.rank <= 3 ? (
          <>
            <span aria-hidden="true" className="text-xl">{MEDALS[r.rank - 1]}</span>
            <span className="sr-only">{t("game.board.rank", { n: r.rank })}</span>
          </>
        ) : (
          t("game.board.rankShort", { n: r.rank })
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--ink)]">
        {r.name}
        {r.isMe && <span className="ml-2 text-xs font-semibold text-[var(--orange2)]">{t("game.board.you")}</span>}
      </span>
      <span className="shrink-0 text-sm font-black text-[var(--ink)]">
        {t("learn.challenge.scoreOf", { n: r.score, max: CHALLENGE_MAX_POINTS })}
      </span>
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--orange2)]">
          {t("learn.challenge.kicker", { date: utcDay(week.start, locale) })}
        </p>
        <h1 className="mt-1 text-2xl font-black text-[var(--ink)]" data-testid="challenge-title">
          <span aria-hidden="true">⏱️ </span>
          {ch.title[locale]}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink2)]">{t("learn.challenge.intro", { max: CHALLENGE_MAX_POINTS })}</p>
        <p className="mt-1 text-xs text-[var(--ink3)]">
          {t("learn.challenge.closes", { date: utcDay(new Date(week.end.getTime() - 1), locale) })}
        </p>
      </header>

      <section aria-labelledby="ch-task-h" className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 id="ch-task-h" className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
          {t("learn.challenge.taskTitle")}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-[var(--ink)]" data-testid="challenge-task">
          {ch.task[locale]}
        </p>
        {ch.material && (
          <blockquote className="mt-4 rounded-xl border-l-4 border-[var(--orange)] bg-[var(--s2)] p-4 text-sm leading-relaxed text-[var(--ink2)] [overflow-wrap:anywhere]">
            {ch.material[locale]}
          </blockquote>
        )}
        <p className="mt-4 text-xs text-[var(--ink3)]">{t("learn.challenge.howScored", { max: CHALLENGE_MAX_POINTS })}</p>
      </section>

      {unavailable ? (
        <p role="status" className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--ink2)]">
          {t("learn.challenge.unavailable")}
        </p>
      ) : (
        <ChallengeForm
          week={week.key}
          minChars={ANSWER_MIN}
          maxChars={ANSWER_MAX}
          maxPoints={CHALLENGE_MAX_POINTS}
          criterionPoints={CRITERION_POINTS}
          include={ch.include[locale]}
          initial={
            entry ? { score: entry.score, feedback: entry.feedback, breakdown: entry.breakdown, answer: entry.answer } : null
          }
          initialEditsLeft={entry ? (owner ? 1 : Math.max(0, MAX_EDITS - entry.edits)) : MAX_EDITS}
        />
      )}

      <section aria-labelledby="ch-board-h">
        <h2 id="ch-board-h" className="text-lg font-bold text-[var(--ink)]">
          <span aria-hidden="true">🏆 </span>
          {t("learn.challenge.boardTitle")}
        </h2>
        {!onBoards && (
          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-sm text-[var(--ink2)]">{t("learn.challenge.optInPrompt")}</p>
            <Link href="/learn/account" className="mt-3 inline-block rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-bold text-white">
              {t("game.board.optInCta")} →
            </Link>
          </div>
        )}
        {!board ? (
          <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--ink2)]">
            {t("game.board.unavailable")}
          </p>
        ) : board.top.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--ink2)]" data-testid="challenge-board-empty">
            {t("learn.challenge.boardEmpty")}
          </p>
        ) : (
          <>
            {board.myRank && (
              <p className="mt-2 text-sm text-[var(--ink2)]">{t("game.board.yourRank", { n: board.myRank, total: board.players })}</p>
            )}
            <ol className="mt-3 space-y-2" aria-label={t("learn.challenge.boardTitle")} data-testid="challenge-board">
              {board.top.map((r) => (
                <Row key={r.rank} r={r} />
              ))}
              {board.me && (
                <>
                  <li aria-hidden="true" className="text-center text-[var(--ink3)]">
                    ⋯
                  </li>
                  <Row r={board.me} />
                </>
              )}
            </ol>
          </>
        )}
        <p className="mt-3 text-xs leading-relaxed text-[var(--ink3)]">{t("learn.challenge.boardPrivacy")}</p>
      </section>

      <section aria-labelledby="ch-last-h" className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 id="ch-last-h" className="text-base font-bold text-[var(--ink)]">{t("learn.challenge.lastWeek")}</h2>
        <p className="mt-1 text-sm text-[var(--ink2)]">{last.challenge.title[locale]}</p>
        {lastBoard && lastBoard.top.length > 0 ? (
          <ol className="mt-3 space-y-2" data-testid="challenge-winners">
            {lastBoard.top.map((r) => (
              <Row key={r.rank} r={r} />
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-[var(--ink3)]">{t("learn.challenge.noWinners")}</p>
        )}
      </section>
    </div>
  );
}
