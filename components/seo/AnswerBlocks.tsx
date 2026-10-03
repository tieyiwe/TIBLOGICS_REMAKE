import JsonLd from "./JsonLd";
import { faqNode, type QA } from "@/lib/seo/jsonld";

// Server-rendered "Key takeaways" and FAQ blocks. Search and AI engines read
// and quote short, self-contained answers; these put the facts people ask
// about (price, language, certificate, who it is for) in plain HTML on the
// page, readable without JavaScript. Keep every answer true: the FAQPage
// JSON-LD below repeats exactly what is visible.

export function KeyTakeaways({
  title,
  items,
  className = "",
  tone = "light",
}: {
  title: string;
  items: string[];
  className?: string;
  tone?: "light" | "dark";
}) {
  if (!items.length) return null;
  const dark = tone === "dark";
  return (
    <section
      aria-labelledby="key-takeaways"
      className={`rounded-2xl border p-6 sm:p-7 ${dark ? "border-white/15 bg-white/[0.04] text-white" : "border-[#D2DCE8] bg-white"} ${className}`}
    >
      <h2 id="key-takeaways" className={`font-syne text-lg font-bold ${dark ? "text-white" : "text-[#0D1B2A]"}`}>
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((x) => (
          <li key={x} className={`flex gap-3 font-dm text-sm leading-relaxed ${dark ? "text-white/80" : "text-[#3A4A5C]"}`}>
            <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47C20]" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqBlock({
  title,
  items,
  path,
  className = "",
  withJsonLd = true,
}: {
  title: string;
  items: QA[];
  /** The page's path, for the FAQPage @id. */
  path?: string;
  className?: string;
  /** false when the page already emits FAQPage for these questions. */
  withJsonLd?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-title" className={`rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-7 ${className}`}>
      <h2 id="faq-title" className="font-syne text-xl font-bold text-[#0D1B2A]">
        {title}
      </h2>
      <dl className="mt-5 divide-y divide-[#E8EFF8]">
        {items.map((f) => (
          <div key={f.q} className="py-4 first:pt-0 last:pb-0">
            <dt className="font-dm text-[15px] font-semibold text-[#0D1B2A]">{f.q}</dt>
            <dd className="mt-1.5 font-dm text-sm leading-relaxed text-[#3A4A5C]">{f.a}</dd>
          </div>
        ))}
      </dl>
      {withJsonLd && <JsonLd data={faqNode(items, path)} />}
    </section>
  );
}
