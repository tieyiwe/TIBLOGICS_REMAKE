import { useId } from "react";

// The Tilo Vision Scholar mark: a sunrise (a new day, looking ahead) in a
// navy medallion with an orange ring. Used on the scholarship pages, the
// learner's account, the admin and (as SEAL_SVG) the award letter. Decorative.
export const SEAL_SVG = (ringId = "tvs-ring") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="${ringId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F47C4C"/><stop offset="1" stop-color="#F9A738"/></linearGradient></defs>
<circle cx="32" cy="32" r="30" fill="url(#${ringId})"/><circle cx="32" cy="32" r="25" fill="#1B2A5E"/>
<circle cx="32" cy="32" r="22" fill="none" stroke="#F9A738" stroke-opacity=".35" stroke-width=".8" stroke-dasharray="1.6 2.4"/>
<g stroke="#F9A738" stroke-width="2.2" stroke-linecap="round"><path d="M32 15.5v4"/><path d="M20.3 20.3l2.8 2.8"/><path d="M43.7 20.3l-2.8 2.8"/><path d="M15.5 32h4"/><path d="M48.5 32h-4"/></g>
<path d="M22.5 37a9.5 9.5 0 0 1 19 0z" fill="#F9A738"/>
<path d="M16 37h32" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
<path d="M22 42.5h20" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
<path d="M27 47.5h10" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export default function ScholarSeal({ size = 56 }: { size?: number }) {
  const ring = `tvs-ring-${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id={ring} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F47C4C" />
          <stop offset="1" stopColor="#F9A738" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${ring})`} />
      <circle cx="32" cy="32" r="25" fill="#1B2A5E" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#F9A738" strokeOpacity=".35" strokeWidth=".8" strokeDasharray="1.6 2.4" />
      <g stroke="#F9A738" strokeWidth="2.2" strokeLinecap="round">
        <path d="M32 15.5v4" />
        <path d="M20.3 20.3l2.8 2.8" />
        <path d="M43.7 20.3l-2.8 2.8" />
        <path d="M15.5 32h4" />
        <path d="M48.5 32h-4" />
      </g>
      <path d="M22.5 37a9.5 9.5 0 0 1 19 0z" fill="#F9A738" />
      <path d="M16 37h32" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M22 42.5h20" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
      <path d="M27 47.5h10" stroke="#fff" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
