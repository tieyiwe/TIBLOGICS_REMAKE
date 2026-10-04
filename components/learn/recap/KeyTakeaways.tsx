import { CheckCircle2 } from "lucide-react";
import type { Recap } from "@/lib/learn/recap";

// The end of a lesson: what to remember (lib/learn/recap). Server component.
export default function KeyTakeaways({ recap, title, accentColor = "#F47C20" }: { recap: Recap; title: string; accentColor?: string }) {
  return (
    <section aria-labelledby="key-takeaways" className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" style={{ borderLeft: `5px solid ${accentColor}` }} data-testid="key-takeaways">
      <h2 id="key-takeaways" className="text-base font-bold text-[var(--ink)]">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {recap.takeaways.map((x, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--ink2)]">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: accentColor }} aria-hidden />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
