// Teach the Machine (AI-Empowered Youth): a tiny image classifier that runs
// in the browser. A drawing (or a camera frame) becomes a 16x16 grid of grey
// levels: those 256 numbers are the "features". Classification is
// k-nearest neighbours: the k training examples whose grids are closest vote.
// Nothing here talks to a server.

export const N = 16;
export const CANVAS = 256;
export type Grid = number[]; // N*N values, 0 (white) to 1 (full ink)

export interface Example {
  id: string;
  /** Label index. */
  l: number;
  /** Grid as 256 hex digits (0 to f). */
  g: string;
  /** Captured from the camera: kept on this screen only, never saved. */
  cam?: 1;
}

export const encode = (g: Grid): string => g.map((v) => Math.max(0, Math.min(15, Math.round(v * 15))).toString(16)).join("");
export const decode = (s: string): Grid => Array.from(s, (c) => parseInt(c, 16) / 15);
export const isGridString = (s: unknown): s is string => typeof s === "string" && /^[0-9a-f]{256}$/.test(s);

/** Darkness of every canvas pixel (0 white, 1 black). */
function darkness(ctx: CanvasRenderingContext2D): Float32Array {
  const { data } = ctx.getImageData(0, 0, CANVAS, CANVAS);
  const out = new Float32Array(CANVAS * CANVAS);
  for (let i = 0; i < out.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3] / 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    out[i] = a * (1 - lum);
  }
  return out;
}

function blur(g: Grid): Grid {
  const out = new Array<number>(N * N).fill(0);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let s = 0;
      let w = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
          const k = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
          s += g[yy * N + xx] * k;
          w += k;
        }
      out[y * N + x] = s / w;
    }
  return out;
}

function normalise(g: Grid): Grid {
  const max = Math.max(...g);
  return max > 0 ? g.map((v) => v / max) : g;
}

/**
 * Features of a drawing: crop to the ink, keep the shape (not its size or
 * place), shrink to 16x16, soften a little. Returns null for an empty canvas.
 */
export function drawingGrid(ctx: CanvasRenderingContext2D): Grid | null {
  const d = darkness(ctx);
  let x0 = CANVAS;
  let y0 = CANVAS;
  let x1 = -1;
  let y1 = -1;
  let ink = 0;
  for (let y = 0; y < CANVAS; y++)
    for (let x = 0; x < CANVAS; x++) {
      if (d[y * CANVAS + x] > 0.2) {
        ink++;
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  if (ink < 40) return null;
  const side = Math.max(x1 - x0 + 1, y1 - y0 + 1, 24);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const inner = N - 2;
  const cell = side / inner;
  const g = new Array<number>(N * N).fill(0);
  for (let gy = 0; gy < inner; gy++)
    for (let gx = 0; gx < inner; gx++) {
      const sx0 = cx - side / 2 + gx * cell;
      const sy0 = cy - side / 2 + gy * cell;
      let s = 0;
      let n = 0;
      const step = Math.max(1, Math.floor(cell / 4));
      for (let yy = Math.floor(sy0); yy < sy0 + cell; yy += step)
        for (let xx = Math.floor(sx0); xx < sx0 + cell; xx += step) {
          n++;
          if (xx < 0 || yy < 0 || xx >= CANVAS || yy >= CANVAS) continue;
          s += d[yy * CANVAS + xx];
        }
      g[(gy + 1) * N + gx + 1] = n ? Math.min(1, (s / n) * 2.2) : 0;
    }
  return normalise(blur(g));
}

/** Features of a camera frame drawn on the canvas: the whole frame in grey, contrast stretched. */
export function cameraGrid(ctx: CanvasRenderingContext2D): Grid {
  const d = darkness(ctx);
  const cell = CANVAS / N;
  const g = new Array<number>(N * N).fill(0);
  for (let gy = 0; gy < N; gy++)
    for (let gx = 0; gx < N; gx++) {
      let s = 0;
      let n = 0;
      for (let yy = gy * cell; yy < (gy + 1) * cell; yy += 2)
        for (let xx = gx * cell; xx < (gx + 1) * cell; xx += 2) {
          s += d[yy * CANVAS + xx];
          n++;
        }
      g[gy * N + gx] = s / n;
    }
  const min = Math.min(...g);
  const max = Math.max(...g);
  return max - min > 0.02 ? g.map((v) => (v - min) / (max - min)) : g.map(() => 0);
}

export function distance(a: Grid, b: Grid): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

export interface Prediction {
  /** Winning label index. */
  label: number;
  /** Vote share per label (0 to 1): the confidence bars. */
  conf: number[];
  /** The k nearest examples, closest first. */
  near: { ex: Example; d: number }[];
  k: number;
}

/** k is 3 for small data sets, 5 once there are 10 examples or more. */
export const kFor = (n: number) => Math.max(1, Math.min(n, n < 10 ? 3 : 5));

export function classify(examples: Example[], grid: Grid, labels: number): Prediction | null {
  if (!examples.length) return null;
  const scored = examples.map((ex) => ({ ex, d: distance(decode(ex.g), grid) })).sort((a, b) => a.d - b.d);
  const k = kFor(examples.length);
  const near = scored.slice(0, k);
  const votes = new Array<number>(labels).fill(0);
  const close = new Array<number>(labels).fill(0);
  for (const n of near) {
    if (n.ex.l >= labels) continue;
    votes[n.ex.l]++;
    close[n.ex.l] += 1 / (1 + n.d);
  }
  let label = 0;
  for (let i = 1; i < labels; i++) if (votes[i] > votes[label] || (votes[i] === votes[label] && close[i] > close[label])) label = i;
  return { label, conf: votes.map((v) => v / k), near, k };
}

// ── Synthetic doodles (seed data, test sets, "ask friends", "draw for me") ──

export type Shape = "circle" | "square" | "triangle";
export const SHAPES: Shape[] = ["circle", "square", "triangle"];

export interface DoodleStyle {
  /** "narrow": big, upright, thin outline. "wide": any size, place, tilt and thickness. */
  variety: "narrow" | "wide";
}

/** A pen stroke: flat [x0, y0, x1, y1, ...] in canvas pixels, and its width. */
export interface Stroke {
  p: number[];
  w: number;
}

/** A hand-made looking shape as one stroke (canvas is 256x256). */
export function shapeStroke(shape: Shape, rand: () => number, style: DoodleStyle): Stroke {
  const wide = style.variety === "wide";
  const r = wide ? 40 + rand() * 60 : 78 + rand() * 14;
  const lw = wide ? 10 + rand() * 12 : 12 + rand() * 3;
  const margin = r + lw;
  const cx = wide ? margin + rand() * Math.max(0, CANVAS - 2 * margin) : 128 + (rand() - 0.5) * 14;
  const cy = wide ? margin + rand() * Math.max(0, CANVAS - 2 * margin) : 128 + (rand() - 0.5) * 14;
  const rot = wide ? (rand() - 0.5) * 0.3 : (rand() - 0.5) * 0.1;
  const aspect = wide ? 0.8 + rand() * 0.4 : 0.94 + rand() * 0.12;
  const wob = wide ? 0.1 : 0.04;
  const pts: [number, number][] = [];
  const jitter = () => 1 + (rand() - 0.5) * wob;
  if (shape === "circle") {
    const start = rand() * Math.PI * 2;
    for (let i = 0; i <= 40; i++) {
      const a = start + (i / 40) * Math.PI * 2;
      const rr = r * jitter();
      pts.push([Math.cos(a) * rr * aspect, Math.sin(a) * rr]);
    }
  } else {
    const corners: [number, number][] =
      shape === "square"
        ? [
            [-r * 0.85, -r * 0.85],
            [r * 0.85, -r * 0.85],
            [r * 0.85, r * 0.85],
            [-r * 0.85, r * 0.85],
          ]
        : [
            [0, -r],
            [r * 0.95, r * 0.7],
            [-r * 0.95, r * 0.7],
          ];
    for (let c = 0; c < corners.length; c++) {
      const [ax, ay] = corners[c];
      const [bx, by] = corners[(c + 1) % corners.length];
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        const j = jitter();
        pts.push([(ax + (bx - ax) * t) * j * aspect, (ay + (by - ay) * t) * j]);
      }
    }
    pts.push(pts[0]);
  }
  const p: number[] = [];
  for (const [x, y] of pts) {
    p.push(Math.round((cx + x * Math.cos(rot) - y * Math.sin(rot)) * 10) / 10, Math.round((cy + x * Math.sin(rot) + y * Math.cos(rot)) * 10) / 10);
  }
  return { p, w: Math.round(lw) };
}

export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (s.p.length < 2) return;
  ctx.save();
  ctx.strokeStyle = "#0D1B2A";
  ctx.fillStyle = "#0D1B2A";
  ctx.lineWidth = s.w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s.p[0], s.p[1]);
  if (s.p.length === 2) ctx.lineTo(s.p[0] + 0.1, s.p[1]);
  for (let i = 2; i < s.p.length; i += 2) ctx.lineTo(s.p[i], s.p[i + 1]);
  ctx.stroke();
  ctx.restore();
}

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, CANVAS, CANVAS);
  ctx.restore();
}

let scratch: HTMLCanvasElement | null = null;
/** A synthetic doodle's grid (browser only). */
export function synthGrid(shape: Shape, rand: () => number, style: DoodleStyle): string {
  if (!scratch) {
    scratch = document.createElement("canvas");
    scratch.width = CANVAS;
    scratch.height = CANVAS;
  }
  const ctx = scratch.getContext("2d", { willReadFrequently: true })!;
  clearCanvas(ctx);
  drawStroke(ctx, shapeStroke(shape, rand, style));
  return encode(drawingGrid(ctx) ?? new Array<number>(N * N).fill(0));
}
