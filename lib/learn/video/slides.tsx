import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { createElement } from "react";
import type { Scene } from "./scenes";
import { ICONS } from "./icons";

// Slides for the narrated lesson videos, 1920x1080 PNG, rendered on the
// server by next/og (Satori), with the fonts read from lib/og/fonts (no
// network). One ARFA template: navy background, orange accents, the
// "ARFA · AI Academy" wordmark, the track and lesson chips, progress dots;
// and the layouts: title, bullets, steps (a flow), compare, code/prompt card,
// recap, and the illustrated ones: cycle (a loop), hub (a system and its
// parts), timeline, illustration (icons as a small scene) and number. Points
// can be revealed one at a time (SlideContext.reveal), so a scene becomes a
// few frames that build up with the narration (pipeline.ts). Satori: every
// element with more than one child needs display:flex, and only inline
// styles work.

export const SLIDE = { width: 1920, height: 1080 };

const NAVY = "#0D1B2A";
const NAVY2 = "#1B3A6B";
const ORANGE = "#F47C20";
const MUTED = "rgba(255,255,255,0.74)";
const LINE = "rgba(255,255,255,0.16)";

export interface SlideContext {
  index: number;
  total: number;
  trackTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  locale: "en" | "fr";
  /** How many of the scene's points to show (revealCount); all when absent. */
  reveal?: number;
}

/** How many points a scene reveals one at a time (0: shown whole). */
export function revealCount(scene: Scene): number {
  switch (scene.layout) {
    case "bullets":
    case "recap":
      return scene.bullets.length > 1 ? Math.min(scene.bullets.length, 4) : 0;
    case "steps":
      return scene.steps.length > 1 ? Math.min(scene.steps.length, 5) : 0;
    case "cycle":
    case "hub":
    case "timeline":
      return Math.min(scene.nodes.length, 6);
    case "compare":
      return 2;
    case "illustration":
      return scene.icons.length > 1 ? scene.icons.length : 0;
    default:
      return 0;
  }
}

/**
 * Shown or not yet. Not-yet points stay in place, so nothing moves as they
 * appear: Satori leaves a fully transparent element out of the layout, so
 * they are drawn at 1% instead (invisible on the dark background).
 */
const vis = (i: number, ctx: SlideContext) => (ctx.reveal === undefined || i < ctx.reveal ? 1 : 0.01);

function Icon({ name, size, color = "white", stroke = 1.8 }: { name: string; size: number; color?: string; stroke?: number }) {
  const node = ICONS[name];
  if (!node) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {node.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}

/** An icon in a soft rounded tile. */
function IconTile({ name, size, strong = false }: { name: string; size: number; strong?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: strong ? ORANGE : "rgba(255,255,255,0.08)",
        border: `2px solid ${strong ? ORANGE : LINE}`,
        flexShrink: 0,
      }}
    >
      <Icon name={name} size={Math.round(size * 0.56)} color={strong ? "white" : ORANGE} />
    </div>
  );
}

const LABELS = {
  en: { tryIt: "Now try it on the lesson page", takeaways: "Key takeaways", prompt: "Prompt", code: "Code" },
  fr: { tryIt: "À vous : essayez sur la page de la leçon", takeaways: "À retenir", prompt: "Prompt", code: "Code" },
} as const;

type Font = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };
let fontsP: Promise<Font[]> | null = null;
let logoP: Promise<string | null> | null = null;

function fonts(): Promise<Font[]> {
  fontsP ??= (async (): Promise<Font[]> => {
    const dir = path.join(process.cwd(), "lib", "og", "fonts");
    const [r, b, m] = await Promise.all(
      ["InstrumentSans-Regular.ttf", "InstrumentSans-Bold.ttf", "JetBrainsMono-Regular.ttf"].map((f) => readFile(path.join(dir, f))),
    );
    return [
      { name: "Instrument Sans", data: r, weight: 400, style: "normal" },
      { name: "Instrument Sans", data: b, weight: 700, style: "normal" },
      { name: "JetBrains Mono", data: m, weight: 400, style: "normal" },
    ];
  })().catch((err) => {
    fontsP = null;
    throw err;
  });
  return fontsP!;
}

function logo(): Promise<string | null> {
  logoP ??= readFile(path.join(process.cwd(), "public", "logo-mark.png"))
    .then((b) => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => null);
  return logoP;
}

/** Spaces the fonts may lack (French narrow no-break space) become plain spaces. */
const clean = (s: string) => s.replace(/[   ]/g, " ").replace(/[‘’]/g, "'").trim();

const sizeFor = (s: string, sizes: Array<[number, number]>, min: number) => {
  for (const [len, size] of sizes) if (s.length <= len) return size;
  return min;
};

function Check({ color = ORANGE, size = 40 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill={color} />
      <path d="M7 12.5l3.2 3.2L17.5 8.5" stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M4 12h14M13 6l6 6-6 6" stroke={ORANGE} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Heading({ text, size }: { text: string; size?: number }) {
  const t = clean(text);
  return (
    <div style={{ display: "flex", fontSize: size ?? sizeFor(t, [[30, 72], [50, 64], [70, 56]], 50), fontWeight: 700, lineHeight: 1.12, letterSpacing: -1, color: "white", maxWidth: 1600 }}>
      {t}
    </div>
  );
}

function Bullets({ items, icons = [], ctx }: { items: string[]; icons?: string[]; ctx: SlideContext }) {
  const longest = Math.max(0, ...items.map((x) => x.length));
  const size = longest > 100 ? 38 : longest > 70 ? 42 : 46;
  const withIcons = icons.length >= items.length && items.length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: withIcons ? 28 : 34, marginTop: 56 }}>
      {items.map((b, i) => (
        <div key={i} style={{ display: "flex", alignItems: withIcons ? "center" : "flex-start", gap: 30, opacity: vis(i, ctx) }}>
          {withIcons ? (
            <IconTile name={icons[i]} size={84} strong={ctx.reveal !== undefined && i === ctx.reveal - 1} />
          ) : (
            <div style={{ display: "flex", width: 18, height: 18, borderRadius: 4, background: ORANGE, marginTop: size * 0.45, flexShrink: 0 }} />
          )}
          <div style={{ display: "flex", fontSize: size, lineHeight: 1.3, color: "rgba(255,255,255,0.92)", maxWidth: 1460 }}>{clean(b)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Illustrated layouts ─────────────────────────────────────────────────────

/** The drawing area under the heading. */
const AREA = { w: 1660, h: 560 };

/** A small arrowhead (triangle) at (x, y) pointing along angle a (radians). */
function arrowHead(x: number, y: number, a: number, s = 18): string {
  const p = (dx: number, dy: number) => `${(x + dx * Math.cos(a) - dy * Math.sin(a)).toFixed(1)},${(y + dx * Math.sin(a) + dy * Math.cos(a)).toFixed(1)}`;
  return `${p(s * 0.6, 0)} ${p(-s * 0.5, -s * 0.55)} ${p(-s * 0.5, s * 0.55)}`;
}

function NodeCard({ label, icon, x, y, w, active, opacity, num }: { label: string; icon?: string; x: number; y: number; w: number; active: boolean; opacity: number; num?: number }) {
  const t = clean(label);
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - 62,
        width: w,
        height: 124,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 24px",
        borderRadius: 26,
        // Solid colours: the lines and the loop behind must not show through.
        background: active ? "#3A3E51" : "#16325A",
        border: `3px solid ${active ? ORANGE : "rgba(255,255,255,0.22)"}`,
        opacity,
      }}
    >
      {icon ? (
        <Icon name={icon} size={50} color={ORANGE} />
      ) : num !== undefined ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 52, background: ORANGE, fontSize: 28, fontWeight: 700, color: "white", flexShrink: 0 }}>{String(num)}</div>
      ) : null}
      <div style={{ display: "flex", fontSize: t.length > 22 ? 30 : 34, fontWeight: 700, lineHeight: 1.15, color: "white" }}>{t}</div>
    </div>
  );
}

function Cycle({ scene, ctx }: { scene: Scene; ctx: SlideContext }) {
  const n = Math.min(scene.nodes.length, 6);
  const cx = AREA.w / 2, cy = AREA.h / 2 + 10, rx = n > 4 ? 600 : 540, ry = 205;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), a };
  });
  // Arrowheads half-way between stages, along the loop.
  const heads = pts.map((_, i) => {
    const a = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n;
    const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
    const tangent = Math.atan2(ry * Math.cos(a), -rx * Math.sin(a));
    return { x, y, tangent, i };
  });
  const shown = ctx.reveal ?? n;
  return (
    <div style={{ display: "flex", position: "relative", width: AREA.w, height: AREA.h, marginTop: 30 }}>
      <svg width={AREA.w} height={AREA.h} viewBox={`0 0 ${AREA.w} ${AREA.h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeDasharray="14 12" />
        {heads.map((h) => (
          <polygon key={h.i} points={arrowHead(h.x, h.y, h.tangent, 26)} fill={h.i < shown - 1 || shown === n ? ORANGE : "rgba(255,255,255,0.25)"} />
        ))}
      </svg>
      {pts.map((p, i) => (
        <NodeCard key={i} label={scene.nodes[i]} icon={scene.icons[i]} num={scene.icons[i] ? undefined : i + 1} x={p.x} y={p.y} w={n > 4 ? 400 : 440} active={i === shown - 1} opacity={vis(i, ctx)} />
      ))}
    </div>
  );
}

function Hub({ scene, ctx }: { scene: Scene; ctx: SlideContext }) {
  const n = Math.min(scene.nodes.length, 6);
  const cx = AREA.w / 2, cy = AREA.h / 2 + 10, rx = 620, ry = 215;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + (n % 2 === 0 ? Math.PI / n : 0);
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
  const shown = ctx.reveal ?? n;
  const center = clean(scene.center);
  return (
    <div style={{ display: "flex", position: "relative", width: AREA.w, height: AREA.h, marginTop: 30 }}>
      <svg width={AREA.w} height={AREA.h} viewBox={`0 0 ${AREA.w} ${AREA.h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        {pts.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={i < shown ? "rgba(244,124,32,0.7)" : "rgba(255,255,255,0.08)"} strokeWidth="4" />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - 170,
          top: cy - 120,
          width: 340,
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          borderRadius: 240,
          background: ORANGE,
          fontSize: center.length > 18 ? 34 : 40,
          fontWeight: 700,
          lineHeight: 1.15,
          color: "white",
          textAlign: "center",
        }}
      >
        {center}
      </div>
      {pts.map((p, i) => (
        <NodeCard key={i} label={scene.nodes[i]} icon={scene.icons[i]} x={p.x} y={p.y} w={380} active={i === shown - 1 && ctx.reveal !== undefined} opacity={vis(i, ctx)} />
      ))}
    </div>
  );
}

function Timeline({ scene, ctx }: { scene: Scene; ctx: SlideContext }) {
  const n = Math.min(scene.nodes.length, 6);
  const y = AREA.h / 2;
  const step = AREA.w / n;
  const shown = ctx.reveal ?? n;
  return (
    <div style={{ display: "flex", position: "relative", width: AREA.w, height: AREA.h, marginTop: 30 }}>
      <svg width={AREA.w} height={AREA.h} viewBox={`0 0 ${AREA.w} ${AREA.h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={step / 2 - 40} y1={y} x2={AREA.w - step / 2 + 60} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth="6" strokeLinecap="round" />
        <line x1={step / 2 - 40} y1={y} x2={step / 2 + step * Math.max(0, shown - 1)} y2={y} stroke={ORANGE} strokeWidth="6" strokeLinecap="round" />
        <polygon points={arrowHead(AREA.w - step / 2 + 70, y, 0, 30)} fill="rgba(255,255,255,0.3)" />
        {Array.from({ length: n }, (_, i) => (
          <circle key={i} cx={step / 2 + step * i} cy={y} r={i < shown ? 20 : 14} fill={i < shown ? ORANGE : "rgba(255,255,255,0.25)"} />
        ))}
      </svg>
      {Array.from({ length: n }, (_, i) => {
        const up = i % 2 === 0;
        const label = clean(scene.nodes[i]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: step / 2 + step * i - Math.min(step, 420) / 2,
              top: up ? y - 210 : y + 50,
              width: Math.min(step, 420),
              height: 160,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: up ? "flex-end" : "flex-start",
              gap: 12,
              opacity: vis(i, ctx),
            }}
          >
            {scene.icons[i] && up ? <Icon name={scene.icons[i]} size={56} color={ORANGE} /> : null}
            <div style={{ display: "flex", fontSize: n > 4 ? 30 : 36, fontWeight: 700, lineHeight: 1.15, color: "white", textAlign: "center", justifyContent: "center" }}>{label}</div>
            {scene.icons[i] && !up ? <Icon name={scene.icons[i]} size={56} color={ORANGE} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function Illustration({ scene, ctx }: { scene: Scene; ctx: SlideContext }) {
  const icons = scene.icons.slice(0, 3);
  const size = icons.length === 1 ? 300 : 250;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: AREA.w, marginTop: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        {icons.flatMap((k, i) => [
          i > 0 ? (
            <svg key={`a${i}`} width="120" height="40" viewBox="0 0 120 40" style={{ opacity: vis(i, ctx) }}>
              <line x1="6" y1="20" x2="96" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="5" strokeDasharray="10 10" strokeLinecap="round" />
              <polygon points={arrowHead(104, 20, 0, 24)} fill={ORANGE} />
            </svg>
          ) : null,
          <div
            key={`i${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: size,
              height: size,
              borderRadius: size,
              background: i === icons.length - 1 ? "rgba(244,124,32,0.16)" : "rgba(255,255,255,0.07)",
              border: `4px solid ${i === icons.length - 1 ? ORANGE : "rgba(255,255,255,0.2)"}`,
              opacity: vis(i, ctx),
            }}
          >
            <Icon name={k} size={Math.round(size * 0.5)} color={i === icons.length - 1 ? ORANGE : "white"} stroke={1.6} />
          </div>,
        ])}
      </div>
      {scene.bullets[0] ? (
        <div style={{ display: "flex", marginTop: 56, fontSize: 40, lineHeight: 1.35, color: MUTED, maxWidth: 1400, textAlign: "center", justifyContent: "center" }}>{clean(scene.bullets[0])}</div>
      ) : null}
    </div>
  );
}

function BigNumber({ scene }: { scene: Scene }) {
  const f = scene.figure!;
  const v = clean(f.value);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: AREA.w, marginTop: 30 }}>
      <div style={{ display: "flex", fontSize: v.length > 8 ? 180 : 240, fontWeight: 700, letterSpacing: -6, lineHeight: 1, color: ORANGE }}>{v}</div>
      <div style={{ display: "flex", marginTop: 36, width: 160, height: 8, borderRadius: 8, background: "rgba(255,255,255,0.25)" }} />
      <div style={{ display: "flex", marginTop: 36, fontSize: 46, lineHeight: 1.3, color: "white", maxWidth: 1300, textAlign: "center", justifyContent: "center" }}>{clean(f.label)}</div>
    </div>
  );
}

function Body({ scene, ctx }: { scene: Scene; ctx: SlideContext }) {
  const L = LABELS[ctx.locale];
  switch (scene.layout) {
    case "title": {
      const t = clean(scene.title);
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 5, color: ORANGE, textTransform: "uppercase" }}>{clean(ctx.moduleTitle).slice(0, 70)}</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: sizeFor(t, [[28, 104], [45, 88], [70, 74]], 64), fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "white", maxWidth: 1560 }}>{t}</div>
          {scene.bullets[0] ? (
            <div style={{ display: "flex", marginTop: 36, fontSize: 42, lineHeight: 1.35, color: MUTED, maxWidth: 1400 }}>{clean(scene.bullets[0])}</div>
          ) : null}
          <div style={{ display: "flex", marginTop: 56, width: 160, height: 8, borderRadius: 8, background: ORANGE }} />
        </div>
      );
    }
    case "steps": {
      const steps = scene.steps.slice(0, 5);
      const w = Math.floor((1660 - (steps.length - 1) * 72) / steps.length);
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Heading text={scene.title} />
          <div style={{ display: "flex", alignItems: "center", marginTop: 90, gap: 16 }}>
            {steps.flatMap((s, i) => [
              <div
                key={`s${i}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: w,
                  minHeight: 300,
                  padding: "34px 30px",
                  borderRadius: 28,
                  background: "rgba(255,255,255,0.07)",
                  border: `2px solid ${(ctx.reveal === undefined ? i === 0 : i === ctx.reveal - 1) ? ORANGE : LINE}`,
                  opacity: vis(i, ctx),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 72, background: ORANGE, fontSize: 38, fontWeight: 700, color: "white" }}>
                    {String(i + 1)}
                  </div>
                  {scene.icons[i] ? <Icon name={scene.icons[i]} size={60} color={ORANGE} /> : null}
                </div>
                <div style={{ display: "flex", marginTop: 30, fontSize: steps.length > 4 ? 34 : 40, fontWeight: 700, lineHeight: 1.2, color: "white" }}>{clean(s)}</div>
              </div>,
              i < steps.length - 1 ? (
                <div key={`a${i}`} style={{ display: "flex", opacity: vis(i + 1, ctx) }}>
                  <Arrow />
                </div>
              ) : null,
            ])}
          </div>
          {scene.bullets[0] ? <div style={{ display: "flex", marginTop: 56, fontSize: 36, color: MUTED, maxWidth: 1500 }}>{clean(scene.bullets[0])}</div> : null}
        </div>
      );
    }
    case "compare": {
      const c = scene.compare!;
      const col = (title: string, items: string[], strong: boolean) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            opacity: vis(strong ? 1 : 0, ctx),
            padding: "40px 46px",
            borderRadius: 30,
            background: strong ? "rgba(244,124,32,0.10)" : "rgba(255,255,255,0.06)",
            border: `2px solid ${strong ? ORANGE : LINE}`,
          }}
        >
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: strong ? ORANGE : MUTED }}>{clean(title)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 34 }}>
            {items.map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 22 }}>
                {strong ? (
                  <Check size={38} />
                ) : (
                  <div style={{ display: "flex", width: 38, height: 38, borderRadius: 38, border: `3px solid ${MUTED}`, flexShrink: 0 }} />
                )}
                <div style={{ display: "flex", fontSize: 36, lineHeight: 1.3, color: "rgba(255,255,255,0.9)", maxWidth: 680 }}>{clean(x)}</div>
              </div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Heading text={scene.title} />
          <div style={{ display: "flex", gap: 48, marginTop: 64 }}>
            {col(c.leftTitle, c.left, false)}
            {col(c.rightTitle, c.right, true)}
          </div>
        </div>
      );
    }
    case "code": {
      const code = scene.code!;
      const lines = clean(code.text).split("\n");
      const longest = Math.max(...lines.map((l) => l.length));
      const size = lines.length > 10 || longest > 70 ? 28 : lines.length > 6 || longest > 55 ? 32 : 36;
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Heading text={scene.title} size={56} />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 44, borderRadius: 28, background: "#08111C", border: `2px solid ${LINE}`, overflow: "hidden", maxWidth: 1680 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 34px", borderBottom: `2px solid ${LINE}`, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", width: 18, height: 18, borderRadius: 18, background: ORANGE }} />
              <div style={{ display: "flex", width: 18, height: 18, borderRadius: 18, background: "rgba(255,255,255,0.3)" }} />
              <div style={{ display: "flex", width: 18, height: 18, borderRadius: 18, background: "rgba(255,255,255,0.3)" }} />
              <div style={{ display: "flex", marginLeft: 18, fontSize: 28, fontWeight: 700, color: MUTED }}>
                {clean(code.label || (code.kind === "prompt" ? L.prompt : L.code))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", padding: "30px 38px" }}>
              {lines.map((l, i) => (
                <div key={i} style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: size, lineHeight: 1.45, color: code.kind === "prompt" ? "#F5F7FA" : "#9FD3FF", whiteSpace: "pre-wrap", minHeight: size * 1.45 }}>
                  {l || " "}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    case "recap": {
      const items = scene.bullets.slice(0, 4);
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 5, color: ORANGE, textTransform: "uppercase" }}>{L.takeaways}</div>
          <div style={{ display: "flex", marginTop: 18 }}>
            <Heading text={scene.title} size={60} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 50 }}>
            {items.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 28, opacity: vis(i, ctx) }}>
                <Check size={46} />
                <div style={{ display: "flex", fontSize: 42, lineHeight: 1.3, color: "rgba(255,255,255,0.92)", maxWidth: 1480 }}>{clean(b)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 54 }}>
            <div style={{ display: "flex", padding: "16px 34px", borderRadius: 999, background: ORANGE, fontSize: 32, fontWeight: 700, color: "white" }}>{L.tryIt}</div>
          </div>
        </div>
      );
    }
    case "cycle":
    case "hub":
    case "timeline":
    case "illustration":
    case "number":
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Heading text={scene.title} size={56} />
          {scene.layout === "cycle" ? (
            <Cycle scene={scene} ctx={ctx} />
          ) : scene.layout === "hub" ? (
            <Hub scene={scene} ctx={ctx} />
          ) : scene.layout === "timeline" ? (
            <Timeline scene={scene} ctx={ctx} />
          ) : scene.layout === "illustration" ? (
            <Illustration scene={scene} ctx={ctx} />
          ) : (
            <BigNumber scene={scene} />
          )}
        </div>
      );
    default:
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Heading text={scene.title} />
          <Bullets items={scene.bullets.length ? scene.bullets : []} icons={scene.icons} ctx={ctx} />
        </div>
      );
  }
}

function Slide({ scene, ctx, logoUrl }: { scene: Scene; ctx: SlideContext; logoUrl: string | null }) {
  const chip = (text: string, strong: boolean) => (
    <div
      style={{
        display: "flex",
        maxWidth: 560,
        padding: "10px 24px",
        borderRadius: 999,
        fontSize: 24,
        fontWeight: 700,
        color: strong ? "white" : MUTED,
        background: strong ? "rgba(244,124,32,0.18)" : "rgba(255,255,255,0.06)",
        border: `2px solid ${strong ? "rgba(244,124,32,0.6)" : LINE}`,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      }}
    >
      {clean(text)}
    </div>
  );
  return (
    <div
      style={{
        width: SLIDE.width,
        height: SLIDE.height,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${NAVY} 0%, #132C52 58%, ${NAVY2} 100%)`,
        fontFamily: "Instrument Sans",
        color: "white",
      }}
    >
      <div style={{ position: "absolute", right: -220, top: -260, width: 820, height: 820, borderRadius: 9999, background: "#2251A3", opacity: 0.22, display: "flex" }} />
      <div style={{ position: "absolute", left: -160, bottom: -260, width: 560, height: 560, borderRadius: 9999, background: ORANGE, opacity: 0.08, display: "flex" }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 14, height: SLIDE.height, background: `linear-gradient(180deg, ${ORANGE}, #B8500A)`, display: "flex" }} />

      {/* Header: wordmark, track and lesson */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 136, padding: "0 96px 0 110px", borderBottom: `2px solid ${LINE}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} width={100} height={60} alt="" style={{ objectFit: "contain" }} />
          ) : null}
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>
            <span style={{ color: ORANGE }}>ARFA</span>
            <span style={{ color: "rgba(255,255,255,0.5)", margin: "0 12px" }}>·</span>
            <span style={{ color: "white" }}>AI Academy</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {chip(ctx.trackTitle, false)}
          {chip(ctx.lessonTitle, true)}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: "flex", flex: 1, padding: "72px 130px 40px 130px" }}>
        <Body scene={scene} ctx={ctx} />
      </div>

      {/* Footer: progress dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 104, padding: "0 96px 0 130px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {Array.from({ length: ctx.total }, (_, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                height: 14,
                width: i === ctx.index ? 56 : 14,
                borderRadius: 14,
                background: i === ctx.index ? ORANGE : i < ctx.index ? "rgba(244,124,32,0.45)" : "rgba(255,255,255,0.22)",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: 2 }}>
          {`${ctx.index + 1} / ${ctx.total}`}
        </div>
      </div>
    </div>
  );
}

/** One slide as a PNG. */
export async function renderSlide(scene: Scene, ctx: SlideContext): Promise<Buffer> {
  const [f, l] = await Promise.all([fonts(), logo()]);
  const res = new ImageResponse(<Slide scene={scene} ctx={ctx} logoUrl={l} />, { ...SLIDE, fonts: f });
  return Buffer.from(await res.arrayBuffer());
}
