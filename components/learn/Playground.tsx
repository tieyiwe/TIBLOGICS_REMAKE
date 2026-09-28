"use client";

import { useEffect, useRef, useState } from "react";

// An editable HTML/CSS/JS example with a live preview, for coding lessons.
// The preview is a sandboxed iframe WITHOUT allow-same-origin, so whatever the
// learner types runs in an opaque origin: it cannot read cookies, storage or
// the page around it.
export default function Playground({ code: initial }: { code: string }) {
  const [code, setCode] = useState(initial);
  const [doc, setDoc] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Re-render the preview shortly after typing stops.
  useEffect(() => {
    const t = setTimeout(() => setDoc(code), 400);
    return () => clearTimeout(t);
  }, [code]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart: s, selectionEnd: end } = el;
    const next = code.slice(0, s) + "  " + code.slice(end);
    setCode(next);
    requestAnimationFrame(() => {
      if (ref.current) ref.current.selectionStart = ref.current.selectionEnd = s + 2;
    });
  }

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between bg-[var(--ink)] px-3 py-2 text-xs text-white">
        <span className="font-bold">Live playground: edit the code, the preview updates</span>
        <button type="button" onClick={() => setCode(initial)} className="rounded-full border border-white/30 px-3 py-1 font-semibold hover:bg-white/10">
          Reset
        </button>
      </div>
      <div className="grid md:grid-cols-2">
        <textarea
          ref={ref}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          aria-label="Playground code"
          className="min-h-[260px] w-full resize-y bg-[#0F172A] p-3 font-mono text-[12.5px] leading-relaxed text-[#E2E8F0] outline-none"
        />
        <iframe
          title="Playground preview"
          sandbox="allow-scripts allow-modals"
          srcDoc={doc}
          className="min-h-[260px] w-full border-t border-[var(--border)] bg-white md:border-l md:border-t-0"
        />
      </div>
    </div>
  );
}
