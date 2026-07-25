"use client";

import { useState } from "react";
import { formatMinutes } from "@/lib/learn/types";

interface ModuleView {
  id: string;
  title: string;
  summary: string | null;
  estimatedMinutes: number;
  hasQuiz: boolean;
  quizPassScore: number | null;
  lessons: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    isPreview: boolean;
    objective: string | null;
  }>;
}

export default function ModuleAccordion({
  modules,
  accentColor,
}: {
  modules: ModuleView[];
  accentColor: string;
}) {
  // First module open by default so the page never looks empty
  const [open, setOpen] = useState<Set<string>>(new Set(modules[0] ? [modules[0].id] : []));

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (modules.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--ink3)]">
        The curriculum for this track is being finalised.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      {modules.map((m, i) => {
        const isOpen = open.has(m.id);
        return (
          <div key={m.id} className="border-b border-[var(--border)] last:border-b-0">
            <h3>
              <button
                onClick={() => toggle(m.id)}
                aria-expanded={isOpen}
                aria-controls={`mod-${m.id}`}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--s2)]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                  style={{ background: accentColor }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[var(--ink)]">{m.title}</span>
                  <span className="mt-0.5 block text-xs text-[var(--ink3)]">
                    {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}
                    {m.estimatedMinutes > 0 && ` · ${formatMinutes(m.estimatedMinutes)}`}
                    {m.hasQuiz && ` · quiz (${m.quizPassScore ?? 80}% to pass)`}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-lg text-[var(--ink3)] transition-transform ${isOpen ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
            </h3>

            {isOpen && (
              <div id={`mod-${m.id}`} className="px-5 pb-5 pl-[4.5rem]">
                {m.summary && (
                  <p className="mb-4 text-sm leading-relaxed text-[var(--ink2)]">{m.summary}</p>
                )}
                <ul className="space-y-2.5">
                  {m.lessons.map((l, li) => (
                    <li key={l.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 w-6 shrink-0 text-xs font-semibold text-[var(--ink3)]">
                        {i + 1}.{li + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-[var(--ink)]">{l.title}</span>
                        {l.isPreview && (
                          <span className="ml-2 rounded bg-[var(--orange-light)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--orange2)]">
                            Free preview
                          </span>
                        )}
                        {l.objective && (
                          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink3)]">
                            {l.objective}
                          </span>
                        )}
                      </span>
                      {l.durationMinutes > 0 && (
                        <span className="shrink-0 text-xs text-[var(--ink3)]">
                          {formatMinutes(l.durationMinutes)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {m.hasQuiz && (
                  <p className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--s2)] px-3 py-2 text-xs font-medium text-[var(--ink2)]">
                    <span aria-hidden="true">📝</span>
                    Module quiz — {m.quizPassScore ?? 80}% to pass, unlimited retakes
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
