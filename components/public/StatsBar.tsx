"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: null, suffix: "",  label: "Live AI Products" },
  { value: 2,    suffix: "",  label: "Continents Served" },
  { value: null, suffix: "+", label: "Businesses Transformed" },
  { value: null, suffix: "+", label: "AI Academy Lessons" },
];

function CountUp({ target, suffix }: { target: number | null; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * (target ?? 0)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="font-syne font-extrabold text-4xl">
      <span className="text-[#F47C20]">{count}</span>
      {suffix && <span className="text-white">{suffix}</span>}
    </span>
  );
}

export default function StatsBar() {
  return (
    <div className="bg-[#1B3A6B] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                "flex flex-col items-center justify-center gap-1.5 py-6 md:py-0",
                i < stats.length - 1 ? "md:border-r md:border-white/20" : "",
                i < 2 ? "border-b border-white/10 md:border-b-0" : "",
              ].filter(Boolean).join(" ")}
            >
              {stat.value !== null && <CountUp target={stat.value} suffix={stat.suffix} />}
              <p className="font-dm text-sm text-white/60 text-center">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
