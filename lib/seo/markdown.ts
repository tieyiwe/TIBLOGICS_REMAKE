// Markdown versions of the ARFA pages, for AI agents and answer engines
// (/learning-box.md and /learning-box/<slug>.md). Agents that fetch a page to
// answer a question ("which AI course should I take?", "how much is ARFA?")
// get the facts without navigation, scripts or styling, which is cheaper for
// them to read and less likely to be misquoted. Each HTML page points here
// with <link rel="alternate" type="text/markdown">.
//
// Built from lib/seo/courses.ts, so the numbers match the pages and the JSON
// catalog.

import { fmtPrice } from "@/lib/learn/format";
import { publicCatalog, type PublicCatalog, type PublicCourse } from "./courses";
import { ORG, absUrl } from "./site";

const money = (dollars: number) => fmtPrice(Math.round(dollars * 100), "en-US");

/** Text from the database, safe inside a Markdown line (no stray headings or links). */
const md = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").replace(/([\\[\]<>])/g, "\\$1").trim();

function hoursText(h: number) {
  return `about ${h.toLocaleString("en-US")} hours`;
}

function priceRange(courses: PublicCourse[]) {
  const live = courses.filter((c) => c.status === "live").map((c) => c.price.amount);
  return live.length ? { min: Math.min(...live), max: Math.max(...live) } : null;
}

function howItWorks(cat: PublicCatalog): string[] {
  const out = [
    "## How ARFA works",
    "",
    "- Self-paced and online. No deadlines. Installs as an app on a phone or computer; lessons can be downloaded for offline study.",
    "- Languages: English and French (every track).",
    "- Assessment: short checks after lessons, a quiz per module (retakes allowed), a timed final exam, and a capstone project scored by a human reviewer against a published rubric.",
    `- Certificates: each track ends in its own certificate. Every certificate has a public verification page (${absUrl("/certificates")}/<reference>) that anyone, such as an employer, can open. It stays valid whether or not the holder keeps a subscription.`,
    "",
    "## Pricing",
    "",
  ];
  const r = priceRange(cat.courses);
  if (r) out.push(`- One track: ${money(r.min)} to ${money(r.max)} one time, depending on the track's level, with lifetime access to that track.`);
  out.push(`- Every track: ${money(cat.subscription.amount)} a month, cancel anytime.`);
  if (cat.teams) {
    const low = Math.min(cat.teams.seatPrice, ...cat.teams.volumeTiers.map((x) => x.seatPrice));
    out.push(
      `- Teams: ${money(cat.teams.seatPrice)} per seat per month from ${cat.teams.minSeats} seats${low < cat.teams.seatPrice ? `, down to ${money(low)} per seat for larger teams` : ""}. Every seat opens every track.`,
    );
  }
  out.push("- Prices are in US dollars. A sale shown on the website may lower them for a time.", "");
  return out;
}

/** /learning-box.md: the academy and every track in one page. */
export async function academyMarkdown(): Promise<string> {
  const cat = await publicCatalog();
  const live = cat.courses.filter((c) => c.status === "live");
  const soon = cat.courses.filter((c) => c.status === "coming_soon");
  const out: string[] = [
    "# ARFA AI Academy (AI Readiness For All)",
    "",
    "> ARFA is the online AI academy of TIBLOGICS, an AI implementation agency. Self-paced AI courses (\"tracks\") in English and French, from first prompts to advanced AI work, each ending in a verifiable certificate.",
    "",
    `Web page: ${absUrl("/learning-box")} · JSON catalog: ${absUrl("/api/public/courses")} · Contact: ${ORG.academyEmail}`,
    "",
    ...howItWorks(cat),
    `## Tracks open now (${live.length})`,
    "",
  ];
  for (const c of live) {
    out.push(
      `### [${md(c.title)}](${c.url})`,
      "",
      `${c.levelLabel} · ${hoursText(c.hours)} · ${c.moduleCount} modules, ${c.lessonCount} lessons · ${money(c.price.amount)} one time · Certificate: ${md(c.certificate.name)}`,
      "",
    );
    if (c.tagline) out.push(md(c.tagline), "");
    if (c.audience) out.push(`Who it is for: ${md(c.audience)}`, "");
    if (c.outcomes.length) out.push("You will be able to:", ...c.outcomes.slice(0, 6).map((o) => `- ${md(o)}`), "");
    out.push(`Details: ${c.markdownUrl}`, "");
  }
  if (soon.length) {
    out.push("## Coming soon", "");
    for (const c of soon) out.push(`- [${md(c.title)}](${c.url})${c.tagline ? `: ${md(c.tagline)}` : ""}`);
    out.push("");
  }
  out.push("## Start", "", `- Choose a track or subscribe: ${absUrl("/learning-box/join")}`, `- Teams: ${absUrl("/learning-box/join?team=1")}`, "");
  return out.join("\n");
}

/** /learning-box/<slug>.md: one track, with its full outline. */
export async function trackMarkdown(slug: string): Promise<string | null> {
  const cat = await publicCatalog();
  const c = cat.courses.find((x) => x.slug === slug);
  if (!c) return null;
  const a = c.assessment;
  const out: string[] = [
    `# ${md(c.title)}`,
    "",
    `> ${c.status === "coming_soon" ? "Coming soon. " : ""}An online, self-paced AI course from ARFA, the TIBLOGICS AI Academy. ${c.levelLabel} level, ${hoursText(c.hours)}, in English and French, with a verifiable certificate.`,
    "",
    `Web page: ${c.url} · All tracks: ${absUrl("/learning-box.md")}`,
    "",
    "## Key facts",
    "",
    `- Level: ${c.levelLabel}`,
    `- Time: ${hoursText(c.hours)} including hands-on work (${c.moduleCount} modules, ${c.lessonCount} lessons${c.labCount ? `, ${c.labCount} labs` : ""}); self-paced, no deadline`,
    c.status === "live"
      ? `- Price: ${money(c.price.amount)} one time for lifetime access to this track, or every track for ${money(cat.subscription.amount)} a month (cancel anytime)`
      : "- Price: announced when the track opens",
    `- Certificate: ${md(c.certificate.name)}, with a public verification page`,
    "- Languages: English and French",
  ];
  out.push("", "## About", "", md(c.description), "");
  if (c.audience) out.push(`Who it is for: ${md(c.audience)}`, "");
  if (c.outcomes.length) out.push("## What you will be able to do", "", ...c.outcomes.map((o) => `- ${md(o)}`), "");

  out.push("## Curriculum", "");
  c.modules.forEach((m, i) => {
    out.push(`### Module ${i + 1}: ${md(m.title)}`, "");
    if (m.summary) out.push(md(m.summary), "");
    for (const l of m.lessons) out.push(`- ${md(l.title)} (${l.minutes} min)`);
    if (m.hasQuiz) out.push("- Module quiz");
    out.push("");
  });

  out.push("## How you are assessed", "");
  if (a.moduleQuizzes) out.push(`- A quiz after each module${a.quizPassScore ? ` (${a.quizPassScore}% to pass, retakes allowed)` : ""}.`);
  if (a.finalExam) {
    out.push(
      `- A timed final exam: ${a.finalExam.questions} questions in ${a.finalExam.timeLimitMinutes} minutes, ${a.finalExam.passScore}% to pass, ${a.finalExam.distinctionScore}% for distinction, ${a.finalExam.attempts} attempts.`,
    );
  }
  if (a.capstone) out.push(`- A capstone project reviewed by a person against a published rubric (${a.capstone.passScore}% to pass).`);
  out.push(`- ${c.certificate.verification}`, "");
  return out.join("\n");
}
