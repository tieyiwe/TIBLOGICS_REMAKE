// A small canvas confetti burst. No dependency, ~1.6s, then it removes itself.
// Skipped entirely for reduced motion and for accessibility mode.

const COLORS = ["#F47C4C", "#F9A738", "#22A387", "#3B82F6", "#D4A017", "#EF4444"];

export function motionAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if (document.querySelector('[data-a11y="true"]')) return false;
  // Reading preferences "Reduce motion" (lib/a11y/reading-prefs.ts).
  if (document.documentElement.getAttribute("data-rp-motion") === "reduce") return false;
  return true;
}

export function confettiBurst(amount = 90): void {
  if (!motionAllowed()) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:70";
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  // Two cannons from the lower corners, aimed up and inward.
  const parts = Array.from({ length: amount }, (_, i) => {
    const left = i % 2 === 0;
    const angle = (left ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7;
    const speed = 9 + Math.random() * 8;
    return {
      x: left ? w * 0.1 : w * 0.9,
      y: h * 0.85,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[i % COLORS.length],
    };
  });

  const start = performance.now();
  const DURATION = 1600;
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    const fade = Math.max(0, 1 - Math.max(0, t - DURATION * 0.6) / (DURATION * 0.4));
    for (const p of parts) {
      p.vy += 0.35; // gravity
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (t < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
