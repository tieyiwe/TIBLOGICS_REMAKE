// The ARFA wordmark: navy "AR" + orange "FA", as on public/arfa-banner.png,
// with the "AI Readiness For All" expansion underneath. ARFA is the brand
// inside the learning product (the AI Academy of TIBLOGICS). Text only, so it
// works in server and client components and needs no image request.
//
// tone="dark" is for dark backgrounds ("AR" turns white).

export const ARFA_NAVY = "#1B2A5E";
export const ARFA_ORANGE = "#F47C20";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { mark: string; sub: string }> = {
  sm: { mark: "text-lg", sub: "text-[9px]" },
  md: { mark: "text-2xl", sub: "text-[10px]" },
  lg: { mark: "text-4xl sm:text-5xl", sub: "text-xs sm:text-sm" },
};

export default function ArfaWordmark({
  size = "md",
  tone = "light",
  subtitle = true,
  className = "",
}: {
  size?: Size;
  tone?: "light" | "dark";
  /** Show "AI Readiness For All" under the mark. */
  subtitle?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span
        className={`${s.mark} font-black tracking-tight`}
        style={{ color: tone === "dark" ? "#FFFFFF" : ARFA_NAVY }}
      >
        AR<span style={{ color: ARFA_ORANGE }}>FA</span>
      </span>
      {subtitle && (
        <span
          className={`${s.sub} mt-0.5 font-semibold uppercase tracking-[0.14em]`}
          style={{ color: tone === "dark" ? "rgba(255,255,255,.7)" : "#5B6B7A" }}
        >
          AI Readiness For All
        </span>
      )}
    </span>
  );
}
