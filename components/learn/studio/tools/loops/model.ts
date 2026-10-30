// Loop Mapper: causal loop diagram model, loop detection, a tiny simulation
// and the challenge checks. Pure functions, no React.

export type Pol = 1 | -1;
export type LoopKind = "R" | "B";

export interface Variable {
  id: string;
  /** Word-bank key (label comes from the dictionary). */
  key?: string;
  /** Label typed by the learner (custom variables). */
  label?: string;
  x: number;
  y: number;
}

export interface Link {
  id: string;
  from: string;
  to: string;
  pol: Pol;
  delay: boolean;
}

export interface MapState {
  vars: Variable[];
  links: Link[];
  /** Learner's R/B label per loop signature. */
  labels: Record<string, LoopKind>;
  simulated: boolean;
}

export interface Loop {
  sig: string;
  nodes: string[];
  links: Link[];
  negatives: number;
  kind: LoopKind;
  name: string;
  hasDelay: boolean;
}

export const W = 640;
export const H = 440;

/** Every simple cycle, classified and named R1, R2, B1... */
export function findLoops(vars: Variable[], links: Link[]): Loop[] {
  const idx = new Map(vars.map((v, i) => [v.id, i]));
  const out = new Map<string, Link[]>();
  for (const l of links) {
    if (!idx.has(l.from) || !idx.has(l.to) || l.from === l.to) continue;
    out.set(l.from, [...(out.get(l.from) ?? []), l]);
  }
  const found: { nodes: string[]; links: Link[] }[] = [];
  for (const start of vars) {
    const s = idx.get(start.id)!;
    const stackNodes: string[] = [start.id];
    const stackLinks: Link[] = [];
    const onPath = new Set([start.id]);
    const dfs = (at: string) => {
      if (found.length >= 40) return;
      for (const l of out.get(at) ?? []) {
        const ti = idx.get(l.to)!;
        if (l.to === start.id) {
          found.push({ nodes: [...stackNodes], links: [...stackLinks, l] });
        } else if (ti > s && !onPath.has(l.to)) {
          onPath.add(l.to);
          stackNodes.push(l.to);
          stackLinks.push(l);
          dfs(l.to);
          stackNodes.pop();
          stackLinks.pop();
          onPath.delete(l.to);
        }
      }
    };
    dfs(start.id);
  }
  found.sort((a, b) => a.nodes.length - b.nodes.length);
  let r = 0;
  let b = 0;
  return found.map((f) => {
    const negatives = f.links.filter((l) => l.pol === -1).length;
    const kind: LoopKind = negatives % 2 === 0 ? "R" : "B";
    const name = kind === "R" ? `R${++r}` : `B${++b}`;
    return { sig: f.links.map((l) => `${l.from}>${l.to}`).join("|"), nodes: f.nodes, links: f.links, negatives, kind, name, hasDelay: f.links.some((l) => l.delay) };
  });
}

/**
 * Tiny stock-and-flow style run. Every variable starts at 100; the nudged one
 * gets a sustained +20 push. Each step a variable moves halfway toward
 * 100 + push + sum(polarity × 1.15 × (source − 100)), with delayed links
 * reading the source 3 steps back.
 */
export function simulate(vars: Variable[], links: Link[], nudge: string | null, steps = 20): number[][] {
  const n = vars.length;
  const idx = new Map(vars.map((v, i) => [v.id, i]));
  const hist: number[][] = [vars.map(() => 100)];
  for (let s = 1; s <= steps; s++) {
    const prev = hist[s - 1];
    const next = prev.slice();
    for (let i = 0; i < n; i++) {
      let target = 100 + (vars[i].id === nudge ? 20 : 0);
      for (const l of links) {
        if (l.to !== vars[i].id) continue;
        const j = idx.get(l.from);
        if (j === undefined) continue;
        const src = hist[Math.max(0, s - 1 - (l.delay ? 3 : 0))][j];
        target += l.pol * 1.15 * (src - 100);
      }
      next[i] = Math.max(0, Math.min(400, prev[i] + 0.5 * (target - prev[i])));
    }
    hist.push(next);
  }
  // Per-variable series.
  return vars.map((_, i) => hist.map((row) => Math.round(row[i] * 10) / 10));
}

export type Behaviour = "grows" | "collapses" | "oscillates" | "settles" | "steady";
export function behaviour(series: number[]): Behaviour {
  const min = Math.min(...series);
  const max = Math.max(...series);
  if (max - min < 3) return "steady";
  let turns = 0;
  let dir = 0;
  for (let i = 1; i < series.length; i++) {
    const d = Math.sign(series[i] - series[i - 1]);
    if (d !== 0 && dir !== 0 && d !== dir) turns++;
    if (d !== 0) dir = d;
  }
  if (turns >= 2) return "oscillates";
  const last = series[series.length - 1];
  if (last >= 160) return "grows";
  if (last <= 50) return "collapses";
  return "settles";
}

// ── Challenge checks ──────────────────────────────────────────────────────
export type Req =
  | { t: "link"; from: string; to: string; pol: Pol; delay?: true }
  | { t: "loop"; nodes: string[]; kind: LoopKind }
  | { t: "anyLoop"; through: string; kind: LoopKind }
  | { t: "simulated" };

export type Hint =
  | { key: "missing"; a: string; b: string }
  | { key: "polarity"; a: string; b: string }
  | { key: "delay"; a: string; b: string }
  | { key: "noLoop" }
  | { key: "label" }
  | { key: "wrongLabel" }
  | { key: "addLoop"; kind: LoopKind; v: string }
  | { key: "simulate" };

/** Find the variable for a word-bank key (or a custom one typed with the same name). */
export function varFor(vars: Variable[], key: string, labelOf: (key: string) => string): Variable | undefined {
  const norm = (s: string) => s.trim().toLowerCase();
  return vars.find((v) => v.key === key) ?? vars.find((v) => v.label && norm(v.label) === norm(labelOf(key)));
}

export interface ReqResult {
  ok: boolean;
  hint?: Hint;
  /** Loop signatures that this requirement judged, and whether the label was right. */
  judged?: { sig: string; right: boolean }[];
}

export function checkReq(req: Req, m: MapState, loops: Loop[], labelOf: (key: string) => string): ReqResult {
  const get = (k: string) => varFor(m.vars, k, labelOf);
  if (req.t === "simulated") return m.simulated ? { ok: true } : { ok: false, hint: { key: "simulate" } };
  if (req.t === "link") {
    const a = get(req.from);
    const b = get(req.to);
    const l = a && b ? m.links.find((x) => x.from === a.id && x.to === b.id) : undefined;
    if (!l) return { ok: false, hint: { key: "missing", a: req.from, b: req.to } };
    if (l.pol !== req.pol) return { ok: false, hint: { key: "polarity", a: req.from, b: req.to } };
    if (req.delay && !l.delay) return { ok: false, hint: { key: "delay", a: req.from, b: req.to } };
    return { ok: true };
  }
  if (req.t === "loop") {
    const ids = req.nodes.map(get);
    if (ids.some((v) => !v)) return { ok: false, hint: { key: "noLoop" } };
    const set = new Set(ids.map((v) => v!.id));
    const loop = loops.find((lp) => lp.nodes.length === set.size && lp.nodes.every((id) => set.has(id)));
    if (!loop) return { ok: false, hint: { key: "noLoop" } };
    const label = m.labels[loop.sig];
    if (!label) return { ok: false, hint: { key: "label" } };
    const right = label === loop.kind && loop.kind === req.kind;
    return right ? { ok: true, judged: [{ sig: loop.sig, right }] } : { ok: false, hint: { key: "wrongLabel" }, judged: [{ sig: loop.sig, right: false }] };
  }
  const v = get(req.through);
  const cands = v ? loops.filter((lp) => lp.kind === req.kind && lp.nodes.includes(v.id)) : [];
  if (!cands.length) return { ok: false, hint: { key: "addLoop", kind: req.kind, v: req.through } };
  const good = cands.find((lp) => m.labels[lp.sig] === lp.kind);
  if (good) return { ok: true, judged: [{ sig: good.sig, right: true }] };
  return { ok: false, hint: { key: cands.some((lp) => m.labels[lp.sig]) ? "wrongLabel" : "label" }, judged: cands.filter((lp) => m.labels[lp.sig]).map((lp) => ({ sig: lp.sig, right: false })) };
}

export function isMapState(x: unknown): x is MapState {
  if (!x || typeof x !== "object") return false;
  const m = x as MapState;
  return Array.isArray(m.vars) && Array.isArray(m.links) && typeof m.labels === "object" && m.vars.every((v) => typeof v.id === "string" && typeof v.x === "number");
}
