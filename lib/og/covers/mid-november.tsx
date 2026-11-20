import { CYAN, ORANGE, accent, byline, frame, seeded, stars, words } from "./october-feature";

// Covers for the mid-November 2026 AI Times articles
// (lib/blog/content/curated-mid-november.ts), in the same drawn style as the
// October ones. Rendered once to public/covers/*.png; kept here to redraw.

// ── Patch week: an envelope with a key leaking out, a shield ────────────────
export function patchWeekCover() {
  return frame(
    "linear-gradient(160deg, #07080E 0%, #1A0C12 55%, #3B0F18 100%)",
    <g>
      <defs>
        <radialGradient id="alarm2" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="1220" cy="450" r="430" fill="url(#alarm2)" />
      {/* the envelope (a .msg file) */}
      <g transform="translate(1110 380)">
        <rect x="-170" y="-110" width="340" height="230" rx="18" fill="#F8FAFC" />
        <path d="M-170 -100 L 0 30 L 170 -100" fill="none" stroke="#94A3B8" strokeWidth="8" strokeLinejoin="round" />
        <rect x="-60" y="60" width="120" height="34" rx="8" fill="#1E293B" />
        <rect x="-44" y="72" width="88" height="10" rx="5" fill={ORANGE} />
      </g>
      {/* a key slipping out of it */}
      <g transform="translate(1330 230) rotate(-28)">
        <circle r="40" fill="none" stroke="#FBBF24" strokeWidth="14" />
        <rect x="36" y="-8" width="150" height="16" rx="6" fill="#FBBF24" />
        <rect x="150" y="6" width="14" height="30" rx="4" fill="#FBBF24" />
        <rect x="118" y="6" width="14" height="22" rx="4" fill="#FBBF24" />
      </g>
      {/* dotted trail to an outside server */}
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={1270 + i * 34} cy={150 - i * 16} r="6" fill="#FCA5A5" />)}
      {/* the fix: a green shield */}
      <g transform="translate(1390 640)">
        <path d="M0 -90 L 76 -60 L 76 10 C 76 60 40 92 0 110 C -40 92 -76 60 -76 10 L -76 -60 Z" fill="#16A34A" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M-32 8 L -8 34 L 36 -18" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>,
    <>
      {words("AI TIMES · CYBERSECURITY", "Patch week", accent("One email file can leak your password. |Four fixes| to make now"), ["Outlook", "Java", "VMware"], { width: 760, size: 100 })}
      {byline()}
    </>,
  );
}

// ── Anthropic IPO: a rising candle chart and a bell ─────────────────────────
export function anthropicIpoCover() {
  const candles = [180, 210, 200, 260, 250, 330, 420];
  return frame(
    "linear-gradient(160deg, #0B0806 0%, #22160D 55%, #3D2513 100%)",
    <g>
      {stars(41, 40, 0.45)}
      {candles.map((h, i) => (
        <g key={i}>
          <line x1={990 + i * 72} y1={790 - h - 30} x2={990 + i * 72} y2={790 - h + 70} stroke="rgba(255,255,255,0.5)" strokeWidth="4" />
          <rect x={970 + i * 72} y={790 - h} width="40" height={Math.max(40, h * 0.35)} rx="6" fill={i === candles.length - 1 ? ORANGE : i % 3 === 2 ? "#F87171" : "#4ADE80"} />
        </g>
      ))}
      <line x1="940" y1="800" x2="1500" y2="800" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      {/* the opening bell */}
      <g transform="translate(1340 230)">
        <path d="M-80 60 C -80 -40 -50 -90 0 -90 C 50 -90 80 -40 80 60 L 100 80 L -100 80 Z" fill="#FBBF24" />
        <circle cx="0" cy="98" r="20" fill="#FBBF24" />
        <rect x="-10" y="-120" width="20" height="34" rx="8" fill="#FBBF24" />
        <path d="M-130 -40 Q -150 0 -130 40 M 130 -40 Q 150 0 130 40" fill="none" stroke="#FDE68A" strokeWidth="7" strokeLinecap="round" />
      </g>
    </g>,
    <>
      {words("AI TIMES · AI BUSINESS", "The biggest IPO ever", accent("Claude's maker raised |$93.5 billion.| What changes for you"), ["Anthropic", "Nasdaq: ANT", "$1.5T"], { width: 780, size: 88 })}
      {byline()}
    </>,
  );
}

// ── Nvidia week: a chip with an empty chair ─────────────────────────────────
export function nvidiaWeekCover() {
  const r = seeded(7);
  return frame(
    "linear-gradient(160deg, #050A06 0%, #0B1F12 55%, #12331C 100%)",
    <g>
      <g transform="translate(1110 420)">
        <rect x="-170" y="-170" width="340" height="340" rx="30" fill="#0F172A" stroke="#76B900" strokeWidth="6" />
        <rect x="-100" y="-100" width="200" height="200" rx="18" fill="#111827" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <rect x={-152 + i * 37} y="-200" width="12" height="30" rx="3" fill="#76B900" />
            <rect x={-152 + i * 37} y="170" width="12" height="30" rx="3" fill="#76B900" />
            <rect x="-200" y={-152 + i * 37} width="30" height="12" rx="3" fill="#76B900" />
            <rect x="170" y={-152 + i * 37} width="30" height="12" rx="3" fill="#76B900" />
          </g>
        ))}
        {Array.from({ length: 16 }, (_, i) => <rect key={`c${i}`} x={-76 + (i % 4) * 40} y={-76 + Math.floor(i / 4) * 40} width="32" height="32" rx="6" fill={r() < 0.5 ? "#76B900" : "rgba(118,185,0,0.35)"} />)}
      </g>
      {/* an empty chair */}
      <g transform="translate(1400 650)">
        <rect x="-60" y="-120" width="120" height="110" rx="20" fill="#E2E8F0" />
        <rect x="-75" y="-14" width="150" height="34" rx="12" fill="#CBD5E1" />
        <rect x="-8" y="20" width="16" height="70" fill="#94A3B8" />
        <rect x="-60" y="88" width="120" height="12" rx="6" fill="#94A3B8" />
      </g>
      {/* rising revenue arrow */}
      <path d="M900 760 L 1060 700 L 1160 720 L 1330 600" fill="none" stroke={CYAN} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1300 590 L 1336 598 L 1322 632" fill="none" stroke={CYAN} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    </g>,
    <>
      {words("AI TIMES · INDUSTRY", "The founder left. The chips kept selling.", accent("Nvidia's week and the |new chip rules| behind your cloud"), ["Nvidia", "+103%", "Export rules"], { width: 760, size: 74 })}
      {byline()}
    </>,
  );
}

// ── AI price war: price tags falling, an agent on a leash ───────────────────
export function aiPriceWarCover() {
  const tags: Array<[number, number, number, string]> = [
    [1000, 220, -12, "$10"],
    [1180, 300, 8, "$8"],
    [1050, 470, -6, "$3"],
    [1240, 520, 10, "$1.50"],
  ];
  return frame(
    "linear-gradient(160deg, #060814 0%, #11163A 55%, #1D2560 100%)",
    <g>
      {stars(23, 60, 0.6)}
      {tags.map(([x, y, rot, label], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
          <path d="M0 0 L 150 0 L 190 40 L 150 80 L 0 80 Z" fill={i === 0 ? "#475569" : i === 1 ? ORANGE : "#F8FAFC"} />
          <circle cx="160" cy="40" r="9" fill="#11163A" />
          {i === 0 && <line x1="10" y1="40" x2="140" y2="40" stroke="#F87171" strokeWidth="8" />}
        </g>
      ))}
      {/* a robot agent held by a lead */}
      <g transform="translate(1380 260)">
        <rect x="-56" y="-60" width="112" height="112" rx="36" fill="#E2E8F0" />
        <rect x="-40" y="-28" width="80" height="30" rx="15" fill="#0B1B3A" />
        <circle cx="-16" cy="-13" r="6" fill={CYAN} />
        <circle cx="16" cy="-13" r="6" fill={CYAN} />
        <path d="M0 52 C 0 120 -120 140 -170 230" fill="none" stroke="#FBBF24" strokeWidth="7" strokeDasharray="14 10" />
      </g>
      {/* falling arrow */}
      <path d="M1460 470 L 1460 700" stroke="#4ADE80" strokeWidth="12" strokeLinecap="round" />
      <path d="M1420 660 L 1460 712 L 1500 660" fill="none" stroke="#4ADE80" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    </g>,
    <>
      {words("AI TIMES · TOOLS", "Cheaper AI, riskier agents", accent("New Claude, GPT and Gemini models, and |how to choose| without getting burned"), ["GPT-6.2", "Gemini 4", "Claude 5.2"], { width: 780, size: 84 })}
      {byline()}
    </>,
  );
}

// ── Africa in November: a speech bubble over a continent of nodes ───────────
export function africaAiNovemberCover() {
  const r = seeded(29);
  const nodes = Array.from({ length: 22 }, () => [1000 + r() * 420, 230 + r() * 470] as const);
  return frame(
    "linear-gradient(160deg, #0B0703 0%, #2A1606 55%, #4A2208 100%)",
    <g>
      <defs>
        <radialGradient id="sun2" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.5" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="1220" cy="460" r="440" fill="url(#sun2)" />
      {nodes.map(([x, y], i) => nodes.slice(i + 1, i + 3).map(([x2, y2], j) => <line key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />))}
      {nodes.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r={i % 5 === 0 ? 11 : 6} fill={i % 5 === 0 ? ORANGE : "#FDE68A"} />)}
      {/* a court gavel */}
      <g transform="translate(1400 700) rotate(-30)">
        <rect x="-80" y="-24" width="160" height="48" rx="14" fill="#B45309" />
        <rect x="-12" y="24" width="24" height="140" rx="10" fill="#92400E" />
      </g>
    </g>,
    <>
      {[["isiZulu", 1290, 150], ["Kiswahili", 990, 600], ["Sesotho", 1340, 420]].map(([t, x, y]) => (
        <div key={t as string} style={{ position: "absolute", left: x as number, top: y as number, display: "flex", padding: "10px 20px", borderRadius: 22, background: "#FFFFFF", color: "#0F172A", fontSize: 28, fontWeight: 700 }}>
          {t}
        </div>
      ))}
      {words("AI TIMES · AFRICA", "Not just a data centre host", accent("Silicon Valley pitch, a |court deadline| and money for compute"), ["South Africa", "Kenya", "Zimbabwe"], { width: 780, size: 84 })}
      {byline()}
    </>,
  );
}

export const MID_NOVEMBER_COVERS = {
  "patch-week": patchWeekCover,
  "anthropic-ipo": anthropicIpoCover,
  "nvidia-week": nvidiaWeekCover,
  "ai-price-war": aiPriceWarCover,
  "africa-ai-november": africaAiNovemberCover,
} as const;
