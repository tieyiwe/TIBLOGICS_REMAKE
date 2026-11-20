"use client";

import { useT } from "@/lib/i18n/client";

// "Practice It" (Part D). Every lesson that needs a tool links it here, with
// its cost stated up front — nobody should hit a paywall mid-exercise.
const TYPE_ICON: Record<string, string> = {
  tool: "🛠",
  article: "📄",
  video: "🎬",
  dataset: "📊",
  template: "📋",
  account_signup: "🔑",
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
  const t = useT();
  const required = resources.filter((r) => r.isRequired);
  const optional = resources.filter((r) => !r.isRequired);

  const Item = ({ r }: { r: (typeof resources)[number] }) => {
    const type = r.resourceType in TYPE_ICON ? r.resourceType : "tool";
    const meta = { icon: TYPE_ICON[type], label: t(`learn.resource.${type}`) };
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
                {r.isFree ? t("learn.practice.free") : t("learn.practice.paid")}
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
        <span aria-hidden="true">⚡</span> {t("learn.practice.title")}
      </h2>
      <p className="mt-1 text-sm text-[var(--ink2)]">{t("learn.practice.intro")}</p>

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
            {t("learn.practice.optional")}
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
