// "Practice It" (Part D). Every lesson that needs a tool links it here, with
// its cost stated up front — nobody should hit a paywall mid-exercise.
const TYPE_META: Record<string, { icon: string; label: string }> = {
  tool: { icon: "🛠", label: "Tool" },
  article: { icon: "📄", label: "Reading" },
  video: { icon: "🎬", label: "Video" },
  dataset: { icon: "📊", label: "Dataset" },
  template: { icon: "📋", label: "Template" },
  account_signup: { icon: "🔑", label: "Free account needed" },
};

export default function PracticePanel({
  resources,
  accentColor,
}: {
  resources: Array<{
    id: string;
    title: string;
    url: string;
    resourceType: string;
    isFree: boolean;
    isRequired: boolean;
    notes: string | null;
  }>;
  accentColor: string;
}) {
  const required = resources.filter((r) => r.isRequired);
  const optional = resources.filter((r) => !r.isRequired);

  const Item = ({ r }: { r: (typeof resources)[number] }) => {
    const meta = TYPE_META[r.resourceType] ?? TYPE_META.tool;
    return (
      <li className="rounded-xl border border-[var(--border)] bg-white p-4">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-lg leading-none">
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--ink)] underline-offset-2 hover:underline"
            >
              {r.title}
              <span aria-hidden="true" className="ml-1 text-[var(--ink3)]">
                ↗
              </span>
            </a>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--ink3)]">{meta.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 font-bold ${
                  r.isFree ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
                }`}
              >
                {r.isFree ? "Free" : "Paid"}
              </span>
            </p>
            {r.notes && (
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink2)]">{r.notes}</p>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <section
      aria-labelledby="practice-heading"
      className="rounded-2xl border-2 p-6"
      style={{ borderColor: accentColor, background: `${accentColor}0A` }}
    >
      <h2 id="practice-heading" className="flex items-center gap-2 text-base font-bold text-[var(--ink)]">
        <span aria-hidden="true">⚡</span> Practice it
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">
        Reading about this isn't the same as doing it. Open these and try it yourself.
      </p>

      {required.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {required.map((r) => (
            <Item key={r.id} r={r} />
          ))}
        </ul>
      )}

      {optional.length > 0 && (
        <>
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">
            Optional — go deeper
          </p>
          <ul className="mt-2 space-y-2.5">
            {optional.map((r) => (
              <Item key={r.id} r={r} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
