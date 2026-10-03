"use client";

import { useEffect, useRef, useState } from "react";

// The expert's photo, or their initials when there is none or it fails to load.
export default function ExpertAvatar({ url, name, size = 56 }: { url: string | null; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // An image that failed before hydration never fires onError for React.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setBroken(true);
  }, []);
  const initials = name
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const box = { width: size, height: size };
  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img ref={img} src={url} alt={name} style={box} onError={() => setBroken(true)} className="shrink-0 overflow-hidden rounded-full bg-[var(--s2)] object-cover" />
    );
  }
  return (
    <span
      role="img"
      aria-label={name}
      style={{ ...box, fontSize: size / 2.8 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--orange)] to-[#F9A738] font-black text-[var(--ink)]"
    >
      {initials || "?"}
    </span>
  );
}
