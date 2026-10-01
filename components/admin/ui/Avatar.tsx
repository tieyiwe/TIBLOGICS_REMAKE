import { cn } from "@/lib/utils";

// Deterministic, calm palette (all pass 4.5:1 with white text).
const PALETTE = ["#1B3A6B", "#2251A3", "#0F766E", "#6D28D9", "#B8500A", "#15803D", "#9D174D", "#3A4A5C"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const clean = name.replace(/@.*/, "").replace(/[^\p{L}\p{N}\s.-]/gu, " ").trim();
  const parts = clean.split(/[\s.-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Initials avatar with a colour derived from the name (or `seed`). */
export function Avatar({
  name,
  seed,
  size = 32,
  className,
  title,
}: {
  name: string;
  seed?: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const bg = PALETTE[hash(seed ?? name) % PALETTE.length];
  return (
    <span
      title={title}
      aria-hidden={title ? undefined : true}
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-dm font-semibold text-white", className)}
      style={{ width: size, height: size, background: bg, fontSize: Math.max(10, Math.round(size * 0.38)) }}
    >
      {initials(name)}
    </span>
  );
}
