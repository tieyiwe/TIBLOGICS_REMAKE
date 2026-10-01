import { getT } from "@/lib/i18n/server";

// "How TIBLOGICS Learn works" on /learning-box: the Learning Loop, then
// Daily Review and the Portfolio. Plain claims only: no statistics.
const STEPS = [
  { id: "understand", icon: "📖" },
  { id: "try", icon: "🧪" },
  { id: "play", icon: "🎮" },
  { id: "apply", icon: "🛠️" },
  { id: "reflect", icon: "✍️" },
  { id: "remember", icon: "🧠" },
  { id: "prove", icon: "🗂️" },
] as const;

export default async function HowItWorks() {
  const t = await getT();
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14" aria-labelledby="how-it-works">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B8500A]">{t("method.box.eyebrow")}</p>
      <h2 id="how-it-works" className="mt-2 text-2xl font-black text-[var(--ink)] sm:text-3xl">
        {t("method.box.title")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink2)]">{t("method.box.body")}</p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className={`rounded-2xl border p-5 ${i < 5 ? "border-[var(--border)] bg-white" : "border-transparent bg-[var(--ink)] text-white"}`}
          >
            <p className={`flex items-center gap-2 text-xs font-black ${i < 5 ? "text-[#B8500A]" : "text-[var(--orange)]"}`}>
              <span aria-hidden="true" className="text-lg">
                {s.icon}
              </span>
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className={`mt-2 text-base font-bold ${i < 5 ? "text-[var(--ink)]" : ""}`}>{t(`method.box.step.${s.id}.title`)}</h3>
            <p className={`mt-1 text-sm leading-relaxed ${i < 5 ? "text-[var(--ink2)]" : "text-white/70"}`}>
              {t(`method.box.step.${s.id}.body`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
