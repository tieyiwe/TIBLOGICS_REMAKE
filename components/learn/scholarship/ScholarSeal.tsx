// The Tilo Vision Scholar mark: a navy medallion with an orange ring, used on
// the scholarship pages, the learner's account and the admin. Decorative.
export default function ScholarSeal({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="tvs-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F47C4C" />
          <stop offset="1" stopColor="#F9A738" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#tvs-ring)" />
      <circle cx="32" cy="32" r="25" fill="#1B2A5E" />
      <circle cx="32" cy="32" r="21.5" fill="none" stroke="#F9A738" strokeOpacity=".55" strokeWidth="1" strokeDasharray="2 3" />
      {/* An open eye (vision) over a rising line */}
      <path d="M17 32c4.2-6 9.2-9 15-9s10.8 3 15 9c-4.2 6-9.2 9-15 9s-10.8-3-15-9Z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="4.6" fill="#F9A738" />
      <path d="M22 45.5h20" stroke="#F9A738" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
