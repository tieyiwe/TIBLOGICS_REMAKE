import RecallCards from "./RecallCards";
import type { Recap } from "@/lib/learn/recap";

// Before a module quiz: recall cards from every lesson, then what each lesson
// taught (folded). Server component; the cards are the interactive part.
export default function ModuleRecap({
  items,
  accentColor,
  labels,
}: {
  items: Array<{ lessonId: string; title: string; recap: Recap }>;
  accentColor?: string;
  labels: { title: string; body: string; lessons: string };
}) {
  if (!items.length) return null;
  const cards = items.flatMap((x) => x.recap.cards);
  return (
    <section aria-labelledby="module-recap" className="mb-6 space-y-3" data-testid="module-recap">
      <div>
        <h2 id="module-recap" className="text-lg font-bold text-[var(--ink)]">{labels.title}</h2>
        <p className="mt-1 text-sm text-[var(--ink3)]">{labels.body}</p>
      </div>
      <RecallCards cards={cards} accentColor={accentColor} />
      <details className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--ink2)]">{labels.lessons}</summary>
        <ol className="mt-3 space-y-4">
          {items.map((x) => (
            <li key={x.lessonId}>
              <p className="text-sm font-bold text-[var(--ink)]">{x.title}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--ink2)]">
                {x.recap.takeaways.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
