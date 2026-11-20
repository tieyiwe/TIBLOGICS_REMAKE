import { ArrowUpRight } from "lucide-react";
import { fmt, type Labels } from "@/lib/growth/acquire/fmt";
import type { MagnetContent, MagnetType } from "@/lib/growth/acquire/types";

// The asset itself (checklist, guide or template pack), laid out for screen
// and print. Plain text only: every value is rendered as text, never HTML.

function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={`font-dm text-[15px] leading-relaxed text-[#3A4A5C] ${className}`}>
            {p}
          </p>
        ))}
    </>
  );
}

export default function MagnetBody({ type, content: c, labels: L }: { type: MagnetType; content: MagnetContent; labels: Labels }) {
  return (
    <div className="space-y-8">
      {c.intro && (
        <div className="space-y-3">
          <Paragraphs text={c.intro} className="text-[16px] text-[#0D1B2A]" />
        </div>
      )}

      {type === "checklist" &&
        c.checklist.map((sec, si) => (
          <section key={si} className="acq-avoid-break">
            <h2 className="font-syne text-xl font-bold text-[#0D1B2A]">
              <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-lg bg-[#FEF0E3] align-[2px] font-dm text-sm font-bold text-[#B8500A]" aria-hidden>
                {si + 1}
              </span>
              {sec.heading}
            </h2>
            <ul className="mt-3 divide-y divide-[#E3E9F1] rounded-2xl border border-[#D2DCE8] bg-white">
              {sec.items.map((it, ii) => {
                const id = `c-${si}-${ii}`;
                return (
                  <li key={ii} className="acq-avoid-break">
                    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 p-4">
                      <input id={id} type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#0F6E56]" />
                      <span className="min-w-0">
                        <span className="block font-dm text-[15px] font-semibold text-[#0D1B2A]">{it.text}</span>
                        {it.note && <span className="mt-0.5 block font-dm text-sm leading-relaxed text-[#5A6E84]">{it.note}</span>}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {type === "guide" &&
        c.guide.map((sec, si) => (
          <section key={si} className="space-y-3">
            <h2 className="font-syne text-xl font-bold text-[#0D1B2A]">
              <span className="mr-2 font-dm text-base font-bold text-[#B8500A]">{String(si + 1).padStart(2, "0")}</span>
              {sec.heading}
            </h2>
            <Paragraphs text={sec.body} />
          </section>
        ))}

      {type === "guide" && c.takeaways.length > 0 && (
        <section className="acq-avoid-break rounded-2xl bg-[#1B3A6B] p-6 text-white">
          <h2 className="font-syne text-lg font-bold">{fmt(L, "acquire.asset.takeaways")}</h2>
          <ul className="mt-3 space-y-2 pl-5 font-dm text-[15px] leading-relaxed [list-style:disc] marker:text-[#F47C20]">
            {c.takeaways.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
      )}

      {type === "templates" && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {c.templates.map((it, i) => (
            <li key={i} className="acq-avoid-break flex flex-col rounded-2xl border border-[#D2DCE8] bg-white p-5">
              <h2 className="font-syne text-lg font-bold text-[#0D1B2A]">{it.title}</h2>
              <p className="mt-1 flex-1 font-dm text-sm leading-relaxed text-[#3A4A5C]">{it.description}</p>
              <a
                href={it.href}
                className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 self-start rounded-xl border border-[#1B3A6B] px-4 font-dm text-sm font-bold text-[#1B3A6B] hover:bg-[#EBF0FA]"
              >
                {it.label || fmt(L, "acquire.asset.open")} <ArrowUpRight size={15} aria-hidden />
              </a>
              <span className="acq-print-only mt-2 break-all font-dm text-xs text-[#5A6E84]">tiblogics.com{it.href.startsWith("/") ? it.href : ""}</span>
            </li>
          ))}
        </ul>
      )}

      {c.outro && (
        <div className="space-y-3">
          <Paragraphs text={c.outro} />
        </div>
      )}
    </div>
  );
}
