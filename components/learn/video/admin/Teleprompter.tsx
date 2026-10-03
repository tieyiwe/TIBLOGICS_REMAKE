"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FlipHorizontal, Pause, Play, RotateCcw, X } from "lucide-react";
import type { VideoScript } from "@/lib/learn/video/shared";

// Full-screen teleprompter for recording (staff only): large text, adjustable
// auto-scroll speed and size, and a mirrored mode for a beam-splitter glass.
// Keys: Space play/pause, Up/Down speed, +/- size, M mirror, R restart, Esc close.

export default function Teleprompter({ script, onClose }: { script: VideoScript; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4); // 1-10
  const [size, setSize] = useState(52); // px
  const [mirror, setMirror] = useState(false);
  const [notes, setNotes] = useState(false);
  const last = useRef<number | null>(null);
  const carry = useRef(0);

  // Scroll by speed, proportional to text size so the reading pace holds.
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const step = (now: number) => {
      const el = box.current;
      if (el) {
        const dt = last.current === null ? 0 : (now - last.current) / 1000;
        carry.current += dt * speed * size * 0.09;
        const whole = Math.floor(carry.current);
        if (whole >= 1) {
          el.scrollTop += whole;
          carry.current -= whole;
        }
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) setPlaying(false);
      }
      last.current = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, size]);

  const restart = useCallback(() => {
    box.current?.scrollTo({ top: 0 });
    setPlaying(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, select")) return;
      if (e.key === "Escape") onClose();
      else if (e.key === " ") setPlaying((p) => !p);
      else if (e.key === "ArrowUp") setSpeed((s) => Math.min(10, s + 1));
      else if (e.key === "ArrowDown") setSpeed((s) => Math.max(1, s - 1));
      else if (e.key === "+" || e.key === "=") setSize((s) => Math.min(110, s + 4));
      else if (e.key === "-") setSize((s) => Math.max(28, s - 4));
      else if (e.key === "m" || e.key === "M") setMirror((m) => !m);
      else if (e.key === "r" || e.key === "R") restart();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, restart]);

  // Portalled to <body> so no admin layout container (stacking context,
  // sticky header) can sit on top of it.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Teleprompter" className="fixed inset-0 z-[1000] flex flex-col bg-black text-white" data-testid="teleprompter">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/15 bg-[#0D1B2A] px-4 py-2 font-dm text-sm">
        <button type="button" onClick={() => setPlaying((p) => !p)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F47C20] px-3 py-1.5 font-bold" autoFocus>
          {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Start"}
        </button>
        <button type="button" onClick={restart} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-white/10">
          <RotateCcw size={15} /> Restart
        </button>
        <label className="inline-flex items-center gap-2">
          Speed
          <input type="range" min={1} max={10} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-valuetext={`${speed} of 10`} />
          <span className="w-5 tabular-nums">{speed}</span>
        </label>
        <label className="inline-flex items-center gap-2">
          Size
          <input type="range" min={28} max={110} step={2} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>
        <button type="button" onClick={() => setMirror((m) => !m)} aria-pressed={mirror} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 ${mirror ? "bg-white text-black" : "hover:bg-white/10"}`}>
          <FlipHorizontal size={15} /> Mirror
        </button>
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} /> Show cues
        </label>
        <span className="flex-1" />
        <span className="hidden text-xs text-white/60 lg:inline">Space start/pause · ↑↓ speed · +/- size · M mirror · Esc close</span>
        <button type="button" onClick={onClose} aria-label="Close teleprompter" className="rounded-lg p-1.5 hover:bg-white/10">
          <X size={18} />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        {/* Reading line */}
        <div className="pointer-events-none absolute inset-x-0 top-[33%] z-10 h-0 border-t-2 border-[#F47C20]/70" aria-hidden="true" />
        <div ref={box} className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }} onWheel={() => setPlaying(false)}>
          <div
            className="mx-auto max-w-5xl px-[6vw] pb-[70vh] pt-[30vh] font-sans font-semibold"
            style={{ fontSize: size, lineHeight: 1.45, transform: mirror ? "scaleX(-1)" : undefined }}
          >
            {script.sections.map((s, i) => (
              <section key={i} className="mb-[1.2em]">
                <p className="mb-[0.3em] text-[0.4em] font-bold uppercase tracking-widest text-[#F47C20]">{s.heading}</p>
                {notes && s.shots.length > 0 && <p className="mb-[0.3em] text-[0.35em] font-normal text-white/50">[{s.shots.join(" / ")}]</p>}
                {s.narration.split(/\n{2,}/).map((p, j) => (
                  <p key={j} className="mb-[0.6em]">
                    {p}
                  </p>
                ))}
              </section>
            ))}
            <p className="text-[0.5em] text-white/40">End</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
