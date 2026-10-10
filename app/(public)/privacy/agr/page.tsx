import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import { AGR_EFFECTIVE, AGR_INTRO, AGR_SECTIONS } from "@/lib/legal/agr-privacy";

// Privacy policy of the AI Graveyard Report (AGR Score™) ChatGPT plugin, the
// URL given to the plugin listing. English only: it is the binding text.
// The text is in lib/legal/agr-privacy.ts.

const PRIVACY_EMAIL = "info@tiblogics.com";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    path: "/privacy/agr",
    locale: await getLocale(),
    title: "AI Graveyard Report (AGR Score™) Privacy Policy",
    description:
      "How AI Graveyard Report (AGR Score™), a TIBLOGICS product operated by TILO GROUP, LLC, handles information when you use it in ChatGPT, Codex and other AI platforms.",
  });
}

export default function AgrPrivacyPage() {
  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]" lang="en">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <Image src="/logo.svg" alt="TIBLOGICS" width={120} height={36} className="h-9 w-auto" />
          </div>
          <span className="section-tag">Legal</span>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-[#0D1B2A] mt-3">
            AI Graveyard Report (AGR Score™)
            <span className="block text-2xl sm:text-3xl mt-1">Privacy Policy</span>
          </h1>
          <p className="font-dm text-[#7A8FA6] text-sm mt-3">
            Operated by TILO GROUP, LLC under the TIBLOGICS brand · Effective date: {AGR_EFFECTIVE}
          </p>
        </div>

        <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5 sm:p-8 md:p-10 font-dm text-[#3A4A5C] leading-relaxed break-words">
          <p>{AGR_INTRO}</p>

          <nav aria-label="Contents" className="mt-8 rounded-xl bg-[#F4F7FB] border border-[#E8EFF8] p-5">
            <p className="font-syne font-bold text-sm text-[#0D1B2A]">Contents</p>
            <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              {AGR_SECTIONS.map((s, i) => (
                <li key={s.title}>
                  <a href={`#s${i + 1}`} className="text-[#2251A3] hover:underline">{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {AGR_SECTIONS.map((s, i) => (
              <section key={s.title} id={`s${i + 1}`} className="scroll-mt-32">
                <h2 className="font-syne font-bold text-xl text-[#0D1B2A]">{s.title}</h2>
                <div className="mt-3 space-y-3">
                  {s.paras.map((p) => <p key={p.slice(0, 60)}>{p}</p>)}
                </div>
                {i === AGR_SECTIONS.length - 1 && (
                  <div className="mt-4 bg-[#F4F7FB] rounded-xl p-5 border border-[#E8EFF8] space-y-1.5">
                    <p><strong>AI Graveyard Report (AGR Score™)</strong></p>
                    <p>A TIBLOGICS product</p>
                    <p>Operated by TILO GROUP, LLC</p>
                    <p className="pt-2">
                      Website:{" "}
                      <Link href="/" className="text-[#2251A3] hover:underline">tiblogics.com</Link>
                    </p>
                    <p>
                      Privacy inquiries:{" "}
                      <a href={`mailto:${PRIVACY_EMAIL}?subject=AGR%20privacy%20request`} className="text-[#2251A3] hover:underline">{PRIVACY_EMAIL}</a>{" "}
                      (subject: AGR privacy request)
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>

          <p className="mt-10 border-t border-[#E8EFF8] pt-6 text-sm text-[#7A8FA6]">
            For the TIBLOGICS website and services, see the{" "}
            <Link href="/privacy" className="text-[#2251A3] hover:underline">TIBLOGICS Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
