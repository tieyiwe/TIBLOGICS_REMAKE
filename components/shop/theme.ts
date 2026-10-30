// Same values as lib/fonts/brand.ts (the faces are loaded by the root layout);
// written out here so client components do not import next/font modules.
const SYNE = "var(--font-brand-syne), 'Syne', sans-serif";
const DM = "var(--font-brand-dm), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * The store's look, in one place: TIBLOGICS navy and orange, Syne headings,
 * DM Sans body. Every store surface (index, collection, product, success,
 * cart) reads its colours from here so they stay one family.
 *
 * Contrast (WCAG, on `bg`): ink 17:1, text 11:1, muted 7:1, orange 6.6:1.
 */
export const C = {
  bg: "#0A1420",
  surface: "#0F1E30",
  raised: "#14273F",
  navy: "#1B3A6B",
  navyDeep: "#0D1B2A",
  orange: "#F47C20",
  orangeSoft: "rgba(244,124,32,.12)",
  orangeLine: "rgba(244,124,32,.38)",
  ink: "#F5F7FA",
  text: "#C9D3E0",
  muted: "#93A3B8",
  line: "rgba(255,255,255,.08)",
  lineStrong: "rgba(255,255,255,.14)",
  ok: "#3DD6A6",
} as const;

export const FONT_HEAD = SYNE;
export const FONT_BODY = DM;

/**
 * Shared CSS for the store pages. Injected once per page in a <style> tag.
 * Motion is decoration only and stops under prefers-reduced-motion.
 */
export const STORE_CSS = `
.st-page{background:${C.bg};color:${C.ink};font-family:${DM};min-height:100vh;overflow-x:clip}
/* The public layout pads <main> under the mobile bottom nav; carry the page colour into it */
@media(max-width:639px){.st-page{margin-bottom:-76px;padding-bottom:76px}}
.st-wrap{max-width:1180px;margin:0 auto;padding-left:24px;padding-right:24px}
@media(max-width:560px){.st-wrap{padding-left:16px;padding-right:16px}}
.st-kicker{font-family:${DM};font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${C.orange}}
.st-h{font-family:${SYNE};font-weight:700;letter-spacing:-.02em;color:${C.ink};margin:0}
.st-muted{color:${C.muted}}
.st-link{color:${C.muted};text-decoration:none;transition:color .2s}
.st-link:hover{color:${C.ink}}
.st-link:focus-visible,.st-card:focus-visible,.st-btn:focus-visible,.st-chip:focus-visible{outline:2px solid ${C.orange};outline-offset:3px}

/* Cover art: always shown whole, on a quiet navy stage */
.st-stage{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:radial-gradient(90% 70% at 50% 38%, ${C.navy} 0%, ${C.navyDeep} 62%, #08111C 100%)}
.st-stage::after{content:"";position:absolute;left:18%;right:18%;bottom:7%;height:14px;border-radius:50%;
  background:radial-gradient(closest-side, rgba(0,0,0,.55), transparent);filter:blur(4px);pointer-events:none}
.st-cover{position:relative;z-index:1;aspect-ratio:17/22;border-radius:6px;overflow:hidden;
  box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 18px 36px -14px rgba(0,0,0,.7),0 4px 10px rgba(0,0,0,.35);
  transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s cubic-bezier(.16,1,.3,1)}

/* Product grid and cards */
.st-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}
@media(max-width:960px){.st-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}
@media(max-width:560px){.st-grid{gap:12px}}
.st-card{display:flex;flex-direction:column;background:${C.surface};border:1px solid ${C.line};border-radius:18px;
  overflow:hidden;text-decoration:none;color:${C.ink};transition:border-color .35s,transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s}
.st-card:hover{border-color:${C.lineStrong};transform:translateY(-4px);box-shadow:0 28px 50px -28px rgba(0,0,0,.8)}
.st-card:hover .st-cover{transform:translateY(-6px) scale(1.015);box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 30px 50px -18px rgba(0,0,0,.75),0 6px 14px rgba(0,0,0,.35)}
.st-card .st-stage{aspect-ratio:1/1.08}
.st-card .st-cover{width:64%}
.st-card-body{padding:20px 22px 22px;display:flex;flex-direction:column;flex:1;gap:6px}
.st-card-name{font-family:${SYNE};font-weight:700;font-size:1.08rem;line-height:1.3;letter-spacing:-.01em}
.st-card-tag{color:${C.muted};font-size:.86rem;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.st-card-foot{margin-top:auto;padding-top:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid ${C.line}}
.st-price{font-family:${SYNE};font-weight:700;white-space:nowrap;color:${C.ink}}
.st-view{display:inline-flex;align-items:center;gap:6px;color:${C.orange};font-size:.84rem;font-weight:700;white-space:nowrap}
.st-view svg{transition:transform .3s}
.st-card:hover .st-view svg{transform:translateX(3px)}
@media(max-width:560px){
  .st-card{border-radius:14px}
  .st-card-body{padding:12px 12px 14px;gap:4px}
  .st-card-name{font-size:.9rem}
  .st-card-tag,.st-card-spec{display:none}
  .st-card-foot{padding-top:10px;flex-wrap:wrap;gap:4px}
  .st-view-label{display:none}
  .st-badge{top:8px!important;left:8px!important;font-size:.6rem!important;padding:4px 8px!important}
}

/* Chips, buttons */
.st-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid ${C.line};border-radius:999px;padding:6px 14px;
  font-size:.8rem;font-weight:600;color:${C.text};background:transparent;cursor:pointer;font-family:${DM};text-decoration:none;transition:border-color .2s,color .2s,background .2s}
.st-chip:hover{border-color:${C.lineStrong};color:${C.ink}}
.st-chip[aria-pressed="true"]{border-color:${C.orangeLine};background:${C.orangeSoft};color:${C.ink}}
.st-spec{display:inline-flex;align-items:center;gap:6px;border:1px solid ${C.line};border-radius:8px;padding:5px 10px;font-size:.78rem;color:${C.text};white-space:nowrap}
.st-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border:none;border-radius:999px;cursor:pointer;
  font-family:${SYNE};font-weight:700;text-decoration:none;transition:transform .2s,box-shadow .2s,background .2s}
.st-btn-primary{background:${C.orange};color:#0A1420;padding:15px 28px;font-size:1rem}
.st-btn-primary:hover{transform:translateY(-1px);box-shadow:0 14px 30px -12px rgba(244,124,32,.65)}
.st-btn-primary:disabled{background:rgba(255,255,255,.08);color:${C.muted};cursor:not-allowed;transform:none;box-shadow:none}
.st-btn-ghost{background:transparent;color:${C.ink};border:1px solid ${C.lineStrong};padding:13px 24px;font-size:.95rem}
.st-btn-ghost:hover{border-color:rgba(255,255,255,.3)}

@media(prefers-reduced-motion:reduce){
  .st-card,.st-cover,.st-btn,.st-view svg{transition:none!important}
  .st-card:hover,.st-card:hover .st-cover,.st-btn-primary:hover{transform:none!important}
  .st-card:hover .st-view svg{transform:none}
}
`;

/**
 * "PDF · 46 pages · 100 prompts" (the product's fileFormat) as display chips,
 * with the counts written in the visitor's language. Anything that does not
 * match a known pattern is shown as stored.
 */
export function specChips(fileFormat: string | null | undefined, t: (k: string, v?: Record<string, string | number>) => string): string[] {
  return (fileFormat ?? "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const pages = /^(\d+)\s+pages?$/i.exec(s);
      if (pages) return t("pages.store.spec.pages", { n: pages[1] });
      const prompts = /^(\d+)\s+prompts?$/i.exec(s);
      if (prompts) return t("pages.store.spec.prompts", { n: prompts[1] });
      return s;
    });
}
