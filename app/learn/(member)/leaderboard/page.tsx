import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudent } from "@/lib/learn/session";
import { weeklyLeaderboard, type BoardRow } from "@/lib/learn/leaderboard";
import { fmtDate, fmtNumber } from "@/lib/learn/format";
import { getLocale, getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("game.board.metaTitle") };
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login");

  const [t, locale, board] = await Promise.all([
    getT(),
    getLocale(),
    weeklyLeaderboard(student.id).catch((err) => {
      console.error("[leaderboard]", err);
      return null;
    }),
  ]);

  const Row = ({ r }: { r: BoardRow }) => (
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
      <span className="shrink-0 text-sm font-black text-[var(--ink)]">{t("game.xp", { n: fmtNumber(r.xp, locale) })}</span>
    </li>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black text-[var(--ink)]">
        <span aria-hidden="true">🏆 </span>
        {t("game.board.title")}
      </h1>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("game.board.intro")}</p>

      {!board ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 text-sm text-[var(--ink2)]">
          {t("game.board.unavailable")}
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-[var(--ink3)]">
            {t("game.board.since", { date: fmtDate(board.since, locale, true) })}
          </p>

          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("game.board.yourWeek")}</p>
            <p className="mt-1 text-2xl font-black text-[var(--ink)]">{t("game.xp", { n: fmtNumber(board.myXp, locale) })}</p>
            {board.optedIn ? (
              <p className="mt-1 text-sm text-[var(--ink2)]">
                {board.myRank
                  ? t("game.board.yourRank", { n: board.myRank, total: board.players })
                  : t("game.board.notYet")}
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-[var(--ink2)]">{t("game.board.optInPrompt")}</p>
                <Link
                  href="/learn/account"
                  className="mt-3 inline-block rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-bold text-white"
                >
                  {t("game.board.optInCta")} →
                </Link>
              </div>
            )}
          </div>

          {board.top.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--ink2)]">
              {t("game.board.empty")}
            </p>
          ) : (
            <ol className="mt-6 space-y-2" aria-label={t("game.board.title")}>
              {board.top.map((r, i) => (
                <Row key={i} r={r} />
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
          )}

          <p className="mt-6 text-xs leading-relaxed text-[var(--ink3)]">{t("game.board.privacy")}</p>
        </>
      )}
    </div>
  );
}
