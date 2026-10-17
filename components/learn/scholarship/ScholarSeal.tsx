import { useId } from "react";

// The Tilo Vision Scholar mark: a magnifying glass on a rising line (focus,
// insight and growth) in a navy medallion with an orange ring. Used on the
// scholarship pages, the learner's account, the admin and (as SEAL_SVG) the
// award letter. Decorative.
export const SEAL_SVG = (id = "tvs") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="${id}-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F47C4C"/><stop offset="1" stop-color="#F9A738"/></linearGradient>
<radialGradient id="${id}-lens" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#2E4A8F"/><stop offset="1" stop-color="#16244F"/></radialGradient></defs>
<circle cx="32" cy="32" r="30" fill="url(#${id}-ring)"/><circle cx="32" cy="32" r="25" fill="#1B2A5E"/>
<path d="M36.6 36.6 L46.5 46.5" stroke="#F9A738" stroke-width="5.2" stroke-linecap="round"/>
<path d="M36.6 36.6 L39.2 39.2" stroke="#fff" stroke-width="5.6" stroke-linecap="round"/>
<circle cx="28.5" cy="28.5" r="11.5" fill="url(#${id}-lens)" stroke="#fff" stroke-width="3"/>
<path d="M21.5 24.5 A8 8 0 0 1 26 20.8" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M21.8 33 L26 29 L29 31.4 L34.6 25.2" stroke="#F9A738" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M31.4 25 L34.8 24.9 L34.7 28.3" stroke="#F9A738" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function ScholarSeal({ size = 56 }: { size?: number }) {
  const id = `tvs${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F47C4C" />
          <stop offset="1" stopColor="#F9A738" />
        </linearGradient>
        <radialGradient id={`${id}-lens`} cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#2E4A8F" />
          <stop offset="1" stopColor="#16244F" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-ring)`} />
      <circle cx="32" cy="32" r="25" fill="#1B2A5E" />
      <path d="M36.6 36.6 L46.5 46.5" stroke="#F9A738" strokeWidth="5.2" strokeLinecap="round" />
      <path d="M36.6 36.6 L39.2 39.2" stroke="#fff" strokeWidth="5.6" strokeLinecap="round" />
      <circle cx="28.5" cy="28.5" r="11.5" fill={`url(#${id}-lens)`} stroke="#fff" strokeWidth="3" />
      <path d="M21.5 24.5 A8 8 0 0 1 26 20.8" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M21.8 33 L26 29 L29 31.4 L34.6 25.2" stroke="#F9A738" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31.4 25 L34.8 24.9 L34.7 28.3" stroke="#F9A738" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
