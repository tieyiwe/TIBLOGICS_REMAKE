import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { TRACK_3_MODULES_1_TO_3 } from "./modules-1-3";
import { TRACK_3_MODULES_4_TO_6 } from "./modules-4-6";
import { TRACK_3_CAPSTONE, TRACK_3_FINAL_EXAM, TRACK_3_LABS } from "./assessments";
import { T3_DOORS_LESSON, T3_DOORS_QUIZ } from "./security-doors";

// Level 3 · Expert. Written to lib/learn/seed/AUTHORING.md and checked by
// scripts/validate-learn-content.mts before it was added here.

export const AI_SYSTEMS_EXPERT: SeedTrack = {
  slug: "ai-systems-expert",
  title: "AI Systems Expert",
  tagline: "Design and lead AI across an organisation, and see the whole system while you do it.",
  description: `This is the level for people who will decide how AI is used, not only use it.

It opens with systems thinking at organisational scale: stocks and flows, delays, reinforcing and balancing loops, incentives, and where to intervene. Every module after that applies it. You will learn what agents really are and when a simpler workflow is the better choice, how to evaluate and monitor AI systems, how they fail and how to secure them, how risk-based regulation and good documentation work, and how to cost, measure and lead adoption honestly.

The labs are real design work done inside the platform, and the capstone is a full AI system and leadership plan for an organisation you know, reviewed by a person.

Skills this track builds also appear in generative AI leadership and AI governance certifications. This track is independent: it is not affiliated with any vendor or certification body and is not official exam preparation.`,
  level: "advanced",
  status: "live",
  sortOrder: 3,
  accentColor: "#B8500A",
  certificateName: "TIBLOGICS Certified AI Systems Expert",
  audience:
    "Practitioners who use AI confidently and now lead it: team leads, heads of operations, product and technology leaders, consultants and founders.",
  outcomes: [
    "Model an AI rollout as a system of loops, delays and incentives, and find the leverage point",
    "Decide between a fixed workflow and an agent, and scope an agent's permissions safely",
    "Design an evaluation set and monitoring that catch problems before users do",
    "Defend against prompt injection and plan incident response",
    "Assess risk, document accountability and run vendor due diligence",
    "Cost AI honestly, measure value against a baseline, and lead adoption",
  ],
  // Lessons total 740 minutes (710 plus the 30-door launch-gate lesson).
  estimatedHours: 12.5,
  estimatedWeeksAt3Hrs: 5,
  // Module 4 ends with the 30-door launch-gate lesson (appended).
  modules: [...TRACK_3_MODULES_1_TO_3, ...TRACK_3_MODULES_4_TO_6]
    .map((m, i) => (i === 3 ? { ...m, lessons: [...m.lessons, T3_DOORS_LESSON], quiz: [...(m.quiz ?? []), ...T3_DOORS_QUIZ] } : m))
    .map(spreadModule),
  labs: TRACK_3_LABS,
  finalExam: { ...TRACK_3_FINAL_EXAM, questions: TRACK_3_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: TRACK_3_CAPSTONE,
};
