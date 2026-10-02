import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { TRACK_AGENTS_MODULES_1_TO_2 } from "./modules-1-2";
import { TRACK_AGENTS_MODULES_3_TO_4 } from "./modules-3-4";
import { TRACK_AGENTS_MODULES_5_TO_6 } from "./modules-5-6";
import { TRACK_AGENTS_CAPSTONE, TRACK_AGENTS_FINAL_EXAM, TRACK_AGENTS_LABS } from "./assessments";
import {
  AGENTS_DOORS_EXAM,
  AGENTS_DOORS_LAB,
  AGENTS_DOORS_LESSON_M5,
  AGENTS_DOORS_LESSON_M6,
  AGENTS_DOORS_QUIZ_M5,
  AGENTS_DOORS_QUIZ_M6,
} from "./security-doors";

// Specialist track for developers: building AI features and agents that hold
// up in production. It covers the skills behind developer-level AI
// certifications (calling models, structured outputs, tool use, MCP, RAG,
// agents, evaluation, security, deployment) in TIBLOGICS's own words. It is
// vendor-neutral, not affiliated with any provider, and not exam preparation
// for any vendor's certificate. Code labs run in the built-in Code Studio
// against in-page mock models (no network); reference solutions are in
// ./solutions.ts, used only for testing.

export const AI_APPS_AGENTS: SeedTrack = {
  slug: "ai-apps-agents",
  title: "Building AI Apps and Agents",
  tagline: "Build AI features and agents that hold up in production: tools, retrieval, evaluation, security and cost, done properly.",
  description: `Getting a model to produce something impressive once takes an afternoon. Building an AI feature that is reliable, safe, affordable and understandable by the next developer is engineering, and that is what this track teaches.

You will call models from code the professional way (messages, system prompts, tokens and cost, streaming, retries with backoff, keys kept on the server), get structured output you can trust, give models tools and run the agent loop with proper stop conditions, connect tools and data through the Model Context Protocol, handle images, documents and audio with a validated extraction pipeline, build retrieval-augmented generation with citations and access control, and decide when an agent is the right design at all. Then you will prove it works with eval sets and regression tests, defend it against prompt injection and data exfiltration, run a 30-door pre-launch security audit on the whole app (keys, access, input, webhooks, tools, agent configs, spending and recovery), and ship and operate it with sensible architecture, cost control, monitoring and handover.

It is vendor-neutral, with examples from several providers and open-source models, and hands-on throughout: Code Studio labs where you build a retry-safe client, a JSON validator with repair, a tool-calling loop with a step budget and a mini RAG pipeline against mock models, plus design reviews and an evaluation plan. The capstone is a small AI feature or agent of your own, documented with an eval set, a security review, a cost estimate and a system map, reviewed by a person.

Skills this track builds also appear in cloud AI engineer associate certifications and AI developer courses from model providers. This track is independent: it is not affiliated with any vendor and is not official exam preparation.`,
  level: "advanced",
  status: "live",
  sortOrder: 10,
  accentColor: "#6366F1",
  certificateName: "TIBLOGICS Certified AI App and Agent Builder",
  audience:
    "Developers and technical builders who are comfortable with basic JavaScript or Python and want to build reliable AI features and agents: product engineers adding AI to an app, technical founders, data and automation engineers, and solution builders.",
  outcomes: [
    "Call model APIs from server code with correct messages, sensible parameters, retries with backoff and cost tracked from token usage",
    "Get structured output you can trust, and design tools, agent loops and MCP connections with clear stop conditions and least privilege",
    "Build retrieval-augmented generation with sound chunking, hybrid search, citations and access control, and evaluate retrieval and generation separately",
    "Choose between workflows and agents, and add memory, human approval, guardrails and budgets so agents fail safely",
    "Evaluate AI features with eval sets, calibrated judges and regression tests, and defend them against prompt injection and data leaks",
    "Run a 30-door pre-launch security audit on an AI app: keys, server-side auth and ownership, webhooks, tool limits, agent configs, spending caps, log redaction and tested restores",
    "Ship and operate AI features with the right architecture, cost controls, monitoring, incident response and a system map for handover",
  ],
  // Lessons total 743 minutes (683 plus the two 30-door security lessons).
  estimatedHours: 12.5,
  estimatedWeeksAt3Hrs: 6,
  // The 30 Doors security lessons are appended to the ends of Modules 5 and 6
  // (existing titles and positions unchanged).
  modules: [...TRACK_AGENTS_MODULES_1_TO_2, ...TRACK_AGENTS_MODULES_3_TO_4, ...TRACK_AGENTS_MODULES_5_TO_6]
    .map((m, i) =>
      i === 4
        ? { ...m, lessons: [...m.lessons, AGENTS_DOORS_LESSON_M5], quiz: [...(m.quiz ?? []), ...AGENTS_DOORS_QUIZ_M5] }
        : i === 5
          ? { ...m, lessons: [...m.lessons, AGENTS_DOORS_LESSON_M6], quiz: [...(m.quiz ?? []), ...AGENTS_DOORS_QUIZ_M6] }
          : m,
    )
    .map(spreadModule),
  labs: [...TRACK_AGENTS_LABS, AGENTS_DOORS_LAB],
  finalExam: {
    ...TRACK_AGENTS_FINAL_EXAM,
    questions: [...TRACK_AGENTS_FINAL_EXAM.questions, ...AGENTS_DOORS_EXAM].map(spreadAnswer),
  },
  capstone: TRACK_AGENTS_CAPSTONE,
};
