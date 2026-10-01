import Link from "next/link";
import { Lock } from "lucide-react";
import { readableOn } from "@/lib/a11y/contrast";

// Shown in place of a module quiz or lab until the module's lessons are done.
export default function ModuleLocked({
  title,
  body,
  cta,
  href,
  accentColor,
}: {
  title: string;
  body: string;
  cta: string;
  href: string | null;
  accentColor: string;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-[#D2DCE8] bg-white p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${accentColor}1A`, color: accentColor }}>
        <Lock size={26} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-[var(--ink)]">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{body}</p>
      {href && (
        <Link href={href} className="mt-6 inline-flex rounded-full px-6 py-2.5 text-sm font-bold text-white" style={{ background: readableOn(accentColor) }}>
          {cta} →
        </Link>
      )}
    </section>
  );
}
