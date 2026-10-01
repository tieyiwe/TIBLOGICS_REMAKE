import { ArrowRight, Sparkles } from "lucide-react";
import { fmt, type Labels } from "@/lib/growth/acquire/fmt";
import type { ProductCard } from "@/lib/growth/acquire/public";
import TrackedLink from "./TrackedLink";
import type { RefType } from "./track";

/** "Recommended next step": the product the magnet or page points to, with a tracked CTA. */
export default function ProductRecommend({
  product,
  pitch,
  cta,
  labels: L,
  refType,
  slug,
}: {
  product: ProductCard;
  pitch: string;
  cta: string;
  labels: Labels;
  refType: RefType;
  slug: string;
}) {
  return (
    <section aria-labelledby="acq-next" className="acq-avoid-break overflow-hidden rounded-[20px] border border-[#D2DCE8] bg-white">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FEF0E3]" aria-hidden>
          <Sparkles size={22} className="text-[#B8500A]" />
        </div>
        <div className="min-w-0 flex-1">
          <p id="acq-next" className="font-dm text-xs font-bold uppercase tracking-[0.08em] text-[#5A6E84]">
            {fmt(L, "acquire.asset.next")}
          </p>
          <p className="mt-1 font-syne text-xl font-bold text-[#0D1B2A]">{product.title}</p>
          <p className="mt-1 font-dm text-sm leading-relaxed text-[#3A4A5C]">{pitch || product.summary}</p>
          {product.price && <p className="mt-1 font-dm text-xs font-semibold text-[#5A6E84]">{product.price}</p>}
        </div>
        <TrackedLink
          href={product.href}
          refType={refType}
          slug={slug}
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] px-5 font-dm text-sm font-bold text-white hover:bg-[#2251A3]"
        >
          {cta || product.title} <ArrowRight size={16} aria-hidden />
        </TrackedLink>
      </div>
    </section>
  );
}
