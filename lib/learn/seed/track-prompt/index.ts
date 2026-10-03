import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { PROMPT_MODULES_1_TO_3 } from "./modules-1-3";
import { PROMPT_MODULES_4_TO_6 } from "./modules-4-6";
import { PROMPT_CAPSTONE, PROMPT_FINAL_EXAM, PROMPT_LABS } from "./assessments";
import { PROMPT_DOORS_LESSON, PROMPT_DOORS_QUIZ } from "./security-doors";

// Specialist track: becoming a prompt specialist. Replaces the retired
// "Practical Prompt Engineering" outline and keeps its slug, so waitlist
// sign-ups against it still match.

export const PROMPT_SPECIALIST: SeedTrack = {
  slug: "practical-prompt-engineering",
  title: "Practical Prompt Engineering: Becoming a Prompt Specialist",
  tagline: "Think in systems, make AI show you what you cannot see, and test prompts until they can be relied on.",
  description: `Anyone can get a good answer from AI now and then. A prompt specialist gets good answers reliably, on work that matters, and can show why.

This track teaches you to see a prompt as one part of a system: the inputs, the model, your review, where the output goes and how the system learns. You will learn how models actually read your prompt, build prompts and prompt chains that hold up, and use critic prompts (pre-mortems, red teams, the sceptical expert, assumptions and second-order effects) so the AI uncovers your blind spots instead of just agreeing with you. Then you will test prompts like an engineer: test sets with edge and adversarial cases, pass/fail checks, rubrics, regressions and prompt injection.

Every lesson has prompts you run on the page and Studio tools to compare strong and weak prompts side by side. The labs are done on the platform, with one built in a free Claude or ChatGPT account. The capstone is a tested, documented prompt system for your own work.

Assumes you already use AI tools regularly.

Skills this track builds also appear in prompt engineering courses from model providers and in AI practitioner certifications. This track is independent: it is not affiliated with any vendor and is not official exam preparation.`,
  level: "intermediate",
  status: "live",
  sortOrder: 8,
  accentColor: "#F9A738",
  certificateName: "TIBLOGICS Certified Prompt Specialist",
  audience:
    "Regular AI users in any role who want consistent, dependable results, want AI to challenge their thinking rather than flatter it, and want to become the person their team trusts with prompts.",
  outcomes: [
    "Explain how models read a prompt and write prompts that close the gaps a model would otherwise fill with the average",
    "Map a task as a system and design prompt chains and reusable templates around it",
    "Use critic prompts to make AI uncover assumptions, risks and second-order effects you cannot see",
    "Build test sets, pass/fail checks and rubrics, compare variants and catch regressions",
    "Apply specialist techniques: few-shot examples, structured outputs, reasoning and self-review, documents and data",
    "Run a versioned, documented prompt library, stay current as models change, and prompt ethically",
  ],
  // Lessons total 630 minutes (605 plus the untrusted-input security lesson).
  estimatedHours: 10.5,
  estimatedWeeksAt3Hrs: 5,
  // Module 4 ends with the untrusted-input security lesson (appended).
  modules: [...PROMPT_MODULES_1_TO_3, ...PROMPT_MODULES_4_TO_6]
    .map((m, i) => (i === 3 ? { ...m, lessons: [...m.lessons, PROMPT_DOORS_LESSON], quiz: [...(m.quiz ?? []), ...PROMPT_DOORS_QUIZ] } : m))
    .map(spreadModule),
  labs: PROMPT_LABS,
  finalExam: { ...PROMPT_FINAL_EXAM, questions: PROMPT_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: PROMPT_CAPSTONE,
};
