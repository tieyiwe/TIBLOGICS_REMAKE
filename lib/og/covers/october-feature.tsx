import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og/brand-card";

// Covers and illustrations for the mid-October 2026 AI Times features
// (lib/blog/content/curated-mid-october.ts), drawn in code like the Starlink
// cover. Rendered once to PNG files in public/covers/ (the articles point at
// the files), kept here so they can be redrawn. No logos or photos: the
// vehicles are our own illustrations.

const W = 1600;
const H = 900;
const ORANGE = "#F47C20";
const BLUE = "#60A5FA";
const CYAN = "#67E8F9";

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function stars(seed: number, n = 120, maxY = 0.75) {
  const r = seeded(seed);
  return Array.from({ length: n }, (_, i) => (
    <circle key={`st${i}`} cx={r() * W} cy={r() * H * maxY} r={r() < 0.85 ? 1.2 : 2.2} fill="#FFFFFF" opacity={0.2 + r() * 0.6} />
  ));
}

/** The low, wide supercar we draw for the Roadster (side view, nose right). */
function roadster(fill = "#E2E8F0") {
  return (
    <g>
      {/* body: short rear deck, low fastback roof, long sloping nose */}
      <path d="M-228 6 C -230 -10 -222 -22 -200 -26 L -150 -32 C -110 -60 -40 -74 10 -66 C 50 -60 90 -40 130 -26 L 214 -14 C 232 -11 238 2 228 12 L 210 18 L -214 18 C -226 18 -229 13 -228 6 Z" fill={fill} />
      {/* glass */}
      <path d="M-128 -34 C -96 -56 -36 -64 6 -58 C 40 -53 70 -40 96 -30 L -128 -30 Z" fill="#0B1B3A" opacity="0.9" />
      {/* light bars and sill */}
      <rect x="196" y="-10" width="30" height="5" rx="2.5" fill="#F8FAFC" />
      <rect x="-226" y="-14" width="22" height="5" rx="2.5" fill="#EF4444" />
      <path d="M-190 12 L 190 12" stroke="#94A3B8" strokeWidth="5" />
      {/* wheels */}
      <circle cx="-138" cy="18" r="34" fill="#0F172A" />
      <circle cx="-138" cy="18" r="18" fill="#475569" />
      <circle cx="146" cy="18" r="34" fill="#0F172A" />
      <circle cx="146" cy="18" r="18" fill="#475569" />
    </g>
  );
}

/** A cold-gas plume: a soft cone of white-cyan gas. */
function plume(x: number, y: number, angle: number, len = 120, k = "p") {
  return (
    <g key={k} transform={`translate(${x} ${y}) rotate(${angle})`}>
      <polygon points={`0,-8 0,8 ${len},${len * 0.32} ${len},${-len * 0.32}`} fill="url(#gas)" />
    </g>
  );
}

const GAS_DEF = (
  <linearGradient id="gas" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
    <stop offset="35%" stopColor={CYAN} stopOpacity="0.6" />
    <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
  </linearGradient>
);

function words(kicker: string, headline: string, sub: ReactNode, tags: string[], opts: { width?: number; size?: number } = {}) {
  return (
    <div style={{ position: "absolute", left: 90, top: 205, display: "flex", flexDirection: "column", width: opts.width ?? 820 }}>
      <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: ORANGE }}>{kicker}</div>
      <div style={{ display: "flex", marginTop: 18, fontSize: opts.size ?? 82, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, color: "#FFFFFF" }}>{headline}</div>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: 20, fontSize: 32, lineHeight: 1.3, color: "rgba(255,255,255,0.85)" }}>{sub}</div>
      <div style={{ display: "flex", gap: 14, marginTop: 28 }}>
        {tags.map((t) => (
          <div key={t} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, border: "2px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Words with some in orange: "plain |orange| plain". */
function accent(text: string) {
  return text.split("|").map((part, i) =>
    part
      .split(" ")
      .filter(Boolean)
      .map((w, j) => (
        <span key={`${i}-${j}`} style={{ marginRight: 9, fontWeight: i % 2 ? 700 : 400, color: i % 2 ? ORANGE : "rgba(255,255,255,0.85)" }}>
          {w}
        </span>
      )),
  );
}

const byline = (name = "AI Times", sub = "by TIBLOGICS") => (
  <div style={{ position: "absolute", left: 90, bottom: 60, display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ display: "flex", width: 10, height: 44, borderRadius: 10, background: ORANGE }} />
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#FFFFFF" }}>{name}</div>
      <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.6)" }}>{sub}</div>
    </div>
  </div>
);

async function frame(bg: string, art: ReactNode, text: ReactNode) {
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", overflow: "hidden", background: bg, fontFamily: "Instrument Sans" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>{GAS_DEF}</defs>
          {art}
        </svg>
        {text}
      </div>
    ),
    { width: W, height: H, fonts, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}

// ── 1. The Roadster flies ────────────────────────────────────────────────

export function roadsterFlightCover() {
  const truck = (x: number) => <polygon key="ct" points={`${x},790 ${x},742 ${x + 60},722 ${x + 175},748 ${x + 175},790`} fill="#475569" />;
  const semi = (x: number) => (
    <g key="semi">
      <rect x={x} y="712" width="170" height="78" rx="6" fill="#3F4B5F" />
      <path d={`M${x + 178} 790 L ${x + 178} 722 C ${x + 200} 716 ${x + 228} 724 ${x + 238} 744 L ${x + 238} 790 Z`} fill="#475569" />
    </g>
  );
  const low = (x: number, k: string) => <path key={k} d={`M${x} 790 L ${x} 768 C ${x + 30} 750 ${x + 90} 748 ${x + 130} 764 L ${x + 140} 790 Z`} fill="#3F4B5F" />;
  return frame(
    "linear-gradient(180deg, #02040B 0%, #0A1638 55%, #3B1F3A 82%, #7C2D12 100%)",
    <g>
      {stars(11, 120, 0.6)}
      <defs>
        <radialGradient id="dusk" cx="0.5" cy="1" r="0.6">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.55" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="underglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={CYAN} stopOpacity="0.45" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="1200" cy="900" rx="900" ry="260" fill="url(#dusk)" />
      {/* ground */}
      <rect x="0" y="790" width={W} height="110" fill="#0F172A" />
      <rect x="0" y="790" width={W} height="3" fill={ORANGE} opacity="0.5" />
      {/* the curved ramp it left from */}
      <path d="M720 790 C 860 790 930 740 960 650" fill="none" stroke="#64748B" strokeWidth="16" strokeLinecap="round" />
      {/* the line of vehicles it cleared */}
      {low(1020, "l1")}
      {truck(1175)}
      {semi(1370)}
      {/* jump arc */}
      <path d="M960 650 C 1030 470 1260 400 1500 600" fill="none" stroke={ORANGE} strokeWidth="4" strokeDasharray="10 14" opacity="0.85" />
      {/* motion streaks */}
      {[0, 1, 2, 3].map((i) => <line key={`m${i}`} x1={930 + i * 18} y1={520 + i * 22} x2={1010 + i * 18} y2={470 + i * 22} stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />)}
      {/* the car over the line, thrusters firing down and back */}
      <ellipse cx="1250" cy="520" rx="300" ry="120" fill="url(#underglow)" />
      <g transform="translate(1250 470) rotate(-10) scale(1.1)">
        {plume(-150, 30, 105, 170, "a")}
        {plume(150, 30, 80, 170, "b")}
        {plume(-226, -2, 175, 130, "c")}
        {roadster()}
      </g>
    </g>,
    <>
      {words("AI TIMES · ADVANCED TECH", "0 to 60 in 0.81 seconds. Then it flew.", accent("Tesla's new Roadster, with |SpaceX| cold-gas thrusters"), ["Tesla", "SpaceX", "Roadster"], { width: 760, size: 80 })}
      {byline()}
    </>,
  );
}

// ── 2. Science fiction shows up early ────────────────────────────────────

export function scifiRealityCover() {
  return frame(
    "linear-gradient(160deg, #03060F 0%, #071433 55%, #0B1B3A 100%)",
    <g>
      {stars(23, 150)}
      <defs>
        <radialGradient id="earth2" cx="0.45" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0B1B3A" />
        </radialGradient>
      </defs>
      <circle cx="1250" cy="1500" r="900" fill="#38BDF8" opacity="0.18" />
      <circle cx="1250" cy="1500" r="860" fill="url(#earth2)" />
      <ellipse cx="1250" cy="900" rx="560" ry="520" fill="none" stroke="#93C5FD" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="6 10" />
      {/* Starship in orbit: steel body, nose, forward and aft flaps */}
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="45%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      <g transform="translate(1170 250) rotate(64)">
        <path d="M-30 -110 C -30 -170 -12 -205 0 -212 C 12 -205 30 -170 30 -110 Z" fill="url(#steel)" />
        <rect x="-30" y="-112" width="60" height="290" fill="url(#steel)" />
        <path d="M-30 -120 L -54 -96 L -54 -70 L -30 -78 Z" fill="#475569" />
        <path d="M30 -120 L 54 -96 L 54 -70 L 30 -78 Z" fill="#475569" />
        <path d="M-30 120 L -62 150 L -62 178 L -30 170 Z" fill="#475569" />
        <path d="M30 120 L 62 150 L 62 178 L 30 170 Z" fill="#475569" />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="-30" x2="30" y1={-80 + i * 52} y2={-80 + i * 52} stroke="#CBD5E1" strokeOpacity="0.6" strokeWidth="2" />)}
      </g>
      {/* satellites released */}
      {[[1340, 330], [1400, 380], [1455, 420], [1500, 470]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(-20)`}>
          <rect x="-16" y="-4" width="12" height="8" rx="2" fill={BLUE} />
          <rect x="4" y="-4" width="12" height="8" rx="2" fill={BLUE} />
          <rect x="-4" y="-6" width="8" height="12" rx="2" fill="#E2E8F0" />
        </g>
      ))}
      {/* the flying car, small, over the horizon */}
      <g transform="translate(1040 610) rotate(-14) scale(0.42)">
        {plume(-150, 26, 110, 120, "e")}
        {plume(150, 26, 70, 120, "f")}
        {roadster()}
      </g>
      {/* a humanoid robot head, low right */}
      <g transform="translate(1480 640)">
        <rect x="-46" y="-56" width="92" height="96" rx="34" fill="#F1F5F9" />
        <rect x="-34" y="-30" width="68" height="26" rx="13" fill="#0B1B3A" />
        <rect x="-22" y="-22" width="44" height="6" rx="3" fill={CYAN} />
        <rect x="-30" y="40" width="60" height="40" rx="12" fill="#CBD5E1" />
      </g>
    </g>,
    <>
      {words("AI TIMES · ADVANCED TECH", "Science fiction showed up early", accent("Orbit, |flying cars| and phones that talk to space, in 18 days"), ["SpaceX", "Tesla", "Starship"], { width: 800 })}
      {byline()}
    </>,
  );
}

// ── 3. Grok Bot vs Muse vs Dots ──────────────────────────────────────────

export function agentsShowdownCover() {
  const card = (x: number, y: number, w: number, h: number, name: string, note: string, hot = false) => (
    <div
      key={name}
      style={{
        position: "absolute", left: x, top: y, width: w, height: h, display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: 28, borderRadius: 28, border: hot ? `5px solid ${ORANGE}` : "2px solid rgba(255,255,255,0.25)",
        background: hot ? "linear-gradient(160deg, rgba(244,124,32,0.28), rgba(11,27,58,0.9))" : "rgba(255,255,255,0.06)",
      }}
    >
      {hot ? <div style={{ display: "flex", position: "absolute", top: 22, left: 26, padding: "6px 16px", borderRadius: 999, background: ORANGE, fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>PRO PICK</div> : null}
      <div style={{ display: "flex", fontSize: hot ? 56 : 40, fontWeight: 700, color: "#FFFFFF" }}>{name}</div>
      <div style={{ display: "flex", marginTop: 6, fontSize: hot ? 24 : 20, color: "rgba(255,255,255,0.7)" }}>{note}</div>
    </div>
  );
  return frame(
    "linear-gradient(160deg, #050814 0%, #0B1638 60%, #172554 100%)",
    <g>
      {stars(37, 70)}
      <defs>
        <radialGradient id="pick" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.45" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="1235" cy="275" rx="420" ry="280" fill="url(#pick)" />
      {/* connection lines between the agents */}
      <path d="M1160 330 L 1290 600 L 1010 650 Z" fill="none" stroke={BLUE} strokeOpacity="0.25" strokeWidth="2" strokeDasharray="6 10" />
    </g>,
    <>
      {card(1000, 110, 470, 330, "Grok Bot", "SpaceXAI · built for serious work", true)}
      {card(1000, 480, 225, 230, "Muse", "Meta · friendly")}
      {card(1245, 480, 225, 230, "Dots", "OpenAI · ChatGPT")}
      {words("AI TIMES · AI AGENTS", "Grok Bot vs Muse vs Dots", accent("Why |Tieyiwe Bassole| says only one is built for the enterprise"), ["xAI", "Meta", "OpenAI"], { width: 820, size: 80 })}
      {byline("Tieyiwe Bassole", "Founder, TIBLOGICS")}
    </>,
  );
}

// ── 4. Design for agents ─────────────────────────────────────────────────

export function designForAgentsCover() {
  const r = seeded(51);
  return frame(
    "linear-gradient(160deg, #04060E 0%, #0C1A3D 60%, #142B63 100%)",
    <g>
      {/* a web page wireframe */}
      <rect x="1000" y="150" width="480" height="560" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <rect x="1000" y="150" width="480" height="54" rx="24" fill="rgba(255,255,255,0.1)" />
      {[0, 1, 2].map((i) => <circle key={i} cx={1036 + i * 26} cy="177" r="7" fill="rgba(255,255,255,0.45)" />)}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={`l${i}`} x="1040" y={250 + i * 66} width={200 + (i % 3) * 70} height="18" rx="9" fill="rgba(255,255,255,0.18)" />
      ))}
      {/* many small agent cursors converging on the page */}
      {Array.from({ length: 34 }, (_, i) => {
        const x = 900 + r() * 640;
        const y = 90 + r() * 700;
        return (
          <g key={`c${i}`} transform={`translate(${x} ${y}) rotate(${-20 + r() * 40})`} opacity={0.45 + r() * 0.5}>
            <path d="M0 0 L 0 26 L 7 19 L 12 30 L 17 28 L 12 17 L 21 17 Z" fill={i % 4 === 0 ? ORANGE : CYAN} />
          </g>
        );
      })}
      {/* one human cursor */}
      <g transform="translate(1300 600)">
        <path d="M0 0 L 0 40 L 11 29 L 19 46 L 26 43 L 18 26 L 33 26 Z" fill="#FFFFFF" />
      </g>
    </g>,
    <>
      {words("AI TIMES · FOUNDER'S TAKE", "Your next customer won't have eyes", accent("Why |Tieyiwe Bassole| says we must start designing for AI agents"), ["AI agents", "MCP", "Design"], { width: 820, size: 80 })}
      {byline("Tieyiwe Bassole", "Founder, TIBLOGICS")}
    </>,
  );
}

// ── 5. Kind words for Claude? ────────────────────────────────────────────

export function kindWordsCover() {
  const r = seeded(77);
  // A face drawn as a neural network: nodes and links in a head silhouette.
  const nodes = Array.from({ length: 46 }, () => {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    return [1250 + Math.cos(a) * 230 * d, 420 + Math.sin(a) * 280 * d] as [number, number];
  });
  const links: Array<[number, number]> = [];
  nodes.forEach((p, i) => {
    nodes.forEach((q, j) => {
      if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 120) links.push([i, j]);
    });
  });
  return frame(
    "linear-gradient(160deg, #0A0612 0%, #1A1036 55%, #2A1B4F 100%)",
    <g>
      {stars(91, 60)}
      <defs>
        <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.35" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="1250" cy="420" r="420" fill="url(#halo)" />
      {links.map(([i, j], k) => (
        <line key={`k${k}`} x1={nodes[i][0]} y1={nodes[i][1]} x2={nodes[j][0]} y2={nodes[j][1]} stroke="#C4B5FD" strokeOpacity="0.35" strokeWidth="1.6" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={`n${i}`} cx={x} cy={y} r={i % 7 === 0 ? 7 : 4} fill={i % 7 === 0 ? ORANGE : "#E9D5FF"} />
      ))}
      {/* a speech bubble with a heart, and code brackets answering it */}
      <g transform="translate(930 640)">
        <rect x="0" y="0" width="190" height="120" rx="30" fill="#FFFFFF" />
        <polygon points="40,118 30,160 80,118" fill="#FFFFFF" />
        <path d="M95 92 C 50 62 52 30 76 30 C 88 30 95 40 95 46 C 95 40 102 30 114 30 C 138 30 140 62 95 92 Z" fill="#F43F5E" />
      </g>
      <g transform="translate(1330 660)">
        <rect x="0" y="0" width="210" height="110" rx="28" fill="#0B1B3A" stroke="#C4B5FD" strokeWidth="3" />
        <path d="M70 30 L 45 55 L 70 80" fill="none" stroke={CYAN} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M140 30 L 165 55 L 140 80" fill="none" stroke={CYAN} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="115" y1="26" x2="95" y2="84" stroke={CYAN} strokeWidth="9" strokeLinecap="round" />
      </g>
    </g>,
    <>
      {words("AI TIMES · FOUNDER'S TAKE", "Be kind to the machine?", accent("Why |Tieyiwe Bassole| says AI is still code running code"), ["Anthropic", "Claude", "AI ethics"], { width: 760, size: 84 })}
      {byline("Tieyiwe Bassole", "Founder, TIBLOGICS")}
    </>,
  );
}

// ── Roadster physics illustrations (inside the article) ──────────────────

const tag = (x: number, y: number, text: string, color = "#FFFFFF", size = 24, k = text) => (
  <div key={k} style={{ position: "absolute", left: x, top: y, display: "flex", fontSize: size, fontWeight: 700, color }}>{text}</div>
);

function panel(title: string, body: ReactNode, art: ReactNode, labels: ReactNode = null, bg = "linear-gradient(160deg, #0B1B3A 0%, #13285A 100%)") {
  return frame(bg, art, (
    <>
    {labels}
    <div style={{ position: "absolute", left: 80, top: 70, display: "flex", flexDirection: "column", width: 640 }}>
      <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: ORANGE }}>THE PHYSICS</div>
      <div style={{ display: "flex", marginTop: 14, fontSize: 60, fontWeight: 700, lineHeight: 1.05, color: "#FFFFFF" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 30, lineHeight: 1.4, color: "rgba(255,255,255,0.85)" }}>{body}</div>
      <div style={{ display: "flex", marginTop: 30, fontSize: 20, color: "rgba(255,255,255,0.5)" }}>AI Times by TIBLOGICS · illustration, not to scale</div>
    </div>
    </>
  ));
}

const line = (t: ReactNode, k: string) => <div key={k} style={{ display: "flex", marginBottom: 12 }}>{t}</div>;

/** Why 0.81 s needs more than tyres. */
export function roadsterGripDiagram() {
  const bar = (x: number, h: number, color: string, k: string) => <rect key={k} x={x} y={760 - h} width="150" height={h} rx="14" fill={color} />;
  const g = 150; // pixels per g
  return panel(
    "Why 0.81 seconds needs more than tyres",
    [
      line("0 to 60 mph in 0.81 s averages about 3.4 g.", "a"),
      line("Road tyres alone top out near 1 to 1.2 g.", "b"),
      line("A fan pulling the car down with 2 g triples the grip.", "c"),
    ],
    <g>
      <line x1="840" y1="760" x2="1530" y2="760" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      {[1, 2, 3].map((n) => (
        <g key={n}>
          <line x1="840" y1={760 - n * g} x2="1530" y2={760 - n * g} stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="6 8" />
        </g>
      ))}
      {bar(880, 1.15 * g, "#64748B", "t")}
      {bar(1100, 3.3 * g, CYAN, "f")}
      {bar(1320, 3.4 * g, ORANGE, "r")}
    </g>,
    <>
      {tag(790, 600, "1 g", "rgba(255,255,255,0.5)", 20)}
      {tag(790, 450, "2 g", "rgba(255,255,255,0.5)", 20)}
      {tag(790, 300, "3 g", "rgba(255,255,255,0.5)", 20)}
      {tag(912, 545, "1.1 g", "#FFFFFF", 30)}
      {tag(1132, 200, "3.3 g", "#FFFFFF", 30)}
      {tag(1352, 185, "3.4 g", "#FFFFFF", 30)}
      <div style={{ position: "absolute", left: 870, top: 780, width: 680, display: "flex", fontSize: 21, color: "rgba(255,255,255,0.8)" }}>
        <div style={{ display: "flex", width: 220 }}>Tyres alone</div>
        <div style={{ display: "flex", width: 220 }}>Tyres + 2 g fan</div>
        <div style={{ display: "flex", width: 220 }}>The 0.81 s run</div>
      </div>
    </>,
  );
}

/** Upside down on the ramp, then a thruster hop. */
export function roadsterThrustDiagram() {
  return panel(
    "Hanging upside down, then a hop",
    [
      line("Upside down, gravity pulls 1 g away from the ramp.", "a"),
      line("The fan's 2 g suction wins, so the car stays on.", "b"),
      line("Lifting about 2 tonnes takes about 20 kN of thrust: tens of kilograms of air a second. Seconds of flight, not minutes.", "c"),
    ],
    <g>
      {/* loop ramp */}
      <path d="M900 800 C 900 520 1080 300 1260 300 C 1440 300 1520 470 1520 600" fill="none" stroke="#475569" strokeWidth="22" />
      {/* car upside down at the top */}
      <g transform="translate(1250 326) rotate(180) scale(0.55)">{roadster()}</g>
      {/* arrows: gravity down, suction up */}
      <line x1="1250" y1="400" x2="1250" y2="520" stroke="#F87171" strokeWidth="10" />
      <polygon points="1230,515 1270,515 1250,550" fill="#F87171" />
      <line x1="1300" y1="420" x2="1300" y2="300" stroke={CYAN} strokeWidth="10" />
      <polygon points="1280,305 1320,305 1300,270" fill={CYAN} />
      <line x1="1350" y1="420" x2="1350" y2="300" stroke={CYAN} strokeWidth="10" />
      <polygon points="1330,305 1370,305 1350,270" fill={CYAN} />
      {/* the hop, lower left */}
      <g transform="translate(1000 680) rotate(-8) scale(0.4)">
        {plume(-150, 26, 100, 140, "h1")}
        {plume(150, 26, 80, 140, "h2")}
        {roadster()}
      </g>
    </g>,
    <>
      {tag(1090, 470, "1 g gravity", "#F87171", 24)}
      {tag(1380, 250, "2 g fan suction", CYAN, 24)}
      {tag(930, 790, "cold-gas hop", CYAN, 24)}
    </>,
  );
}

export const OCTOBER_FEATURE_COVERS = {
  "roadster-flight": roadsterFlightCover,
  "scifi-reality": scifiRealityCover,
  "agents-showdown": agentsShowdownCover,
  "design-for-agents": designForAgentsCover,
  "kind-words": kindWordsCover,
  "roadster-grip": roadsterGripDiagram,
  "roadster-thrust": roadsterThrustDiagram,
} as const;
