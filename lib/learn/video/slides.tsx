import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import type { Scene } from "./scenes";

// Slides for the narrated lesson videos, 1920x1080 PNG, rendered on the
// server by next/og (Satori), with the fonts read from lib/og/fonts (no
// network). One ARFA template: navy background, orange accents, the
// "ARFA · AI Academy" wordmark, the track and lesson chips, progress dots;
// and six layouts: title, bullets, steps (a flow), compare, code/prompt card,
// recap. Satori: every element with more than one child needs display:flex,
// and only inline styles work.

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
}

const LABELS = {
  en: { tryIt: "Now try it on the lesson page", takeaways: "Key takeaways", prompt: "Prompt", code: "Code" },
  fr: { tryIt: "À vous : essayez sur la page de la leçon", takeaways: "À retenir", prompt: "Prompt", code: "Code" },
} as const;

type Font = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };
let fontsP: Promise<Font[]> | null = null;
let logoP: Promise<string | null> | null = null;

function fonts(): Promise<Font[]> {
  fontsP ??= (async () => {
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
  return fontsP;
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

function Bullets({ items }: { items: string[] }) {
  const longest = Math.max(0, ...items.map((x) => x.length));
  const size = longest > 100 ? 38 : longest > 70 ? 42 : 46;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: 56 }}>
      {items.map((b, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 30 }}>
          <div style={{ display: "flex", width: 18, height: 18, borderRadius: 4, background: ORANGE, marginTop: size * 0.45, flexShrink: 0 }} />
          <div style={{ display: "flex", fontSize: size, lineHeight: 1.3, color: "rgba(255,255,255,0.92)", maxWidth: 1500 }}>{clean(b)}</div>
        </div>
      ))}
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
                  border: `2px solid ${i === 0 ? ORANGE : LINE}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 72, background: ORANGE, fontSize: 38, fontWeight: 700, color: "white" }}>
                  {String(i + 1)}
                </div>
                <div style={{ display: "flex", marginTop: 30, fontSize: steps.length > 4 ? 34 : 40, fontWeight: 700, lineHeight: 1.2, color: "white" }}>{clean(s)}</div>
              </div>,
              i < steps.length - 1 ? <Arrow key={`a${i}`} /> : null,
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
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
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
    default:
      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Heading text={scene.title} />
          <Bullets items={scene.bullets.length ? scene.bullets : []} />
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
