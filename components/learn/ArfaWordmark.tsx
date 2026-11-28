// The ARFA lockup: "ARFA · AI Academy" (navy "AR" + orange "FA", as on
// public/arfa-banner.png) with the expansion "AI Readiness For All" beneath.
// ARFA is the TIBLOGICS AI Academy platform. Text only, so it works in server
// and client components and needs no image request.
//
// tone="dark" is for dark backgrounds ("AR" and the label turn white).
// academyLabel is the localised "AI Academy" (Académie IA, Chuo cha AI).

export const ARFA_NAVY = "#1B2A5E";
export const ARFA_ORANGE = "#F47C20";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { mark: string; label: string; sub: string }> = {
  sm: { mark: "text-lg", label: "text-[11px]", sub: "text-[9px]" },
  md: { mark: "text-2xl", label: "text-sm", sub: "text-[10px]" },
  lg: { mark: "text-4xl sm:text-5xl", label: "text-lg sm:text-xl", sub: "text-xs sm:text-sm" },
};

export default function ArfaWordmark({
  size = "md",
  tone = "light",
  subtitle = true,
  academyLabel = "AI Academy",
  className = "",
}: {
  size?: Size;
  tone?: "light" | "dark";
  /** Show "AI Readiness For All" under the mark. */
  subtitle?: boolean;
  /** "AI Academy" in the page language; empty string hides it. */
  academyLabel?: string;
  className?: string;
}) {
  const s = SIZES[size];
  const dark = tone === "dark";
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={`${s.mark} font-black tracking-tight`} style={{ color: dark ? "#FFFFFF" : ARFA_NAVY }}>
          AR<span style={{ color: ARFA_ORANGE }}>FA</span>
        </span>
        {academyLabel && (
          <span
            className={`${s.label} font-bold`}
            style={{ color: dark ? "rgba(255,255,255,.85)" : ARFA_NAVY }}
          >
            <span aria-hidden="true" style={{ color: ARFA_ORANGE }}>
              ·
            </span>{" "}
            {academyLabel}
          </span>
        )}
      </span>
      {subtitle && (
        <span
          className={`${s.sub} mt-1 font-semibold uppercase tracking-[0.14em]`}
          style={{ color: dark ? "rgba(255,255,255,.7)" : "#5B6B7A" }}
        >
          AI Readiness For All
        </span>
      )}
    </span>
  );
}
