import { ArrowRight, CheckCircle2, ChevronDown, CircleAlert, Quote } from "lucide-react";
import { fmt, type Labels } from "@/lib/growth/acquire/fmt";
import type { PageContent, PageSection } from "@/lib/growth/acquire/types";
import CaptureForm from "../../free/_components/CaptureForm";
import TrackedLink from "../../free/_components/TrackedLink";

// A campaign landing page's sections, in the owner's order. Used by the
// public page (/lp/[slug]) and by the live preview in the admin editor
// (preview: the form is shown but does not submit, links do not navigate).

function Cta({ href, label, slug, preview, tone = "orange" }: { href: string | null; label: string; slug: string; preview?: boolean; tone?: "orange" | "white" }) {
  if (!href || !label) return null;
  const cls =
    tone === "orange"
      ? "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#B8500A] px-6 font-dm text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(184,80,10,0.3)] hover:bg-[#9c4408]"
      : "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 font-dm text-[15px] font-bold text-[#0D1B2A] hover:bg-[#F4F7FB]";
  if (preview) return <span className={cls}>{label} <ArrowRight size={16} aria-hidden /></span>;
  return (
    <TrackedLink href={href} refType="page" slug={slug} className={cls}>
      {label} <ArrowRight size={16} aria-hidden />
    </TrackedLink>
  );
}

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-syne text-[26px] font-extrabold leading-tight tracking-tight text-[#0D1B2A] sm:text-3xl">{children}</h2>;
}

function PreviewForm({ L, s, content }: { L: Labels; s: PageSection; content: PageContent }) {
  const box = "mt-1 block h-11 w-full rounded-xl border border-[#C3CFDD] bg-white";
  return (
    <div aria-hidden className="pointer-events-none space-y-3 opacity-90">
      <div>
        <span className="font-dm text-sm font-semibold text-[#0D1B2A]">{fmt(L, "acquire.form.email")}</span>
        <span className={box} />
      </div>
      <div>
        <span className="font-dm text-sm font-semibold text-[#0D1B2A]">{fmt(L, "acquire.form.name")}</span>
        <span className={box} />
      </div>
      {content.askBusiness && (
        <div>
          <span className="font-dm text-sm font-semibold text-[#0D1B2A]">{fmt(L, "acquire.form.business")}</span>
          <span className={box} />
        </div>
      )}
      {content.askWhatsapp && (
        <div>
          <span className="font-dm text-sm font-semibold text-[#0D1B2A]">{fmt(L, "acquire.form.whatsapp")}</span>
          <span className={box} />
        </div>
      )}
      <p className="rounded-xl bg-[#F4F7FB] p-3 font-dm text-[13px] text-[#3A4A5C]">☐ {fmt(L, "acquire.form.consent")}</p>
      <span className="flex h-12 items-center justify-center rounded-xl bg-[#B8500A] font-dm text-[15px] font-bold text-white">
        {s.ctaLabel || fmt(L, "acquire.lp.formSubmit")}
      </span>
    </div>
  );
}

export default function PageSections({
  content,
  labels: L,
  slug,
  locale,
  ctaHref,
  preview = false,
}: {
  content: PageContent;
  labels: Labels;
  slug: string;
  locale: string;
  ctaHref: string | null;
  preview?: boolean;
}) {
  const sections = content.sections.filter((s) => s.enabled);
  return (
    <>
      {sections.map((s) => {
        switch (s.type) {
          case "hero":
            return (
              <section key={s.id} className="relative overflow-hidden bg-[#0D1B2A]">
                <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 h-[460px] w-[460px] rounded-full bg-[#2251A3] opacity-30 blur-2xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-44 left-10 h-[340px] w-[340px] rounded-full bg-[#F47C20] opacity-[0.14] blur-2xl" />
                <Wrap className="relative py-14 sm:py-20">
                  <div className="max-w-3xl text-white">
                    <h1 className="font-syne text-[34px] font-extrabold leading-[1.08] tracking-tight sm:text-[52px]">{s.title}</h1>
                    {s.body && <p className="mt-5 max-w-2xl font-dm text-lg leading-relaxed text-white/80">{s.body}</p>}
                    {s.items.length > 0 && (
                      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                        {s.items.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 font-dm text-[15px] leading-snug text-white/90">
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#F47C20]" aria-hidden />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-8">
                      <Cta href={ctaHref} label={s.ctaLabel} slug={slug} preview={preview} />
                    </div>
                  </div>
                </Wrap>
              </section>
            );
          case "pains":
            return s.items.length ? (
              <section key={s.id} className="bg-white py-14 sm:py-16">
                <Wrap>
                  <H2>{s.title || fmt(L, "acquire.lp.pains")}</H2>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {s.items.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-2xl border border-[#F3D9C6] bg-[#FFF8F2] p-4">
                        <CircleAlert size={20} className="mt-0.5 shrink-0 text-[#B8500A]" aria-hidden />
                        <span className="font-dm text-[15px] leading-relaxed text-[#0D1B2A]">{p}</span>
                      </li>
                    ))}
                  </ul>
                </Wrap>
              </section>
            ) : null;
          case "benefits":
            return s.items.length ? (
              <section key={s.id} className="bg-[#F4F7FB] py-14 sm:py-16">
                <Wrap>
                  <H2>{s.title || fmt(L, "acquire.lp.benefits")}</H2>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {s.items.map((b, i) => (
                      <li key={i} className="rounded-2xl border border-[#D2DCE8] bg-white p-5">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E7F6F0]" aria-hidden>
                          <CheckCircle2 size={18} className="text-[#0F6E56]" />
                        </span>
                        <p className="mt-3 font-dm text-[15px] leading-relaxed text-[#0D1B2A]">{b}</p>
                      </li>
                    ))}
                  </ul>
                </Wrap>
              </section>
            ) : null;
          case "proof":
            return s.items.length ? (
              <section key={s.id} className="bg-white py-14 sm:py-16">
                <Wrap>
                  <H2>{s.title || fmt(L, "acquire.lp.proof")}</H2>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {s.items.map((p, i) => (
                      <li key={i} className="flex gap-3 rounded-2xl bg-[#1B3A6B] p-5 text-white">
                        <Quote size={20} className="shrink-0 text-[#F47C20]" aria-hidden />
                        <span className="font-dm text-[15px] leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </Wrap>
              </section>
            ) : null;
          case "product":
            return s.items.length || s.title ? (
              <section key={s.id} className="bg-[#F4F7FB] py-14 sm:py-16">
                <Wrap>
                  <div className="rounded-[20px] border border-[#D2DCE8] bg-white p-6 sm:p-8">
                    <p className="font-dm text-xs font-bold uppercase tracking-[0.08em] text-[#5A6E84]">{fmt(L, "acquire.lp.product")}</p>
                    {s.title && <p className="mt-1 font-syne text-2xl font-bold text-[#0D1B2A]">{s.title}</p>}
                    {s.body && <p className="mt-1 font-dm text-sm font-semibold text-[#B8500A]">{s.body}</p>}
                    <ul className="mt-5 space-y-2.5">
                      {s.items.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 font-dm text-[15px] leading-relaxed text-[#3A4A5C]">
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2251A3]" aria-hidden />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6">
                      <Cta href={ctaHref} label={s.ctaLabel} slug={slug} preview={preview} />
                    </div>
                  </div>
                </Wrap>
              </section>
            ) : null;
          case "faq":
            return s.faq.length ? (
              <section key={s.id} className="bg-white py-14 sm:py-16">
                <Wrap className="max-w-3xl">
                  <H2>{s.title || fmt(L, "acquire.lp.faq")}</H2>
                  <div className="mt-6 divide-y divide-[#E3E9F1] rounded-2xl border border-[#D2DCE8]">
                    {s.faq.map((f, i) => (
                      <details key={i} className="group p-0">
                        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-dm text-[15px] font-semibold text-[#0D1B2A] [&::-webkit-details-marker]:hidden">
                          {f.q}
                          <ChevronDown size={18} className="shrink-0 text-[#5A6E84] transition-transform group-open:rotate-180" aria-hidden />
                        </summary>
                        <p className="px-5 pb-4 font-dm text-[15px] leading-relaxed text-[#3A4A5C]">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </Wrap>
              </section>
            ) : null;
          case "cta":
            return s.title || s.ctaLabel ? (
              <section key={s.id} className="bg-[#F4F7FB] py-12 sm:py-14">
                <Wrap>
                  <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1B3A6B] to-[#0D1B2A] p-7 text-white sm:p-10">
                    <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#F47C20] opacity-20 blur-2xl" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 max-w-xl">
                        {s.title && <p className="font-syne text-2xl font-extrabold leading-tight sm:text-3xl">{s.title}</p>}
                        {s.body && <p className="mt-2 font-dm text-[15px] leading-relaxed text-white/80">{s.body}</p>}
                      </div>
                      <Cta href={ctaHref} label={s.ctaLabel} slug={slug} preview={preview} />
                    </div>
                  </div>
                </Wrap>
              </section>
            ) : null;
          case "form":
            return (
              <section key={s.id} id="lead-form" className="scroll-mt-28 bg-white py-14 sm:py-16">
                <Wrap className="max-w-xl">
                  <H2>{s.title || fmt(L, "acquire.lp.formTitle")}</H2>
                  <p className="mt-2 font-dm text-[15px] leading-relaxed text-[#3A4A5C]">{s.body || fmt(L, "acquire.lp.formBody")}</p>
                  <div className="mt-6 rounded-[20px] border border-[#D2DCE8] bg-white p-5 shadow-[0_12px_40px_rgba(13,27,42,0.08)] sm:p-7">
                    {preview ? (
                      <PreviewForm L={L} s={s} content={content} />
                    ) : (
                      <CaptureForm
                        refType="page"
                        slug={slug}
                        locale={locale}
                        labels={L}
                        mode="lead"
                        askBusiness={content.askBusiness}
                        askWhatsapp={content.askWhatsapp}
                        submitLabel={s.ctaLabel || fmt(L, "acquire.lp.formSubmit")}
                      />
                    )}
                  </div>
                </Wrap>
              </section>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
