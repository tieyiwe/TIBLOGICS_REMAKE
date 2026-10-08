"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Camera, CameraOff, Eraser, Plus, Scale, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import type { StudioToolProps } from "@/lib/learn/studio/types";
import StudioFrame, { type StudioGuide } from "../../StudioFrame";
import { useStudioDraft } from "../../useStudioDraft";
import { Measure } from "../automation/kit";
import {
  CANVAS,
  N,
  SHAPES,
  cameraGrid,
  classify,
  clearCanvas,
  decode,
  drawStroke,
  drawingGrid,
  encode,
  isGridString,
  shapeStroke,
  synthGrid,
  type Example,
  type Grid,
  type Prediction,
  type Shape,
  type Stroke,
} from "./ml";
import { MissionBoard, Meter, Quiz, SANDBOX, WhyBox, Y, YouthBar, YouthLocked, keys, loadLS, missionStars, rng, saveLS, useChallengeFlow, type Mission, type T } from "./kit";

// Teach the Machine: train a tiny image classifier. The learner draws
// doodles (or, in Free play, shows the camera) for 2 or 3 labels; each
// becomes a 16x16 grid of grey levels, and k-nearest neighbours classifies
// new drawings with live confidence bars. Camera frames stay on this screen:
// they are never saved or sent anywhere.

const TOOL = "teach-the-machine";
const NS = `studio.${TOOL}`;
const IDS = ["two-classes", "trick-it", "fair-data"];
const ICONS: Record<string, string> = { "two-classes": "⚪", "trick-it": "🎭", "fair-data": "⚖️" };
const SHAPE_ICON: Record<Shape, string> = { circle: "◯", square: "▢", triangle: "△" };
const LABEL_COLOR = ["#2a78d6", "#eb6834", "#1baf7a"];
const LABELS: Record<string, number> = { "two-classes": 2, "trick-it": 2, "fair-data": 3, [SANDBOX]: 3 };
const MAX_EXAMPLES = 90;
const stateKey = (mode: string) => `tib.studio.teach-the-machine.state.${mode}`;

interface TMState {
  v: 1;
  ex: Example[];
  /** Free play label names ("" = default). */
  names: string[];
  /** Trick-it: drawings that fooled the machine, with what they really were. */
  tricks: { g: string; l: number }[];
  /** Two-classes test round: asked label and predicted label. */
  tests: { l: number; p: number }[];
  q: string | null;
  /** Fair-data: accuracy per label on the hidden test set, first run and last run (with the data counts then). */
  fair: { before: number[] | null; last: number[] | null; counts: number[] | null };
}

let seq = 0;
const uid = () => `e${Date.now().toString(36)}${(++seq).toString(36)}`;

function seedExamples(counts: number[], variety: "narrow" | "wide", seed: number): Example[] {
  const r = rng(seed);
  const out: Example[] = [];
  counts.forEach((n, l) => {
    for (let i = 0; i < n; i++) out.push({ id: `s${l}-${i}`, l, g: synthGrid(SHAPES[l], r, { variety }) });
  });
  return out;
}

function fresh(mode: string): TMState {
  const ex = mode === "trick-it" ? seedExamples([6, 6], "narrow", 11) : mode === "fair-data" ? seedExamples([8, 8, 1], "wide", 24) : [];
  return { v: 1, ex, names: ["", "", ""], tricks: [], tests: [], q: null, fair: { before: null, last: null, counts: null } };
}

const numArr = (a: unknown) => a === null || (Array.isArray(a) && a.length <= 3 && a.every((x) => typeof x === "number"));

function isTMState(v: unknown): v is TMState {
  const s = v as TMState;
  return (
    !!s &&
    typeof s === "object" &&
    s.v === 1 &&
    Array.isArray(s.ex) &&
    s.ex.length <= MAX_EXAMPLES + 10 &&
    s.ex.every((e) => !!e && typeof e.id === "string" && typeof e.l === "number" && e.l >= 0 && e.l < 3 && isGridString(e.g)) &&
    Array.isArray(s.names) &&
    s.names.every((n) => typeof n === "string" && n.length <= 24) &&
    Array.isArray(s.tricks) &&
    s.tricks.every((x) => isGridString(x.g) && typeof x.l === "number") &&
    Array.isArray(s.tests) &&
    (s.q === null || typeof s.q === "string") &&
    !!s.fair &&
    numArr(s.fair.before) &&
    numArr(s.fair.last) &&
    numArr(s.fair.counts)
  );
}

/** What is saved: camera examples never leave this screen. */
const persistable = (s: TMState): TMState => (s.ex.some((e) => e.cam) ? { ...s, ex: s.ex.filter((e) => !e.cam) } : s);

const balanced = (counts: number[]) => {
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  return min >= 6 && max > 0 && min / max >= 0.7;
};

type Last =
  | { a: "add"; l: number }
  | { a: "auto"; l: number }
  | { a: "clear" | "camOn" | "camBlocked" | "capture" | "remove" | "friends" | "fairRun" | "fooled" | "notFooled" | "testRight" | "testWrong" | "needMore" | "reset" | "addTrick" }
  | null;

export default function TeachTheMachine({ challengeId, onComplete, progress }: StudioToolProps) {
  const t = useT() as T;
  const k = useCallback((s: string, v?: Record<string, string | number>) => t(`${NS}.${s}`, v), [t]);
  const flow = useChallengeFlow({ tool: TOOL, ids: IDS, challengeId, progress, onComplete });
  const mode = flow.mode;
  const nLabels = LABELS[mode] ?? 3;

  const [states, setStates] = useState<Record<string, TMState>>({});
  useEffect(() => {
    if (mode in states) return;
    const stored = loadLS<unknown>(stateKey(mode), null);
    setStates((m) => ({ ...m, [mode]: isTMState(stored) ? stored : fresh(mode) }));
  }, [mode, states]);
  const st = states[mode] ?? null;
  const saved = useMemo(() => (st ? persistable(st) : undefined), [st]);
  useStudioDraft<TMState>(
    TOOL,
    mode,
    saved,
    (v) => {
      setStates((m) => ({ ...m, [mode]: v }));
      saveLS(stateKey(mode), v);
    },
    { validate: isTMState, legacyKey: stateKey(mode) },
  );

  const update = useCallback(
    (fn: (s: TMState) => TMState) => {
      setStates((all) => {
        const cur = all[mode];
        if (!cur) return all;
        const next = fn(cur);
        saveLS(stateKey(mode), persistable(next));
        return { ...all, [mode]: next };
      });
    },
    [mode],
  );

  // ── Drawing surface ──────────────────────────────────────────────────────
  const [cv, setCv] = useState<HTMLCanvasElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const live = useRef<Stroke | null>(null);
  const [cur, setCur] = useState<Grid | null>(null);
  const [camShot, setCamShot] = useState(false);
  const ctxOf = useCallback((c: HTMLCanvasElement | null) => c?.getContext("2d", { willReadFrequently: true }) ?? null, []);

  const paint = useCallback(() => {
    const ctx = ctxOf(cv);
    if (!ctx) return;
    clearCanvas(ctx);
    if (camShot && cur) {
      // A camera snapshot: show what the machine sees, in grey squares.
      const cell = CANVAS / N;
      for (let i = 0; i < N * N; i++) {
        const v = Math.round(255 * (1 - cur[i]));
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect((i % N) * cell, Math.floor(i / N) * cell, cell, cell);
      }
      return;
    }
    for (const s of strokes.current) drawStroke(ctx, s);
  }, [cv, ctxOf, camShot, cur]);
  useEffect(() => {
    paint();
    // Repaint only when the canvas element itself changes (tabs remount it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv]);

  const recompute = () => {
    const ctx = ctxOf(cv);
    setCur(ctx ? drawingGrid(ctx) : null);
  };

  const clearDrawing = useCallback(() => {
    strokes.current = [];
    live.current = null;
    setCamShot(false);
    setCur(null);
    const ctx = ctxOf(cv);
    if (ctx) clearCanvas(ctx);
  }, [ctxOf, cv]);

  const toCanvas = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * CANVAS), Math.round(((e.clientY - r.top) / r.height) * CANVAS)] as const;
  };
  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (camShot) clearDrawing();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const [x, y] = toCanvas(e);
    live.current = { p: [x, y], w: 14 };
    const ctx = ctxOf(cv);
    if (ctx) drawStroke(ctx, live.current);
  };
  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const s = live.current;
    if (!s) return;
    const [x, y] = toCanvas(e);
    const lx = s.p[s.p.length - 2];
    const ly = s.p[s.p.length - 1];
    if (Math.hypot(x - lx, y - ly) < 2) return;
    s.p.push(x, y);
    const ctx = ctxOf(cv);
    if (ctx) drawStroke(ctx, { p: [lx, ly, x, y], w: s.w });
  };
  const onUp = () => {
    if (!live.current) return;
    strokes.current = [...strokes.current, live.current];
    live.current = null;
    recompute();
  };

  const [autoSeed, setAutoSeed] = useState(1);
  const drawForMe = (l: number) => {
    clearDrawing();
    const r = rng(Date.now() % 100000 + autoSeed);
    setAutoSeed((s) => s + 7);
    const s = shapeStroke(SHAPES[l], r, { variety: "wide" });
    strokes.current = [s];
    const ctx = ctxOf(cv);
    if (ctx) {
      drawStroke(ctx, s);
      setCur(drawingGrid(ctx));
    }
    setLast({ a: "auto", l });
  };

  // ── Camera (Free play only) ──────────────────────────────────────────────
  const [cam, setCam] = useState<"off" | "starting" | "on" | "blocked">("off");
  const stream = useRef<MediaStream | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const scratch = useRef<HTMLCanvasElement | null>(null);
  const [camPred, setCamPred] = useState<Prediction | null>(null);
  const stopCam = useCallback(() => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setCam("off");
    setCamPred(null);
  }, []);
  useEffect(() => () => stream.current?.getTracks().forEach((tr) => tr.stop()), []);
  useEffect(() => {
    if (mode !== SANDBOX) stopCam();
  }, [mode, stopCam]);
  const startCam = async () => {
    setCam("starting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera");
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" }, audio: false });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => {});
      }
      setCam("on");
      setLast({ a: "camOn" });
    } catch {
      setCam("blocked");
      setLast({ a: "camBlocked" });
    }
  };
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    video.current = el;
    if (el && stream.current && el.srcObject !== stream.current) {
      el.srcObject = stream.current;
      el.play().catch(() => {});
    }
  }, []);
  /** The current camera frame as a grid (grey, square crop, mirrored like the preview). */
  const frameGrid = useCallback((): Grid | null => {
    const v = video.current;
    if (!v || !v.videoWidth) return null;
    if (!scratch.current) {
      scratch.current = document.createElement("canvas");
      scratch.current.width = CANVAS;
      scratch.current.height = CANVAS;
    }
    const ctx = scratch.current.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const side = Math.min(v.videoWidth, v.videoHeight);
    ctx.save();
    ctx.translate(CANVAS, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, CANVAS, CANVAS);
    ctx.restore();
    return cameraGrid(ctx);
  }, []);

  // ── Data and predictions ────────────────────────────────────────────────
  const ex = useMemo(() => st?.ex ?? [], [st]);
  const counts = useMemo(() => Array.from({ length: nLabels }, (_, l) => ex.filter((e) => e.l === l).length), [ex, nLabels]);
  const pred = useMemo(() => (cur ? classify(ex, cur, nLabels) : null), [cur, ex, nLabels]);
  const shown = cam === "on" && !camShot ? camPred : pred;

  // Live camera classification, a few times a second.
  useEffect(() => {
    if (cam !== "on") return;
    const h = window.setInterval(() => {
      const g = frameGrid();
      setCamPred(g ? classify(ex, g, nLabels) : null);
    }, 400);
    return () => window.clearInterval(h);
  }, [cam, ex, nLabels, frameGrid]);

  const capture = () => {
    const g = frameGrid();
    if (!g) return;
    strokes.current = [];
    setCamShot(true);
    setCur(g);
    setLast({ a: "capture" });
  };
  // Paint the captured frame once state has it.
  useEffect(() => {
    if (camShot) paint();
  }, [camShot, cur, paint]);

  const labelName = (l: number) => (mode === SANDBOX && st?.names[l]?.trim() ? st.names[l].trim() : k(`shape.${SHAPES[l]}`));
  const labelIcon = (l: number) => SHAPE_ICON[SHAPES[l]];

  const [last, setLast] = useState<Last>(null);
  const [claimed, setClaimed] = useState<{ stars: number; improved: boolean } | null>(null);
  const [truth, setTruth] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const addExample = (l: number) => {
    if (!cur || !st) return;
    if (ex.length >= MAX_EXAMPLES) return;
    const e: Example = { id: uid(), l, g: encode(cur), ...(camShot ? { cam: 1 as const } : {}) };
    update((s) => ({ ...s, ex: [...s.ex, e] }));
    setLast({ a: "add", l });
    setClaimed(null);
    clearDrawing();
  };
  const removeExample = (id: string) => {
    update((s) => ({ ...s, ex: s.ex.filter((e) => e.id !== id) }));
    setLast({ a: "remove" });
    setClaimed(null);
  };

  // Two-classes: a test round of 4 drawings, alternating circle and square.
  const testTarget = (st?.tests.length ?? 0) % 2;
  const runTest = () => {
    if (!st || !pred || st.tests.length >= 4) return;
    if (counts[0] < 3 || counts[1] < 3) {
      setLast({ a: "needMore" });
      return;
    }
    update((s) => ({ ...s, tests: [...s.tests, { l: testTarget, p: pred.label }] }));
    setLast({ a: pred.label === testTarget ? "testRight" : "testWrong" });
    setClaimed(null);
    clearDrawing();
  };

  // Trick-it: try to fool the machine.
  const tryTrick = () => {
    if (!st || !pred || !cur) return;
    if (pred.label !== truth) {
      const g = encode(cur);
      update((s) => ({ ...s, tricks: s.tricks.some((x) => x.g === g) ? s.tricks : [...s.tricks, { g, l: truth }].slice(-8) }));
      setLast({ a: "fooled" });
      clearDrawing();
    } else {
      setLast({ a: "notFooled" });
    }
    setClaimed(null);
  };
  const trickStatus = useMemo(() => (st ? st.tricks.map((x) => classify(ex, decode(x.g), nLabels)?.label === x.l) : []), [st, ex, nLabels]);

  // Fair-data: a hidden test set the machine never trains on.
  const testSet = useMemo(() => {
    if (mode !== "fair-data" || typeof document === "undefined") return [];
    const r = rng(99);
    const out: { l: number; g: Grid }[] = [];
    for (let l = 0; l < 3; l++) for (let i = 0; i < 4; i++) out.push({ l, g: decode(synthGrid(SHAPES[l], r, { variety: "wide" })) });
    return out;
  }, [mode]);
  const runFair = () => {
    if (!st || !testSet.length) return;
    const acc = [0, 1, 2].map((l) => {
      const set = testSet.filter((x) => x.l === l);
      return set.filter((x) => classify(ex, x.g, 3)?.label === l).length / set.length;
    });
    update((s) => ({ ...s, fair: { before: s.fair.before ?? acc, last: acc, counts: counts.slice() } }));
    setLast({ a: "fairRun" });
    setClaimed(null);
  };
  const [friendSeed, setFriendSeed] = useState(500);
  const askFriends = (l: number) => {
    const r = rng(friendSeed + l * 31 + Date.now() % 1000);
    setFriendSeed((x) => x + 13);
    const add: Example[] = [0, 1, 2].map(() => ({ id: uid(), l, g: synthGrid(SHAPES[l], r, { variety: "wide" }) }));
    update((s) => ({ ...s, ex: [...s.ex, ...add].slice(-MAX_EXAMPLES) }));
    setLast({ a: "friends" });
    setClaimed(null);
  };

  const switchMode = (m: string) => {
    flow.setMode(m);
    clearDrawing();
    setLast(null);
    setClaimed(null);
    setTruth(0);
    setConfirmReset(false);
  };
  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    const f = fresh(mode);
    setStates((all) => ({ ...all, [mode]: f }));
    saveLS(stateKey(mode), f);
    clearDrawing();
    setLast({ a: "reset" });
    setClaimed(null);
  };

  // ── Missions ─────────────────────────────────────────────────────────────
  const missions: Mission[] = useMemo(() => {
    if (!st) return [];
    if (mode === "two-classes") {
      const right = st.tests.filter((x) => x.l === x.p).length;
      const roundDone = st.tests.length >= 4;
      return [
        { id: "teach", label: k("m.two-classes.1"), done: counts[0] >= 3 && counts[1] >= 3 },
        { id: "test", label: k("m.two-classes.2"), done: roundDone && right >= 3 },
        { id: "perfect", label: k("m.two-classes.3"), done: roundDone && right === 4 },
      ];
    }
    if (mode === "trick-it") {
      return [
        { id: "fool", label: k("m.trick-it.1", { n: Math.min(2, st.tricks.length) }), done: st.tricks.length >= 2 },
        { id: "why", label: k("m.trick-it.2"), done: st.q === "variety" },
        { id: "fix", label: k("m.trick-it.3"), done: st.tricks.length >= 2 && trickStatus.every(Boolean) },
      ];
    }
    if (mode === "fair-data") {
      const f = st.fair;
      return [
        { id: "spot", label: k("m.fair-data.1"), done: !!f.before },
        { id: "balance", label: k("m.fair-data.2"), done: balanced(counts) },
        { id: "fair", label: k("m.fair-data.3"), done: !!f.last && !!f.counts && balanced(f.counts) && f.last.every((a) => a >= 0.75) },
      ];
    }
    return [];
  }, [st, mode, counts, k, trickStatus]);

  const claim = () => {
    const stars = missionStars(missions);
    if (!stars || !flow.isChallenge) return;
    const improved = flow.claim(mode, stars);
    setClaimed({ stars, improved });
  };

  // ── Frame ────────────────────────────────────────────────────────────────
  const toolbar = <YouthBar t={t} ns={NS} ids={IDS} icons={ICONS} flow={flow} onPick={switchMode} />;
  const guide: StudioGuide = flow.isChallenge
    ? {
        goal: k(`ch.${mode}.goal`),
        steps: keys(t, `${NS}.ch.${mode}.s`),
        stars: [k(`m.${mode}.1`, { n: 0 }), k(`m.${mode}.2`), k(`m.${mode}.3`)],
        tips: keys(t, `${NS}.ch.${mode}.tip`),
      }
    : { goal: k("sandboxGoal"), steps: keys(t, `${NS}.sandbox.s`), tips: keys(t, `${NS}.sandbox.tip`) };

  const confidence = (p: Prediction | null, testId: string) => (
    <div className="space-y-2" data-testid={testId}>
      {Array.from({ length: nLabels }, (_, l) => (
        <Meter
          key={l}
          label={`${labelIcon(l)} ${labelName(l)}`}
          value={p ? p.conf[l] : 0}
          color={LABEL_COLOR[l]}
          text={p ? `${Math.round(p.conf[l] * 100)}%${p.label === l ? ` · ${k("pick")}` : ""}` : "–"}
        />
      ))}
    </div>
  );

  const liveGrid = cam === "on" && !camShot ? null : cur;
  const livePanel = (
    <div className="space-y-4 text-sm" data-testid="tm-live">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("sees")}</p>
        <div className="mt-2 flex items-start gap-3">
          <GridThumb g={liveGrid} size={112} label={k("seesLabel")} testId="tm-grid" />
          <p className="text-xs text-[var(--ink2)]">{k("seesHelp")}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("confidence")}</p>
        <div className="mt-2">{confidence(shown, "tm-confidence-live")}</div>
        {!shown && <p className="mt-1 text-xs text-[var(--ink3)]">{ex.length ? k("drawToSee") : k("noData")}</p>}
      </div>
      {shown && shown.near.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("neighbours", { k: shown.k })}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {shown.near.map((n) => (
              <li key={n.ex.id} className="text-center text-[10px] font-semibold text-[var(--ink2)]">
                <GridThumb g={decode(n.ex.g)} size={44} label={labelName(n.ex.l)} ring={LABEL_COLOR[n.ex.l]} />
                <span className="mt-0.5 block">
                  {labelIcon(n.ex.l)} {labelName(n.ex.l)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-[var(--ink3)]">{k("neighboursHelp")}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("dataTitle", { n: ex.length })}</p>
        <div className="mt-2 space-y-2">
          {counts.map((c, l) => (
            <Meter key={l} label={`${labelIcon(l)} ${labelName(l)}`} value={c} max={Math.max(...counts, 1)} color={LABEL_COLOR[l]} text={k("examplesN", { n: c })} />
          ))}
        </div>
      </div>
    </div>
  );

  const framed = (body: ReactNode) => (
    <StudioFrame toolbar={toolbar} guide={guide} live={livePanel} liveTitle={k("liveTitle")}>
      {body}
    </StudioFrame>
  );
  if (flow.lockedBy) return framed(<YouthLocked t={t} ns={NS} flow={flow} onGo={switchMode} />);
  if (!st) return framed(<div className="h-48 animate-pulse rounded-xl bg-[var(--s2)]" />);

  const whyText = (() => {
    if (!last) return k(`why.start.${mode === SANDBOX ? "sandbox" : mode}`);
    if (last.a === "add") return k("why.add", { label: labelName(last.l), n: counts[last.l] ?? 0 });
    if (last.a === "auto") return k("why.auto", { label: labelName(last.l) });
    return k(`why.${last.a}`);
  })();

  const btn =
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20] disabled:cursor-not-allowed disabled:opacity-50";

  const drawPad = (
    <section className="space-y-2" aria-label={k("padLabel")}>
      <div className="relative mx-auto w-full max-w-[300px]">
        <canvas
          ref={setCv}
          width={CANVAS}
          height={CANVAS}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="block aspect-square w-full cursor-crosshair rounded-2xl border-2 border-dashed border-[#9AAABC] bg-white"
          style={{ touchAction: "none" }}
          role="img"
          aria-label={cur ? k("canvasHas") : k("canvasEmpty")}
          data-testid="tm-canvas"
        />
        {!cur && !camShot && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold text-[var(--ink3)]">
            ✏️ {k("drawHere")}
          </span>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => { clearDrawing(); setLast({ a: "clear" }); }} className={`${btn} border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#F47C20]`} data-testid="tm-clear">
          <Eraser size={16} aria-hidden="true" /> {k("clear")}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label={k("drawForMe")}>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink2)]">
          <Wand2 size={14} aria-hidden="true" /> {k("drawForMe")}
        </span>
        {Array.from({ length: nLabels }, (_, l) => (
          <button
            key={l}
            type="button"
            onClick={() => drawForMe(l)}
            className="min-h-[40px] whitespace-nowrap rounded-lg border border-[#D2DCE8] bg-white px-2.5 text-xs font-bold text-[var(--ink)] hover:border-[#F47C20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
            data-testid={`tm-auto-${SHAPES[l]}`}
          >
            {SHAPE_ICON[SHAPES[l]]} {k(`shape.${SHAPES[l]}`)}
          </button>
        ))}
      </div>
      {/* The machine's guess, right under the drawing (phones see the Live panel in a tab). */}
      <p className="rounded-xl bg-[#0D1B2A] px-3 py-2 text-center text-sm font-bold text-white" aria-live={cam === "on" && !camShot ? "off" : "polite"} data-testid="tm-guess">
        {shown ? (
          <>
            🤖 {k("guess", { label: `${labelIcon(shown.label)} ${labelName(shown.label)}`, pct: Math.round(shown.conf[shown.label] * 100) })}
          </>
        ) : ex.length ? (
          k("guessWaiting")
        ) : (
          k("noData")
        )}
      </p>
    </section>
  );

  const cameraBox =
    mode === SANDBOX ? (
      <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3" aria-label={k("cam.title")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-[var(--ink)]">📷 {k("cam.title")}</p>
          {cam === "on" ? (
            <button type="button" onClick={stopCam} className={`${btn} border-[#D2DCE8] bg-white text-[var(--ink)]`} data-testid="tm-camera-off">
              <CameraOff size={16} aria-hidden="true" /> {k("cam.stop")}
            </button>
          ) : (
            <button type="button" onClick={startCam} disabled={cam === "starting"} className={`${btn} border-[#2251A3] bg-[#EBF0FA] text-[#1B3A6B]`} data-testid="tm-camera">
              <Camera size={16} aria-hidden="true" /> {k("cam.start")}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--ink2)]">{k("cam.privacy")}</p>
        {cam === "blocked" && <p className="mt-1 rounded-lg bg-[#FFF1EA] px-2 py-1 text-xs text-[#8A2E07]">{k("cam.blocked")}</p>}
        <div className={cam === "on" ? "mt-2 flex flex-wrap items-center gap-3" : "hidden"}>
          <video ref={videoRef} muted playsInline className="h-28 w-28 rounded-xl bg-black object-cover" style={{ transform: "scaleX(-1)" }} aria-label={k("cam.preview")} />
          <button type="button" onClick={capture} className={`${btn} border-[#F47C20] bg-[#FEF0E3] text-[var(--ink)]`} data-testid="tm-capture">
            📸 {k("cam.capture")}
          </button>
        </div>
      </section>
    ) : null;

  const addRow = (
    <section className="rounded-2xl border border-[#D2DCE8] bg-white p-3" aria-label={k("teach")} data-testid="tm-train">
      <p className="text-sm font-bold text-[var(--ink)]">🧑‍🏫 {k("teach")}</p>
      <p className="text-xs text-[var(--ink2)]">{k("teachHelp")}</p>
      <div className={`mt-2 grid gap-2 ${nLabels === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {Array.from({ length: nLabels }, (_, l) => (
          <button
            key={l}
            type="button"
            disabled={!cur || ex.length >= MAX_EXAMPLES}
            onClick={() => addExample(l)}
            className={`${btn} flex-col border-[#D2DCE8] bg-white text-[var(--ink)] hover:border-[#F47C20]`}
            style={{ borderBottomColor: LABEL_COLOR[l], borderBottomWidth: 4 }}
            data-testid={`tm-add-${l}`}
          >
            <span className="inline-flex items-center gap-1">
              <Plus size={14} aria-hidden="true" /> {labelIcon(l)} {labelName(l)}
            </span>
            <span className="text-[11px] font-semibold text-[var(--ink3)]">{k("examplesN", { n: counts[l] })}</span>
          </button>
        ))}
      </div>
      {mode === SANDBOX && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer font-semibold text-[var(--ink2)]">{k("rename")}</summary>
          <div className="mt-1 grid gap-1.5 sm:grid-cols-3">
            {[0, 1, 2].map((l) => (
              <label key={l} className="font-bold text-[var(--ink2)]">
                {k("labelN", { n: l + 1 })}
                <input
                  value={st.names[l] ?? ""}
                  maxLength={20}
                  placeholder={k(`shape.${SHAPES[l]}`)}
                  onChange={(e) => update((s) => ({ ...s, names: s.names.map((n, i) => (i === l ? e.target.value.slice(0, 20) : n)) }))}
                  className="mt-0.5 block w-full rounded-lg border border-[#D2DCE8] px-2 py-1.5 text-sm font-normal text-[var(--ink)]"
                />
              </label>
            ))}
          </div>
        </details>
      )}
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer font-semibold text-[var(--ink2)]">{k("gallery", { n: ex.length })}</summary>
        <div className="mt-2 space-y-2">
          {Array.from({ length: nLabels }, (_, l) => (
            <div key={l}>
              <p className="font-bold text-[var(--ink2)]">
                {labelIcon(l)} {labelName(l)}
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {ex
                  .filter((e) => e.l === l)
                  .slice(-16)
                  .map((e) => (
                    <li key={e.id} className="relative">
                      <GridThumb g={decode(e.g)} size={40} label={labelName(l)} ring={LABEL_COLOR[l]} />
                      <button
                        type="button"
                        onClick={() => removeExample(e.id)}
                        aria-label={k("remove", { label: labelName(l) })}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--ink2)] shadow ring-1 ring-[#D2DCE8] hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47C20]"
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );

  // Challenge panels.
  let panel: ReactNode = null;
  if (mode === "two-classes") {
    const right = st.tests.filter((x) => x.l === x.p).length;
    panel = (
      <section className="rounded-2xl border-2 border-[#2251A3] bg-[#F5F8FE] p-3" aria-label={k("test.title")} data-testid="tm-test">
        <p className="text-sm font-black text-[var(--ink)]">🧪 {k("test.title")}</p>
        {st.tests.length < 4 ? (
          <>
            <p className="mt-1 text-sm text-[var(--ink2)]" data-testid="tm-test-prompt">
              {k("test.prompt", { n: st.tests.length + 1, label: `${labelIcon(testTarget)} ${labelName(testTarget)}` })}
            </p>
            <button
              type="button"
              onClick={runTest}
              disabled={!pred}
              className={`${btn} mt-2 border-[#2251A3] bg-[#2251A3] text-white hover:bg-[#1B3A6B]`}
              data-testid="tm-test-run"
            >
              <Sparkles size={16} aria-hidden="true" /> {k("test.run")}
            </button>
            {(counts[0] < 3 || counts[1] < 3) && <p className="mt-1 text-xs text-[var(--ink3)]">{k("test.needMore")}</p>}
          </>
        ) : (
          <p className="mt-1 text-sm font-bold text-[var(--ink)]" data-testid="tm-test-score">
            {k("test.score", { n: right })}
          </p>
        )}
        {st.tests.length > 0 && (
          <ol className="mt-2 flex flex-wrap gap-1.5" aria-label={k("test.results")}>
            {st.tests.map((x, i) => (
              <li key={i} className={`rounded-lg px-2 py-1 text-xs font-bold ${x.l === x.p ? "bg-[#E8F7EF] text-[#0B5A33]" : "bg-[#FFF1EA] text-[#8A2E07]"}`}>
                {i + 1}. {labelIcon(x.l)} → {labelIcon(x.p)} {x.l === x.p ? `✓ ${k("test.right")}` : `✗ ${k("test.wrong")}`}
              </li>
            ))}
          </ol>
        )}
        {st.tests.length > 0 && (
          <button type="button" onClick={() => { update((s) => ({ ...s, tests: [] })); setClaimed(null); }} className="mt-2 text-xs font-semibold text-[var(--blue2)] underline" data-testid="tm-test-reset">
            {k("test.again")}
          </button>
        )}
      </section>
    );
  } else if (mode === "trick-it") {
    panel = (
      <section className="space-y-3">
        <div className="rounded-2xl border-2 border-[#6D28D9] bg-[#F7F3FF] p-3" data-testid="tm-trick">
          <p className="text-sm font-black text-[var(--ink)]">🎭 {k("trick.title")}</p>
          <p className="mt-1 text-xs text-[var(--ink2)]">{k("trick.help")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={k("trick.what")}>
            <span className="text-xs font-bold text-[var(--ink2)]">{k("trick.what")}</span>
            {[0, 1].map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={truth === l}
                onClick={() => setTruth(l)}
                className={`${btn} ${truth === l ? "border-[#6D28D9] bg-white text-[#4C1D95]" : "border-[#D2DCE8] bg-white text-[var(--ink2)]"}`}
                data-testid={`tm-truth-${l}`}
              >
                {labelIcon(l)} {labelName(l)}
              </button>
            ))}
          </div>
          <button type="button" onClick={tryTrick} disabled={!pred} className={`${btn} mt-2 border-[#6D28D9] bg-[#6D28D9] text-white hover:bg-[#4C1D95]`} data-testid="tm-trick-run">
            🎭 {k("trick.run")}
          </button>
        </div>
        <div className="rounded-2xl border border-[#D2DCE8] bg-white p-3" data-testid="tm-tricks">
          <p className="text-sm font-bold text-[var(--ink)]">{k("trick.list", { n: st.tricks.length })}</p>
          {st.tricks.length === 0 ? (
            <p className="mt-1 text-xs text-[var(--ink3)]">{k("trick.none")}</p>
          ) : (
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {st.tricks.map((x, i) => (
                <li key={i} className="rounded-xl border border-[#D2DCE8] p-2 text-center text-[11px]" data-ok={trickStatus[i] ? "true" : "false"}>
                  <GridThumb g={decode(x.g)} size={52} label={labelName(x.l)} ring={LABEL_COLOR[x.l]} />
                  <p className="mt-1 font-semibold text-[var(--ink2)]">
                    {k("trick.really", { label: `${labelIcon(x.l)} ${labelName(x.l)}` })}
                  </p>
                  <p className={`font-bold ${trickStatus[i] ? "text-[#0B5A33]" : "text-[#8A2E07]"}`}>{trickStatus[i] ? `✓ ${k("trick.fixed")}` : `✗ ${k("trick.stillFooled")}`}</p>
                  <button
                    type="button"
                    onClick={() => {
                      update((s) => ({ ...s, ex: [...s.ex, { id: uid(), l: x.l, g: x.g }].slice(-MAX_EXAMPLES) }));
                      setLast({ a: "addTrick" });
                      setClaimed(null);
                    }}
                    className="mt-1 text-[11px] font-semibold text-[var(--blue2)] underline"
                  >
                    {k("trick.addIt")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Quiz
          t={t}
          question={k("quiz.q")}
          options={["broken", "variety", "tired"].map((id) => ({ id, label: k(`quiz.${id}`) }))}
          correct="variety"
          answer={st.q}
          onAnswer={(id) => {
            update((s) => ({ ...s, q: id }));
            setClaimed(null);
          }}
          explain={k("quiz.explain")}
          wrongHint={k("quiz.hint")}
          testId="tm-quiz"
        />
      </section>
    );
  } else if (mode === "fair-data") {
    const f = st.fair;
    panel = (
      <section className="space-y-3">
        <div className="rounded-2xl border-2 border-[#0F7B45] bg-[#F2FBF6] p-3" data-testid="tm-fair">
          <p className="text-sm font-black text-[var(--ink)]">⚖️ {k("fair.title")}</p>
          <p className="mt-1 text-xs text-[var(--ink2)]">{k("fair.help")}</p>
          <button type="button" onClick={runFair} className={`${btn} mt-2 border-[#0F7B45] bg-[#0F7B45] text-white hover:bg-[#0B5A33]`} data-testid="tm-fair-run">
            <Scale size={16} aria-hidden="true" /> {k("fair.run")}
          </button>
          {f.last && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {f.before && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("fair.before")}</p>
                  <div className="mt-1 space-y-1.5">
                    {f.before.map((a, l) => (
                      <Meter key={l} label={`${labelIcon(l)} ${labelName(l)}`} value={a} color={LABEL_COLOR[l]} text={k("fair.right", { n: Math.round(a * 4) })} />
                    ))}
                  </div>
                </div>
              )}
              <div data-testid="tm-fair-last">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{k("fair.now")}</p>
                <div className="mt-1 space-y-1.5">
                  {f.last.map((a, l) => (
                    <Meter key={l} label={`${labelIcon(l)} ${labelName(l)}`} value={a} color={LABEL_COLOR[l]} text={k("fair.right", { n: Math.round(a * 4) })} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-[#D2DCE8] bg-white p-3" data-testid="tm-balance">
          <p className="text-sm font-bold text-[var(--ink)]">📊 {k("fair.balance")}</p>
          <p className="mt-0.5 text-xs text-[var(--ink2)]">{balanced(counts) ? `✓ ${k("fair.balanced")}` : k("fair.unbalanced")}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((l) => (
              <button key={l} type="button" onClick={() => askFriends(l)} className={`${btn} border-[#D2DCE8] bg-white text-xs text-[var(--ink)] hover:border-[#0F7B45]`} data-testid={`tm-friends-${l}`}>
                👫 {k("fair.friends", { label: `${labelIcon(l)} ${labelName(l)}` })}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
        <div className="space-y-3" data-testid="tm-workspace">
          <div className="flex flex-wrap items-start justify-between gap-2 rounded-2xl bg-[var(--s2)] p-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-[var(--ink)]">
                <span aria-hidden="true">{flow.isChallenge ? ICONS[mode] : "🧪"}</span> {flow.isChallenge ? k(`ch.${mode}.title`) : t("studio.sandbox")}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--ink2)]">{k(flow.isChallenge ? `ch.${mode}.story` : "sandboxGoal")}</p>
            </div>
            <button
              type="button"
              onClick={resetAll}
              onBlur={() => setConfirmReset(false)}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold ${confirmReset ? "border-red-300 bg-red-50 text-red-700" : "border-[#D2DCE8] bg-white text-[var(--ink2)]"}`}
              data-testid="tm-reset"
            >
              <Trash2 size={13} aria-hidden="true" /> {confirmReset ? k("resetSure") : k("reset")}
            </button>
          </div>
          <div className={width >= 640 ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3" : "space-y-3"}>
            <div className="space-y-3">
              {drawPad}
              {cameraBox}
            </div>
            <div className="space-y-3">
              {addRow}
              <WhyBox t={t} testId="tm-why">
                {whyText}
              </WhyBox>
            </div>
          </div>
          {panel}
          {board}
        </div>
      )}
    </Measure>,
  );
}

/** A 16x16 grid drawn as grey squares (dark = ink). */
function GridThumb({ g, size, label, ring, testId }: { g: Grid | null; size: number; label: string; ring?: string; testId?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = g ? Math.round(255 * (1 - g[i])) : 255;
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [g]);
  return (
    <canvas
      ref={ref}
      width={N}
      height={N}
      role="img"
      aria-label={label}
      data-testid={testId}
      className="block rounded-md border border-[#D2DCE8]"
      style={{ width: size, height: size, imageRendering: "pixelated", boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
    />
  );
}
