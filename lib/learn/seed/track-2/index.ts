import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { TRACK_2_MODULES_1_TO_3 } from "./modules-1-3";
import { TRACK_2_MODULES_4_TO_6 } from "./modules-4-6";
import { TRACK_2_CAPSTONE, TRACK_2_FINAL_EXAM, TRACK_2_LABS } from "./assessments";
import { T2_DOORS_LESSON, T2_DOORS_QUIZ } from "./security-doors";

// Level 2 · Intermediate. Written to lib/learn/seed/AUTHORING.md and checked by
// scripts/validate-learn-content.mts before it was added here.

export const AI_PRACTITIONER: SeedTrack = {
  slug: "ai-practitioner",
  title: "AI Practitioner",
  tagline: "Use AI reliably for real work, not just for the occasional quick answer.",
  description: `You already use AI tools. This level makes you reliable with them.

You will start by mapping your own work as a system, because where AI helps depends on where the real bottleneck is. Then you will learn to write prompts that hold up every time, work accurately with your own documents and data, check quality at scale instead of trusting a single good answer, automate repetitive work with a person still in the loop, and do all of it responsibly.

Every module ends in a hands-on lab done inside the platform: prompts run against a real model, a summary with planted errors to catch, and your own workflow mapped and redesigned. The capstone is a real workflow of yours, rebuilt with AI and reviewed by a person.

Skills this track builds also appear in AI-at-work courses and entry-level AI practitioner certifications. This track is independent: it is not affiliated with any vendor and is not official exam preparation.`,
  level: "intermediate",
  status: "live",
  sortOrder: 2,
  accentColor: "#2251A3",
  certificateName: "TIBLOGICS Certified AI Practitioner",
  audience:
    "People who already use AI tools for everyday tasks and want to use them reliably in their actual job: analysts, managers, operators, consultants, small business owners.",
  outcomes: [
    "Map a workflow as a system and find where AI genuinely helps",
    "Write reusable prompts that give consistent, structured results",
    "Summarise and question your own documents and data without losing accuracy",
    "Test AI output on a set of cases and decide what needs human review",
    "Design an automation with an AI step and a human checkpoint",
    "Handle confidential data, prompt injection and bias responsibly",
  ],
  // Lessons total 665 minutes (640 plus the 30-door security lesson).
  estimatedHours: 11,
  estimatedWeeksAt3Hrs: 5,
  // Module 6 ends with the 30-door security lesson (appended).
  modules: [...TRACK_2_MODULES_1_TO_3, ...TRACK_2_MODULES_4_TO_6]
    .map((m, i) => (i === 5 ? { ...m, lessons: [...m.lessons, T2_DOORS_LESSON], quiz: [...(m.quiz ?? []), ...T2_DOORS_QUIZ] } : m))
    .map(spreadModule),
  labs: TRACK_2_LABS,
  finalExam: { ...TRACK_2_FINAL_EXAM, questions: TRACK_2_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: TRACK_2_CAPSTONE,
};
