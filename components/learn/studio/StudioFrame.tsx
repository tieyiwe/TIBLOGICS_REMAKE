"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { BookOpen, Hammer, Radio } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// The shared layout every Studio tool renders inside:
//
//   Guide  (goal, steps, how to earn each star, tips)   collapsible
//   Build  (the tool's workspace)
//   Live   (what the thing you are building does, updating as you work)
//
// Wide screens (page and full-screen overlay) show Build and Live side by side
// with the Guide in a collapsible column; phones and lesson embeds use tabs.
// The host sets the layout through StudioLayoutContext.

export type StudioLayout = "embedded" | "page" | "overlay";

export const StudioLayoutContext = createContext<{ layout: StudioLayout }>({ layout: "page" });
export const useStudioLayout = () => useContext(StudioLayoutContext).layout;

export interface StudioGuide {
  /** One or two sentences: what to build or decide. */
  goal: ReactNode;
  /** Numbered steps, short and concrete. */
  steps: ReactNode[];
  /** What earns 1, 2 and 3 stars. */
  stars?: [ReactNode, ReactNode, ReactNode];
  tips?: ReactNode[];
}

type Tab = "build" | "live" | "guide";

/** The pulsing green "LIVE" light (green dot with an orange ring). */
export function LiveDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#15803D]">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-70 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-[#F47C20]" />
      </span>
      {label}
    </span>
  );
}

function GuideBody({ guide }: { guide: StudioGuide }) {
  const t = useT();
  return (
    <div className="space-y-4 text-sm leading-relaxed text-[var(--ink2)]">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("studio.frame.goal")}</h3>
        <div className="mt-1 font-medium text-[var(--ink)]">{guide.goal}</div>
      </div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("studio.frame.steps")}</h3>
        <ol className="mt-1.5 space-y-1.5">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B] text-[11px] font-bold text-white">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      {guide.stars && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("studio.frame.stars")}</h3>
          <ul className="mt-1.5 space-y-1">
            {guide.stars.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-[#F9A738]" aria-label={t("studio.frame.starsN", { n: i + 1 })}>{"★".repeat(i + 1)}</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {guide.tips && guide.tips.length > 0 && (
        <div className="rounded-xl bg-[#FEF0E3] p-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#B8500A]">{t("studio.frame.tips")}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[#7A3E0E]">
            {guide.tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function StudioFrame({
  guide,
  live,
  liveTitle,
  toolbar,
  children,
}: {
  guide: StudioGuide;
  /** What the learner's build does, updating as they work. */
  live: ReactNode;
  /** Optional heading for the live panel, e.g. "Your automation running". */
  liveTitle?: string;
  /** Above everything: challenge picker, mode switch. */
  toolbar?: ReactNode;
  /** The workspace. */
  children: ReactNode;
}) {
  const t = useT();
  const layout = useStudioLayout();
  const [tab, setTab] = useState<Tab>("build");
  const [guideOpen, setGuideOpen] = useState(true);
  const wide = layout !== "embedded";

  const livePanel = (
    <section aria-label={t("studio.frame.live")} className="flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-[#D2DCE8] bg-[#0D1B2A]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <LiveDot label={t("studio.frame.liveBadge")} />
        <span className="truncate text-xs font-semibold text-white/70">{liveTitle ?? t("studio.frame.liveDefault")}</span>
      </div>
      <div className="flex-1 overflow-auto bg-white p-3 sm:p-4">{live}</div>
    </section>
  );

  const tabs: Array<[Tab, string, ReactNode]> = [
    ["build", t("studio.frame.build"), <Hammer key="b" size={14} />],
    ["live", t("studio.frame.live"), <Radio key="l" size={14} />],
    ["guide", t("studio.frame.guide"), <BookOpen key="g" size={14} />],
  ];

  const tabBar = (
    <div role="tablist" aria-label={t("studio.frame.views")} className="flex rounded-xl bg-[var(--s2)] p-1">
      {tabs.map(([id, label, icon]) => (
        <button
          key={id}
          role="tab"
          type="button"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
            tab === id ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--ink3)] hover:text-[var(--ink)]"
          }`}
        >
          {icon}
          {label}
          {id === "live" && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {toolbar}

      {/* Tabs: phones always, lesson embeds on every width */}
      <div className={wide ? "lg:hidden" : ""}>
        {tabBar}
        <div className="mt-3">
          {tab === "build" && <div>{children}</div>}
          {tab === "live" && <div className="h-[min(70vh,560px)]">{livePanel}</div>}
          {tab === "guide" && (
            <div className="rounded-2xl border border-[#D2DCE8] bg-white p-4">
              <GuideBody guide={guide} />
            </div>
          )}
        </div>
      </div>

      {/* Side by side on wide screens (Studio page and full-screen overlay) */}
      {wide && (
        <div
          className={`hidden gap-4 lg:grid ${
            guideOpen ? "lg:grid-cols-[260px_minmax(0,1.35fr)_minmax(0,1fr)]" : "lg:grid-cols-[44px_minmax(0,1.35fr)_minmax(0,1fr)]"
          } ${layout === "overlay" ? "lg:h-[calc(100vh-140px)]" : "lg:min-h-[620px]"}`}
        >
          <aside className="overflow-auto rounded-2xl border border-[#D2DCE8] bg-white">
            <button
              type="button"
              onClick={() => setGuideOpen((o) => !o)}
              aria-expanded={guideOpen}
              className="flex w-full items-center gap-2 border-b border-[#D2DCE8] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-[var(--ink3)] hover:text-[var(--ink)]"
              title={guideOpen ? t("studio.frame.hideGuide") : t("studio.frame.showGuide")}
            >
              <BookOpen size={15} />
              {guideOpen && <span>{t("studio.frame.guide")}</span>}
            </button>
            {guideOpen && (
              <div className="p-4">
                <GuideBody guide={guide} />
              </div>
            )}
          </aside>
          <div className="min-w-0 overflow-auto">{children}</div>
          <div className="min-w-0">{livePanel}</div>
        </div>
      )}
    </div>
  );
}
