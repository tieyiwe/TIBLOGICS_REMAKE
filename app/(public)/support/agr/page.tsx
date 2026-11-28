import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck, FileText, Download } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import { FaqBlock } from "@/components/seo/AnswerBlocks";

// Support page of the AI Graveyard Report (AGR Score™) plugin and skill: the
// support URL given to the plugin listings (OpenAI and others), with
// /privacy/agr and /terms/agr. English only, like the legal pages it sits
// with. Answers here must stay true to the skill (public/downloads, SKILL.md)
// and the AGR Privacy Policy (lib/legal/agr-privacy.ts).

const SUPPORT_EMAIL = "info@tiblogics.com";
const mail = (subject: string) => `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

const START: Array<{ title: string; steps: string[] }> = [
  {
    title: "In ChatGPT or Codex",
    steps: [
      "Find AI Graveyard Report (AGR Score™) in the plugin directory and add it to your account.",
      "Start a new chat and ask \"What is my AGR Score?\"",
      "Answer AGR's questions about each project, then review your report.",
    ],
  },
  {
    title: "In Claude",
    steps: [
      "Download the skill (.zip) from tiblogics.com/agr. Do not unzip it.",
      "In Claude: Settings, Capabilities, Skills, then Upload skill, and choose the zip.",
      "Start a new chat and type /agr-score-auth-tieyiwe-b, or ask \"What is my AGR Score?\"",
    ],
  },
];

const FAQ = [
  {
    q: "What does AGR do?",
    a: "AI Graveyard Report looks at the projects you started or developed with AI, keeps only real projects (work that needs effort outside the chat), and scores your follow-through. You get an AGR Score™ from 0 to 100, a tier, a score and a status for each project (Shipped, Alive, Stalled or Buried), your follow-through metrics, and the projects worth reviving first.",
  },
  {
    q: "AGR found no projects, or fewer than I expected. Why?",
    a: "AGR can only use the history your AI platform makes available in the current session, and it ignores chats that were questions or one-off tasks rather than projects. Make sure chat history and any memory features are turned on in your platform, then run AGR again in a new chat. You can also tell AGR about a project directly when it asks.",
  },
  {
    q: "Why doesn't AGR see my Codex history (or my ChatGPT history)?",
    a: "ChatGPT history and Codex history are separate sources, and one is not automatically available to the other. AGR only reports on sources it can actually access, and it should tell you when a source was not available. If you use both, run AGR where that history lives.",
  },
  {
    q: "A project's status or my score looks wrong. How do I fix it?",
    a: "After the report, AGR asks what happened to each project. Tell it, for example \"this one shipped last month\" or \"I stopped this one\", and the report updates with the same formula. Scores depend on the information available, so correcting a status is the right way to fix them.",
  },
  {
    q: "Will I get the same score if I run it again?",
    a: "Yes, on the same information and the same date. AGR uses a fixed formula, not guesswork, so the score only changes when your projects change or time passes. Re-running every 30 days shows whether your follow-through is improving.",
  },
  {
    q: "How do I share my score without showing my project names?",
    a: "Ask AGR for a shareable version or a Share Card. Project names are hidden and the detailed project lists are left out, while your score, tier and key metrics stay. Always review a report before posting it publicly.",
  },
  {
    q: "Does TIBLOGICS see my chats or my report?",
    a: "No. TIBLOGICS never receives your conversations. In ChatGPT and Codex, AGR sends only the project facts it has established (project names, dates, counts and statuses) to the TIBLOGICS calculator, which works out your scores with the official formula and keeps nothing: it does not store or log what it receives. In Claude, the skill runs entirely inside your own account. Your AI platform stores conversations according to its own settings. Details are in the AGR Privacy Policy.",
  },
  {
    q: "How do I remove AGR or delete my information?",
    a: "Remove or disable AGR in your platform's plugin or skill settings, and delete any conversations you no longer want using your platform's own controls. If you have sent personal information to TIBLOGICS directly, for example in a support email, write to us and we will delete it.",
  },
  {
    q: "Is AGR free?",
    a: "Yes. The AGR plugin and skill are free. Your AI platform may charge for its own plans.",
  },
  {
    q: "Can my company use AGR to evaluate employees?",
    a: "AGR is not designed for employee monitoring, and an AGR Score™ is not a measure of performance, intelligence or effort. Organisations must be transparent with their people and follow employment and privacy law. Contact us if you are interested in a future AGR Teams version.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    path: "/support/agr",
    locale: await getLocale(),
    title: "AGR Score™ Support | AI Graveyard Report",
    description:
      "Help with AI Graveyard Report (AGR Score™) in ChatGPT, Codex and Claude: getting started, common questions, fixing a score, privacy, and how to contact support.",
  });
}

export default function AgrSupportPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB]" lang="en">
      <section className="bg-[#0D1B2A] px-4 pb-12 pt-28 text-white sm:pb-14 sm:pt-40">
        <div className="mx-auto max-w-3xl">
          <p className="font-dm text-xs font-bold uppercase tracking-[0.2em] text-[#F9A738]">Support</p>
          <h1 className="mt-3 font-syne text-4xl font-extrabold leading-tight sm:text-5xl">
            AGR Score<span className="align-super text-xl text-[#F9A738] sm:text-2xl">™</span> Support
          </h1>
          <p className="mt-3 max-w-2xl font-dm text-base leading-relaxed text-white/75 sm:text-lg">
            Help with AI Graveyard Report in ChatGPT, Codex and Claude. Most questions are answered below; for anything else, write to us and a person will reply.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={mail("AGR support")}
              data-track="agr-support-email"
              data-testid="agr-support-email"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#F47C20] px-6 py-3 font-dm text-sm font-bold text-white hover:bg-[#d96b18]"
            >
              <Mail size={17} aria-hidden="true" /> Email AGR support
            </a>
            <p className="font-dm text-sm text-white/70">
              {SUPPORT_EMAIL} · we aim to reply within 2 business days
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:py-14">
        {/* Getting started */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" aria-labelledby="agr-start" data-testid="agr-start">
          <h2 id="agr-start" className="font-syne text-2xl font-bold text-[#0D1B2A]">Getting started</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {START.map((p) => (
              <div key={p.title} className="rounded-xl bg-[#F4F7FB] p-5">
                <p className="font-dm text-base font-bold text-[#0D1B2A]">{p.title}</p>
                <ol className="mt-3 space-y-2">
                  {p.steps.map((s, i) => (
                    <li key={s} className="flex gap-3 font-dm text-sm leading-relaxed text-[#3A4A5C]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F47C20] text-xs font-bold text-white">{i + 1}</span>
                      <span className="min-w-0 break-words">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <Link href="/agr" className="mt-5 inline-flex items-center gap-2 font-dm text-sm font-bold text-[#2251A3] hover:underline">
            <Download size={15} aria-hidden="true" /> About AGR and the Claude download
          </Link>
        </section>

        <FaqBlock title="Common questions" items={FAQ} path="/support/agr" />

        {/* Contact */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" aria-labelledby="agr-contact" data-testid="agr-contact">
          <h2 id="agr-contact" className="font-syne text-2xl font-bold text-[#0D1B2A]">Contact support</h2>
          <p className="mt-3 font-dm text-sm leading-relaxed text-[#3A4A5C]">
            Email <a href={mail("AGR support")} className="font-bold text-[#2251A3] hover:underline">{SUPPORT_EMAIL}</a> with the subject
            &ldquo;AGR support&rdquo;. To help us answer quickly, include:
          </p>
          <ul className="mt-3 space-y-1.5 font-dm text-sm leading-relaxed text-[#3A4A5C]">
            <li>• the platform you used (ChatGPT, Codex or Claude) and the date,</li>
            <li>• what you asked AGR and what happened,</li>
            <li>• a screenshot, with project names or anything private hidden.</li>
          </ul>
          <p className="mt-3 rounded-xl bg-[#FEF0E3] px-4 py-3 font-dm text-sm text-[#7A3E0E]">
            Never send passwords, access keys or full chat exports. We will never ask for them.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a href={mail("AGR privacy request")} className="flex items-start gap-3 rounded-xl border border-[#D2DCE8] p-4 hover:border-[#2251A3]">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#2251A3]" aria-hidden="true" />
              <span className="font-dm text-sm text-[#3A4A5C]">
                <strong className="block text-[#0D1B2A]">Privacy or data request</strong>
                Subject: AGR privacy request
              </span>
            </a>
            <a href={mail("AGR security")} className="flex items-start gap-3 rounded-xl border border-[#D2DCE8] p-4 hover:border-[#2251A3]">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#2251A3]" aria-hidden="true" />
              <span className="font-dm text-sm text-[#3A4A5C]">
                <strong className="block text-[#0D1B2A]">Report a security issue</strong>
                Subject: AGR security
              </span>
            </a>
          </div>
        </section>

        {/* Policies */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" aria-labelledby="agr-policies">
          <h2 id="agr-policies" className="font-syne text-xl font-bold text-[#0D1B2A]">Policies</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/privacy/agr" className="inline-flex items-center gap-2 font-dm text-sm font-bold text-[#2251A3] hover:underline" data-testid="agr-privacy-link">
              <ShieldCheck size={16} aria-hidden="true" /> AGR Privacy Policy
            </Link>
            <Link href="/terms/agr" className="inline-flex items-center gap-2 font-dm text-sm font-bold text-[#2251A3] hover:underline" data-testid="agr-terms-link">
              <FileText size={16} aria-hidden="true" /> AGR Terms of Use
            </Link>
          </div>
        </section>

        <div className="rounded-2xl bg-[#0D1B2A] p-6 text-center font-dm text-sm text-white/75 sm:p-8">
          <p className="font-bold text-white">AI Graveyard Report (AGR Score™)</p>
          <p className="mt-1">A TIBLOGICS product, operated by TILO GROUP, LLC. Created by Tieyiwe Bassole.</p>
          <p className="mt-1">
            <Link href="/" className="text-[#F9A738] hover:underline">tiblogics.com</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
