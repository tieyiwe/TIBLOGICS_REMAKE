import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { AI_FORWARD_MODULES_1_TO_3 } from "./modules-1-3";
import { AI_FORWARD_MODULES_4_TO_6 } from "./modules-4-6";
import { AI_FORWARD_CAPSTONE, AI_FORWARD_FINAL_EXAM, AI_FORWARD_LABS } from "./assessments";

// Specialist track for experienced professionals who feel behind on AI.

export const AI_FORWARD_PROFESSIONAL: SeedTrack = {
  slug: "ai-forward-professional",
  title: "Becoming the AI-Forward Professional in Your Field",
  tagline: "From intimidated to the person colleagues ask about AI, without losing what makes you good at your job.",
  description: `You are good at your work. AI is changing how that work gets done, and it can feel like everyone else got a head start. This track is for professionals who want to catch up calmly and then lead.

You will get past the intimidation with quick, real wins, learn the key tools worth your time, build workflows that save hours on email, meetings, documents and research, sort your own tasks into what to automate, augment or keep human, and measure the time you save honestly. Then you will help your workplace adopt AI: a small pilot, a case your manager can say yes to, and support for anxious colleagues.

Every lesson has prompts you run on the page with your own (non-confidential) work, and the labs are done on the platform. The capstone is a 30-day AI-forward project in your real job.`,
  level: "beginner",
  levelEnd: "intermediate",
  status: "live",
  sortOrder: 6,
  accentColor: "#D4537E",
  certificateName: "TIBLOGICS Certified AI-Forward Professional",
  audience:
    "Experienced professionals in any field (healthcare, law, finance, education, social work, government, sales, HR, the trades) who feel intimidated or behind on AI and want to lead with it.",
  outcomes: [
    "Use AI confidently for everyday work: email, meetings, documents and research",
    "Choose the key AI tools for your role and set them up safely",
    "Sort your own work into automate, augment and keep human, and measure time saved honestly",
    "Protect confidential information and stay accountable for AI-assisted work",
    "Run a small AI pilot and make a case your manager can approve",
    "Help colleagues adopt AI and build a 90-day plan for your own career",
  ],
  // Lessons total 583 minutes.
  estimatedHours: 9.75,
  estimatedWeeksAt3Hrs: 5,
  modules: [...AI_FORWARD_MODULES_1_TO_3, ...AI_FORWARD_MODULES_4_TO_6].map(spreadModule),
  labs: AI_FORWARD_LABS,
  finalExam: { ...AI_FORWARD_FINAL_EXAM, questions: AI_FORWARD_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: AI_FORWARD_CAPSTONE,
};
