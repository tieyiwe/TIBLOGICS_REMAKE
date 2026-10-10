"use client";

import { useEffect, useRef } from "react";

// A burst of confetti over the page (two cannons from the bottom corners,
// then a gentle fall), in the ARFA colours. Drawn on one canvas, gone after
// about four seconds; nothing for visitors who ask for reduced motion.
const COLORS = ["#F47C20", "#1B3A6B", "#2251A3", "#F9B47A", "#22A387", "#B8860B", "#FFFFFF"];

export default function Confetti({ fire = true, pieces = 220 }: { fire?: boolean; pieces?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!fire) return;
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => canvas.width, H = () => canvas.height;
    type P = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; w: number; h: number; c: string; shape: 0 | 1 };
    const parts: P[] = [];
    for (let i = 0; i < pieces; i++) {
      const left = i % 2 === 0;
      const angle = (left ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7;
      const speed = (14 + Math.random() * 12) * dpr;
      parts.push({
        x: left ? 0 : W(),
        y: H() * 0.95,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 0,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        w: (6 + Math.random() * 6) * dpr,
        h: (10 + Math.random() * 8) * dpr,
        c: COLORS[i % COLORS.length],
        shape: Math.random() < 0.3 ? 1 : 0,
      });
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, W(), H());
      for (const p of parts) {
        p.vy += 0.32 * dpr; // gravity
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx + Math.sin((t + p.rot * 1000) / 300) * 0.6 * dpr;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = t > 3200 ? Math.max(0, 1 - (t - 3200) / 900) : 1;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (p.shape === 1) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
        ctx.restore();
      }
      if (t < 4200) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W(), H());
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [fire, pieces]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" data-testid="confetti" />;
}
