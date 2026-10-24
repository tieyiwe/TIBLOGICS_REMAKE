import { CYAN, ORANGE, accent, byline, frame, seeded, stars, words } from "./october-feature";

// Covers for the late-October 2026 AI Times articles
// (lib/blog/content/curated-late-october.ts), in the same drawn style as the
// mid-October ones. Rendered once to public/covers/*.png; kept here to redraw.

// ── PHP2Shell ───────────────────────────────────────────────────────────────
export function php2shellCover() {
  const lines = [180, 260, 140, 300, 220, 120, 280, 200];
  return frame(
    "linear-gradient(160deg, #0A0507 0%, #1F0A10 55%, #3A0D16 100%)",
    <g>
      <defs>
        <radialGradient id="alarm" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="1230" cy="430" r="430" fill="url(#alarm)" />
      {/* a server code window */}
      <rect x="960" y="150" width="520" height="560" rx="22" fill="#120A0D" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      <rect x="960" y="150" width="520" height="50" rx="22" fill="rgba(255,255,255,0.08)" />
      {["#EF4444", "#F59E0B", "#22C55E"].map((c, i) => <circle key={c} cx={992 + i * 24} cy="175" r="7" fill={c} />)}
      {lines.map((w, i) => (
        <rect key={i} x={1000 + (i % 3) * 24} y={232 + i * 54} width={w} height="16" rx="8" fill={i === 4 ? "#EF4444" : "rgba(255,255,255,0.2)"} />
      ))}
      {/* the crack through the code */}
      <path d="M1180 205 L 1150 300 L 1205 350 L 1160 440 L 1215 500 L 1175 600 L 1210 705" fill="none" stroke="#FCA5A5" strokeWidth="5" strokeLinejoin="round" />
      {/* the patch: a shield */}
      <g transform="translate(1370 560)">
        <path d="M0 -90 L 76 -60 L 76 10 C 76 60 40 92 0 110 C -40 92 -76 60 -76 10 L -76 -60 Z" fill="#16A34A" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M-32 8 L -8 34 L 36 -18" fill="none" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>,
    <>
      {words("AI TIMES · CYBERSECURITY", "Patch PHP today", accent("AI found two critical flaws in the code behind |most websites|"), ["PHP", "WordPress", "Security"], { width: 780, size: 92 })}
      {byline()}
    </>,
  );
}

// ── Tesla Q3: robots late, robotaxis on time ────────────────────────────────
export function teslaQ3Cover() {
  const bars = [210, 250, 230, 300, 280, 360];
  return frame(
    "linear-gradient(160deg, #04070F 0%, #0C1A3D 60%, #16295C 100%)",
    <g>
      {stars(5, 60, 0.5)}
      {/* a rising chart */}
      {bars.map((h, i) => <rect key={i} x={960 + i * 82} y={760 - h} width="58" height={h} rx="10" fill={i === bars.length - 1 ? ORANGE : "rgba(96,165,250,0.55)"} />)}
      <line x1="940" y1="760" x2="1480" y2="760" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      {/* robot head (late) with a clock */}
      <g transform="translate(1080 250)">
        <rect x="-62" y="-70" width="124" height="128" rx="44" fill="#F1F5F9" />
        <rect x="-46" y="-36" width="92" height="34" rx="17" fill="#0B1B3A" />
        <rect x="-30" y="-26" width="60" height="8" rx="4" fill={CYAN} />
        <circle cx="74" cy="-74" r="34" fill="#0B1B3A" stroke="#FBBF24" strokeWidth="5" />
        <line x1="74" y1="-74" x2="74" y2="-96" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
        <line x1="74" y1="-74" x2="90" y2="-66" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* a small driverless pod (on time) */}
      <g transform="translate(1330 300)">
        <path d="M-90 20 C -86 -20 -50 -44 0 -46 C 50 -44 86 -20 90 20 L 90 30 L -90 30 Z" fill="#E2E8F0" />
        <path d="M-60 -6 C -48 -30 -20 -36 0 -36 C 20 -36 48 -30 60 -6 Z" fill="#0B1B3A" />
        <circle cx="-54" cy="32" r="18" fill="#0F172A" />
        <circle cx="54" cy="32" r="18" fill="#0F172A" />
        <circle cx="0" cy="-70" r="16" fill="#22C55E" />
        <path d="M-7 -70 L -2 -64 L 8 -76" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      </g>
    </g>,
    <>
      {words("AI TIMES · ADVANCED TECH", "Robots late. Robotaxis on time.", accent("What |Tesla's Q3| really said about Optimus and Cybercab"), ["Tesla", "Optimus", "Cybercab"], { width: 800, size: 80 })}
      {byline()}
    </>,
  );
}

// ── Africa's AI week ────────────────────────────────────────────────────────
export function africaAiWeekCover() {
  const r = seeded(13);
  return frame(
    "linear-gradient(160deg, #0B0703 0%, #2A1606 55%, #4A2208 100%)",
    <g>
      <defs>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.55" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="1230" cy="420" r="440" fill="url(#sun)" />
      {/* a GPU chip */}
      <g transform="translate(1110 330)">
        <rect x="-120" y="-120" width="240" height="240" rx="26" fill="#1E293B" stroke="#FBBF24" strokeWidth="4" />
        <rect x="-70" y="-70" width="140" height="140" rx="14" fill="#0F172A" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <rect x={-100 + i * 32} y="-146" width="10" height="26" rx="3" fill="#FBBF24" />
            <rect x={-100 + i * 32} y="120" width="10" height="26" rx="3" fill="#FBBF24" />
            <rect x="-146" y={-100 + i * 32} width="26" height="10" rx="3" fill="#FBBF24" />
            <rect x="120" y={-100 + i * 32} width="26" height="10" rx="3" fill="#FBBF24" />
          </g>
        ))}
        {Array.from({ length: 16 }, (_, i) => <circle key={`d${i}`} cx={-48 + (i % 4) * 32} cy={-48 + Math.floor(i / 4) * 32} r="6" fill={r() < 0.5 ? CYAN : ORANGE} />)}
      </g>
      {/* a ballot box */}
      <g transform="translate(1380 600)">
        <rect x="-80" y="-50" width="160" height="120" rx="12" fill="#F8FAFC" />
        <rect x="-50" y="-58" width="100" height="14" rx="5" fill="#0F172A" />
        <path d="M-26 6 L -6 28 L 32 -16" fill="none" stroke="#16A34A" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>,
    <>
      {/* speech bubbles in three African languages */}
      {[["Habari!", 1320, 140], ["Sannu!", 1400, 300], ["Molo!", 930, 560]].map(([t, x, y]) => (
        <div key={t as string} style={{ position: "absolute", left: x as number, top: y as number, display: "flex", padding: "10px 20px", borderRadius: 22, background: "#FFFFFF", color: "#0F172A", fontSize: 28, fontWeight: 700 }}>
          {t}
        </div>
      ))}
      {words("AI TIMES · AFRICA", "Africa's big AI week", accent("Rented GPUs, a |paused law| and guarded elections"), ["World Bank", "Kenya", "Nigeria"], { width: 780, size: 88 })}
      {byline()}
    </>,
  );
}

// ── Anthropic's draft AI bill ───────────────────────────────────────────────
export function anthropicBillCover() {
  return frame(
    "linear-gradient(160deg, #06070C 0%, #151A2E 55%, #23284A 100%)",
    <g>
      {stars(29, 50, 0.5)}
      {/* a court column and a gavel */}
      <g transform="translate(1060 460)">
        <rect x="-110" y="-200" width="220" height="30" rx="6" fill="#CBD5E1" />
        {[-80, -27, 27, 80].map((x) => <rect key={x} x={x - 14} y="-170" width="28" height="240" rx="6" fill="#E2E8F0" />)}
        <rect x="-130" y="70" width="260" height="34" rx="6" fill="#CBD5E1" />
      </g>
      <g transform="translate(1330 520) rotate(-28)">
        <rect x="-110" y="-30" width="220" height="60" rx="18" fill="#B45309" />
        <rect x="-16" y="30" width="32" height="200" rx="12" fill="#92400E" />
      </g>
      {/* a big stop button */}
      <g transform="translate(1370 230)">
        <circle r="96" fill="#7F1D1D" />
        <circle r="78" fill="#DC2626" />
        <rect x="-26" y="-26" width="52" height="52" rx="8" fill="#FFFFFF" />
      </g>
    </g>,
    <>
      {words("AI TIMES · AI POLICY", "A law with a stop button", accent("What |Anthropic's| draft AI bill would really do"), ["Anthropic", "AI law", "Congress"], { width: 760, size: 86 })}
      {byline()}
    </>,
  );
}

export const LATE_OCTOBER_COVERS = {
  php2shell: php2shellCover,
  "tesla-q3": teslaQ3Cover,
  "africa-ai-week": africaAiWeekCover,
  "anthropic-bill": anthropicBillCover,
} as const;

