"use client";

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bot, Heart, Play, RotateCcw, Share2, SkipForward, SlidersHorizontal } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { useStudioLayout, type StudioGuide } from "../../StudioFrame";
import { useStudioDraft } from "../../useStudioDraft";
import { Measure } from "../automation/kit";
import { useMediaQuery } from "../automation/ui";
import {
  BUBBLE_START,
  BUBBLE_TOPICS,
  DEFAULT_WEIGHTS,
  POST_BY_ID,
  TOPICS,
  TOPIC_BG,
  TOPIC_EMOJI,
  WEIGHT_COLOR,
  WEIGHT_KEYS,
  diversity,
  diversityHistory,
  isSeenList,
  isWeights,
  nextPost,
  signals,
  topTopic,
  topicParts,
  total,
  type Parts,
  type Seen,
  type Topic,
  type Weights,
} from "./feed-data";
import { MissionBoard, Meter, Quiz, SANDBOX, WhyBox, Y, YouthBar, YouthLocked, keys, loadLS, missionStars, saveLS, useChallengeFlow, type Mission, type T } from "./kit";

// Feed Simulator: a pretend video app. The learner scrolls, likes, shares,
// skips or watches; the algorithm picks the next post from those signals
// with weights the learner can tune. A diversity meter shows how varied the
// last 10 posts were, so a filter bubble becomes visible, and breakable.

const TOOL = "feed-simulator";
const NS = `studio.${TOOL}`;
const IDS = ["your-feed", "filter-bubble", "break-the-bubble"];
const ICONS: Record<string, string> = { "your-feed": "❤️", "filter-bubble": "🫧", "break-the-bubble": "🔨" };
const stateKey = (mode: string) => `tib.studio.feed-simulator.state.${mode}`;

interface FeedState {
  v: 1;
  /** Posts seen, oldest first. */
  h: Seen[];
  /** The post on screen now. */
  cur: string;
  w: Weights;
  /** Answer picked in this challenge's question. */
  q: string | null;
  /** Posts that were already in the history when the challenge began. */
  s: number;
}

function fresh(mode: string): FeedState {
  const h = mode === "break-the-bubble" ? BUBBLE_START.slice() : [];
  return { v: 1, h, cur: nextPost(h, DEFAULT_WEIGHTS).post.id, w: { ...DEFAULT_WEIGHTS }, q: null, s: h.length };
}

function isFeedState(v: unknown): v is FeedState {
  const s = v as FeedState;
  return !!s && typeof s === "object" && s.v === 1 && isSeenList(s.h) && POST_BY_ID.has(s.cur) && isWeights(s.w) && typeof s.s === "number" && (s.q === null || typeof s.q === "string");
}

type Act = "like" | "unlike" | "share" | "unshare" | "skip" | "watch" | "auto" | "weights" | "reset";

const QUIZ: Record<string, { options: string[]; correct: string }> = {
  "your-feed": { options: ["signals", "person", "random"], correct: "signals" },
  "filter-bubble": { options: ["bubble", "filter", "storage"], correct: "bubble" },
};

export default function FeedSimulator({ challengeId, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const reduce = !!useReducedMotion();
  const layout = useStudioLayout();
  const wideScreen = useMediaQuery("(min-width: 1024px)");
  const sideBySide = layout !== "embedded" && wideScreen;
  const flow = useChallengeFlow({ tool: TOOL, ids: IDS, challengeId, progress, onComplete });
  const mode = flow.mode;

  const [states, setStates] = useState<Record<string, FeedState>>({});
  useEffect(() => {
    if (mode in states) return;
    const stored = loadLS<unknown>(stateKey(mode), null);
    setStates((m) => ({ ...m, [mode]: isFeedState(stored) ? stored : fresh(mode) }));
  }, [mode, states]);
  useStudioDraft<FeedState>(
    TOOL,
    mode,
    states[mode],
    (v) => {
      setStates((m) => ({ ...m, [mode]: v }));
      saveLS(stateKey(mode), v);
    },
    { validate: isFeedState, legacyKey: stateKey(mode) },
  );
  const st = states[mode] ?? null;

  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const [last, setLast] = useState<{ act: Act; topic?: Topic } | null>(null);
  const [claimed, setClaimed] = useState<{ stars: number; improved: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const update = (fn: (s: FeedState) => FeedState) => {
    setStates((all) => {
      const cur = all[mode];
      if (!cur) return all;
      const next = fn(cur);
      saveLS(stateKey(mode), next);
      return { ...all, [mode]: next };
    });
  };

  const switchMode = (m: string) => {
    flow.setMode(m);
    setLiked(false);
    setShared(false);
    setLast(null);
    setClaimed(null);
    setConfirmReset(false);
  };

  const post = st ? POST_BY_ID.get(st.cur)! : null;

  const advance = (w: number) => {
    if (!st || !post) return;
    const seen: Seen = { id: post.id, w, ...(liked ? { l: 1 as const } : {}), ...(shared ? { s: 1 as const } : {}) };
    update((s) => {
      const h = [...s.h, seen].slice(-300);
      return { ...s, h, cur: nextPost(h, s.w).post.id };
    });
    setLast({ act: w >= 1 ? "watch" : "skip", topic: post.topic });
    setLiked(false);
    setShared(false);
    setClaimed(null);
  };

  /** Five posts scrolled "like you": your favourite topic watched and liked, the rest skipped. */
  const autopilot = () => {
    if (!st) return;
    update((s) => {
      let h = s.h.slice();
      let cur = s.cur;
      for (let i = 0; i < 5; i++) {
        const p = POST_BY_ID.get(cur)!;
        const fav = topTopic(h);
        const seen: Seen = fav && p.topic === fav ? { id: p.id, w: 1, l: 1, a: 1 } : fav ? { id: p.id, w: 0.1, a: 1 } : { id: p.id, w: 0.6, a: 1 };
        h = [...h, seen].slice(-300);
        cur = nextPost(h, s.w).post.id;
      }
      return { ...s, h, cur };
    });
    setLast({ act: "auto" });
    setLiked(false);
    setShared(false);
    setClaimed(null);
  };

  const setWeight = (key: keyof Weights, v: number) => {
    update((s) => {
      const w = { ...s.w, [key]: v };
      return { ...s, w };
    });
    setLast({ act: "weights" });
    setClaimed(null);
  };

  const resetFeed = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    const f = fresh(mode);
    setStates((all) => ({ ...all, [mode]: f }));
    saveLS(stateKey(mode), f);
    setLast({ act: "reset" });
    setClaimed(null);
    setLiked(false);
    setShared(false);
  };

  // ── Measures ─────────────────────────────────────────────────────────────
  const h = st?.h ?? [];
  const div = diversity(h);
  const divHist = useMemo(() => diversityHistory(h).slice(-30), [h]);
  const sig = useMemo(() => signals(h), [h]);
  const w = st?.w ?? DEFAULT_WEIGHTS;
  const ranking = useMemo(
    () =>
      TOPICS.map((tp) => ({ tp, parts: topicParts(tp, sig, w) }))
        .map((x) => ({ ...x, score: total(x.parts) }))
        .sort((a, b) => b.score - a.score),
    [sig, w],
  );
  const curParts: Parts | null = post ? topicParts(post.topic, sig, w) : null;
  const since = h.slice(st?.s ?? 0);

  const missions: Mission[] = useMemo(() => {
    if (!st) return [];
    if (mode === "your-feed") {
      // The topic liked 3 times first, and how many of the next 5 posts were about it.
      const count: Partial<Record<Topic, number>> = {};
      let mark = -1;
      let fav: Topic | null = null;
      since.forEach((x, i) => {
        if (mark >= 0 || !x.l) return;
        const tp = POST_BY_ID.get(x.id)!.topic;
        count[tp] = (count[tp] ?? 0) + 1;
        if (count[tp] === 3) {
          mark = i;
          fav = tp;
        }
      });
      const after = mark >= 0 ? since.slice(mark + 1, mark + 6) : [];
      const hits = after.filter((x) => POST_BY_ID.get(x.id)!.topic === fav).length;
      return [
        { id: "like3", label: k("m.your-feed.1"), done: mark >= 0 },
        { id: "reshape", label: k("m.your-feed.2", { n: hits }), done: hits >= 3 },
        { id: "quiz", label: k("m.your-feed.3"), done: st.q === QUIZ["your-feed"].correct },
      ];
    }
    if (mode === "filter-bubble") {
      const enough = h.length >= 10;
      const low = Math.min(1, ...diversityHistory(h).slice(9));
      return [
        { id: "drop", label: k("m.filter-bubble.1"), done: enough && low < 0.4 },
        { id: "deep", label: k("m.filter-bubble.2"), done: enough && low <= 0.2 },
        { id: "quiz", label: k("m.filter-bubble.3"), done: st.q === QUIZ["filter-bubble"].correct },
      ];
    }
    if (mode === "break-the-bubble") {
      const tuned = st.w.explore > DEFAULT_WEIGHTS.explore || st.w.similar < DEFAULT_WEIGHTS.similar;
      const newTopics = new Set(
        since
          .filter((x) => !x.a && (x.l || x.s || x.w >= 1))
          .map((x) => POST_BY_ID.get(x.id)!.topic)
          .filter((tp) => !BUBBLE_TOPICS.includes(tp)),
      );
      return [
        { id: "tune", label: k("m.break-the-bubble.1"), done: tuned },
        { id: "target", label: k("m.break-the-bubble.2"), done: since.length >= 5 && div >= 0.6 },
        { id: "choices", label: k("m.break-the-bubble.3", { n: Math.min(3, newTopics.size) }), done: newTopics.size >= 3 },
      ];
    }
    return [];
  }, [st, mode, since, h, k, div]);

  const claim = () => {
    const stars = missionStars(missions);
    if (!stars || !flow.isChallenge) return;
    const improved = flow.claim(mode, stars);
    setClaimed({ stars, improved });
  };

  // ── Toolbar and guide ────────────────────────────────────────────────────
  const toolbar = <YouthBar t={t} ns={NS} ids={IDS} icons={ICONS} flow={flow} onPick={switchMode} />;
  const guide: StudioGuide = flow.isChallenge
    ? {
        goal: k(`ch.${mode}.goal`),
        steps: keys(t, `${NS}.ch.${mode}.s`),
        stars: [k(`m.${mode}.1`, { n: 0 }), k(`m.${mode}.2`, { n: 0 }), k(`m.${mode}.3`, { n: 0 })],
        tips: keys(t, `${NS}.guide.tip`),
      }
    : { goal: k("sandboxGoal"), steps: keys(t, `${NS}.sandbox.s`), tips: keys(t, `${NS}.guide.tip`) };

  const topicName = (tp: Topic) => k(`topic.${tp}`);

  // ── Live panel ───────────────────────────────────────────────────────────
  const live = (
    <div className="space-y-4 text-sm" data-testid="feed-live">
      <div>
        <Meter
          label={k("diversity")}
          value={div}
          color={div < 0.4 ? "#D9480F" : div < 0.6 ? "#D99A00" : "#0F7B45"}
          text={`${Math.round(div * 100)}% · ${k(div < 0.4 ? "divLow" : div < 0.6 ? "divMid" : "divHigh")}`}
          testId="feed-diversity"
        />
        <p className="mt-1 text-xs text-[var(--ink3)]">{k("diversityHelp", { n: Math.min(10, h.length) })}</p>
        <Spark values={divHist} label={k("diversityChart")} target={mode === "break-the-bubble" ? 0.6 : mode === "filter-bubble" ? 0.4 : null} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("scoresTitle")}</p>
        <p className="mt-0.5 text-xs text-[var(--ink3)]">{k("scoresHelp")}</p>
        <ul className="mt-2 space-y-2" data-testid="feed-scores">
          {ranking.slice(0, 6).map(({ tp, parts, score }) => (
            <li key={tp}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--ink)]">
                  <span aria-hidden="true">{TOPIC_EMOJI[tp]}</span> {topicName(tp)}
                </span>
                <span className="tabular-nums font-bold text-[var(--ink2)]">{score.toFixed(1)}</span>
              </div>
              <ScoreBar parts={parts} max={Math.max(10, ranking[0].score)} label={WEIGHT_KEYS.map((wk) => `${k(`w.${wk}`)} ${Math.max(0, parts[wk]).toFixed(1)}`).join(", ")} />
            </li>
          ))}
        </ul>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--ink2)]" aria-hidden="true">
          {WEIGHT_KEYS.map((wk) => (
            <li key={wk} className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WEIGHT_COLOR[wk] }} /> {k(`w.${wk}`)}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("historyTitle", { n: h.length })}</p>
        <ol className="mt-1 flex flex-wrap gap-1" aria-label={k("historyTitle", { n: h.length })}>
          {h.slice(-20).map((x, i) => {
            const p = POST_BY_ID.get(x.id)!;
            return (
              <li key={i} className="rounded-md bg-[var(--s2)] px-1.5 py-0.5 text-xs" title={topicName(p.topic)}>
                <span aria-hidden="true">{TOPIC_EMOJI[p.topic]}</span>
                <span className="sr-only">{topicName(p.topic)}</span>
                {x.l ? <span aria-label={k("liked")}>❤</span> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );

  const framed = (body: ReactNode) => (
    <StudioFrame toolbar={toolbar} guide={guide} live={live} liveTitle={k("liveTitle")}>
      {body}
    </StudioFrame>
  );

  if (flow.lockedBy) return framed(<YouthLocked t={t} ns={NS} flow={flow} onGo={switchMode} />);
  if (!st || !post) return framed(<div className="h-48 animate-pulse rounded-xl bg-[var(--s2)]" />);

  const topPart = curParts ? WEIGHT_KEYS.reduce((a, b) => (curParts[b] > curParts[a] ? b : a), WEIGHT_KEYS[0]) : "explore";
  const seenTimes = h.filter((x) => x.id === post.id).length;

  const whyText = (() => {
    if (!last) return k(`why.start.${mode === "break-the-bubble" ? "bubble" : "fresh"}`);
    if (last.act === "watch" || last.act === "skip") {
      const base = k(`why.${last.act}`, { topic: last.topic ? topicName(last.topic) : "" });
      const extra = h.length && h[h.length - 1].l ? ` ${k("why.liked", { topic: last.topic ? topicName(last.topic) : "" })}` : "";
      const share = h.length && h[h.length - 1].s ? ` ${k("why.shared")}` : "";
      return base + extra + share;
    }
    return k(`why.${last.act}`, { topic: last.topic ? topicName(last.topic) : "" });
  })();

  const card = (
    <motion.article
      key={`${post.id}-${h.length}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border-4 border-[#0D1B2A] bg-[#0D1B2A] shadow-lg"
      data-testid="feed-post"
      data-post={post.id}
      data-topic={post.topic}
      aria-label={k("postLabel", { topic: topicName(post.topic), creator: post.creator })}
    >
      <div className={`relative flex aspect-[4/3] max-h-[260px] w-full flex-col items-center justify-center bg-gradient-to-br ${TOPIC_BG[post.topic]} p-4 text-center`}>
        <span className="text-5xl sm:text-6xl" aria-hidden="true">
          {post.emoji}
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-bold text-white">
          <span aria-hidden="true">{TOPIC_EMOJI[post.topic]}</span> {topicName(post.topic)}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-1 text-xs font-bold text-white tabular-nums">0:{String(post.secs).padStart(2, "0")}</span>
      </div>
      <div className="space-y-1 bg-[#0D1B2A] p-3 text-white">
        <p className="text-base font-bold leading-snug">
          {k(`post.${post.id}`)}
          {seenTimes > 0 && <span className="ml-1 text-xs font-semibold text-white/70">· {k("partN", { n: seenTimes + 1 })}</span>}
        </p>
        <p className="text-xs text-white/70">{post.creator}</p>
        <p className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/90" data-testid="feed-because">
          🤖 {k(`because.${topPart}`, { topic: topicName(post.topic) })}
        </p>
      </div>
    </motion.article>
  );

  const actions = (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={liked}
          onClick={() => {
            setLiked((x) => !x);
            setLast({ act: liked ? "unlike" : "like", topic: post.topic });
          }}
          className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-2 px-3 text-sm font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
            liked ? "border-[#E34948] bg-[#FDECEC] text-[#B91C1C]" : "border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#E34948]"
          }`}
          data-testid="feed-like"
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} aria-hidden="true" /> {liked ? k("likedBtn") : k("like")}
        </button>
        <button
          type="button"
          aria-pressed={shared}
          onClick={() => {
            setShared((x) => !x);
            setLast({ act: shared ? "unshare" : "share", topic: post.topic });
          }}
          className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-2 px-3 text-sm font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
            shared ? "border-[#1baf7a] bg-[#E8F7EF] text-[#0B5A33]" : "border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#1baf7a]"
          }`}
          data-testid="feed-share"
        >
          <Share2 size={18} aria-hidden="true" /> {shared ? k("sharedBtn") : k("share")}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => advance(0.1)}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[var(--s2)] px-3 text-sm font-black text-[var(--ink)] hover:bg-[#E2E8F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
          data-testid="feed-skip"
        >
          <SkipForward size={18} aria-hidden="true" /> {k("skip")}
        </button>
        <button
          type="button"
          onClick={() => advance(1)}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#F47C20] px-3 text-sm font-black text-white hover:bg-[#E05F00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] focus-visible:ring-offset-2"
          data-testid="feed-watch"
        >
          <Play size={18} aria-hidden="true" /> {k("watch")}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={autopilot}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 border-dashed border-[#9AAABC] bg-white px-3 text-xs font-bold text-[var(--ink2)] hover:border-[#2251A3] hover:text-[var(--ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
          data-testid="feed-autopilot"
        >
          <Bot size={15} aria-hidden="true" /> {k("autopilot")}
        </button>
        <button
          type="button"
          onClick={resetFeed}
          onBlur={() => setConfirmReset(false)}
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] ${
            confirmReset ? "border-red-300 bg-red-50 text-red-700" : "border-[#D2DCE8] bg-white text-[var(--ink2)] hover:bg-[var(--s2)]"
          }`}
          data-testid="feed-reset"
        >
          <RotateCcw size={13} aria-hidden="true" /> {confirmReset ? k("resetSure") : k("reset")}
        </button>
      </div>
    </div>
  );

  const algorithm = <AlgorithmPanel t={t} k={k} w={st.w} onChange={setWeight} onDefaults={() => update((s) => ({ ...s, w: { ...DEFAULT_WEIGHTS } }))} />;

  const quiz = QUIZ[mode] ? (
    <Quiz
      t={t}
      question={k(`quiz.${mode}.q`)}
      options={QUIZ[mode].options.map((id) => ({ id, label: k(`quiz.${mode}.${id}`) }))}
      correct={QUIZ[mode].correct}
      answer={st.q}
      onAnswer={(id) => {
        update((s) => ({ ...s, q: id }));
        setClaimed(null);
      }}
      explain={k(`quiz.${mode}.explain`)}
      wrongHint={k(`quiz.${mode}.hint`)}
      testId="feed-quiz"
    />
  ) : null;

  const nextId = flow.isChallenge ? flow.nextOf(mode) : null;
  const board = flow.isChallenge ? (
    <MissionBoard
      t={t}
      missions={missions}
      onClaim={claim}
      claimed={claimed}
      insight={k(`ch.${mode}.insight`)}
      nextLabel={nextId && claimed && !flow.unlocks.lockedBy(nextId) ? t(`${Y}.goTo`, { name: k(`ch.${nextId}.title`) }) : null}
      onNext={() => nextId && switchMode(nextId)}
    />
  ) : null;

  return framed(
    <Measure className="h-full">
      {(width) => (
        <div className="space-y-3" data-testid="feed-workspace">
          <div className="rounded-2xl bg-[var(--s2)] p-3">
            <h2 className="text-base font-black text-[var(--ink)]">
              <span aria-hidden="true">{flow.isChallenge ? ICONS[mode] : "🧪"}</span> {flow.isChallenge ? k(`ch.${mode}.title`) : t("studio.sandbox")}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--ink2)]">{k(flow.isChallenge ? `ch.${mode}.story` : "sandboxGoal")}</p>
          </div>
          <div className={width >= 640 ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3" : "space-y-3"}>
            <div className="mx-auto w-full max-w-[380px] space-y-3">
              {card}
              {actions}
            </div>
            <div className="space-y-3">
              {!sideBySide && (
                <div className="rounded-2xl border border-[#D2DCE8] bg-white p-3">
                  <Meter
                    label={k("diversity")}
                    value={div}
                    color={div < 0.4 ? "#D9480F" : div < 0.6 ? "#D99A00" : "#0F7B45"}
                    text={`${Math.round(div * 100)}% · ${k(div < 0.4 ? "divLow" : div < 0.6 ? "divMid" : "divHigh")}`}
                    testId="feed-diversity-inline"
                  />
                  <p className="mt-1 text-xs text-[var(--ink3)]">{k("diversityHelp", { n: Math.min(10, h.length) })}</p>
                </div>
              )}
              <WhyBox t={t} testId="feed-why">
                {whyText}
              </WhyBox>
              {algorithm}
            </div>
          </div>
          {quiz}
          {board}
        </div>
      )}
    </Measure>,
  );
}

function AlgorithmPanel({
  t,
  k,
  w,
  onChange,
  onDefaults,
}: {
  t: T;
  k: (s: string, v?: Record<string, string | number>) => string;
  w: Weights;
  onChange: (key: keyof Weights, v: number) => void;
  onDefaults: () => void;
}) {
  const id = useId();
  return (
    <section className="rounded-2xl border-2 border-[#0D1B2A] bg-white p-3" aria-label={k("algoTitle")} data-testid="feed-algorithm">
      <h3 className="flex items-center gap-1.5 text-sm font-black text-[var(--ink)]">
        <SlidersHorizontal size={16} aria-hidden="true" /> {k("algoTitle")}
      </h3>
      <p className="mt-0.5 text-xs text-[var(--ink2)]">{k("algoHelp")}</p>
      <div className="mt-2 space-y-2.5">
        {WEIGHT_KEYS.map((wk) => (
          <div key={wk}>
            <label htmlFor={`${id}-${wk}`} className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-[var(--ink)]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: WEIGHT_COLOR[wk] }} aria-hidden="true" />
                {k(`w.${wk}`)}
              </span>
              <span className="tabular-nums font-bold text-[var(--ink2)]">{w[wk]}/10</span>
            </label>
            <input
              id={`${id}-${wk}`}
              type="range"
              min={0}
              max={10}
              step={1}
              value={w[wk]}
              onChange={(e) => onChange(wk, Number(e.target.value))}
              className="mt-1 w-full accent-[#F47C20]"
              aria-describedby={`${id}-${wk}-help`}
              data-testid={`feed-weight-${wk}`}
            />
            <p id={`${id}-${wk}-help`} className="text-[11px] text-[var(--ink3)]">
              {k(`wHelp.${wk}`)}
            </p>
          </div>
        ))}
      </div>
      <button type="button" onClick={onDefaults} className="mt-2 text-xs font-semibold text-[var(--blue2)] underline">
        {t(`${Y}.defaults`)}
      </button>
    </section>
  );
}

function ScoreBar({ parts, max, label }: { parts: Parts; max: number; label: string }) {
  return (
    <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-[#E8EFF8]" role="img" aria-label={label}>
      {WEIGHT_KEYS.map((wk) => {
        const v = Math.max(0, parts[wk]);
        return v > 0 ? <div key={wk} style={{ width: `${(v / max) * 100}%`, background: WEIGHT_COLOR[wk] }} /> : null;
      })}
    </div>
  );
}

/** Tiny line chart of diversity after each post, with an optional target line. */
function Spark({ values, label, target }: { values: number[]; label: string; target: number | null }) {
  const W = 260;
  const H = 60;
  if (values.length < 2) return null;
  const x = (i: number) => (i / (values.length - 1)) * (W - 4) + 2;
  const y = (v: number) => H - 4 - v * (H - 8);
  const lastV = values[values.length - 1];
  return (
    <figure className="m-0 mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${label}: ${values.map((v) => Math.round(v * 100)).join(", ")}%`}>
        <rect x="0" y="0" width={W} height={H} fill="#F4F7FB" rx="6" />
        {target !== null && <line x1="2" x2={W - 2} y1={y(target)} y2={y(target)} stroke="#7A8FA6" strokeDasharray="4 4" />}
        <polyline points={values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke="#2a78d6" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={x(values.length - 1)} cy={y(lastV)} r="3.5" fill="#2a78d6" />
      </svg>
      <figcaption className="mt-0.5 text-[11px] text-[var(--ink3)]">{label}</figcaption>
    </figure>
  );
}
