import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { SMB_MODULES_1_TO_3 } from "./modules-1-3";
import { SMB_MODULES_4_TO_6 } from "./modules-4-6";
import { AGENTS_LESSON_SMB } from "../agents-2026";
import { SMB_CAPSTONE, SMB_FINAL_EXAM, SMB_LABS } from "./assessments";

// Specialist track for small business owners and managers.

export const AI_SMALL_BUSINESS: SeedTrack = {
  slug: "ai-small-business",
  title: "AI for Small Business Owners: Grow Sales and Get Time Back",
  tagline: "Use AI to win and keep customers and cut the admin, safely, in the business you actually run.",
  description: `You do not need a tech team to get real value from AI. You need to know where it pays off in your business, and how to use it without damaging customer trust.

You will map your business as a system to find where time and money leak, then use AI to market in your own voice, answer enquiries fast, write quotes and follow-ups that close, handle reviews properly, write SOPs, tame the inbox, connect your tools with simple automations that have a human checkpoint, read your numbers, price with confidence and plan the next 90 days.

Every lesson has ready-to-use prompts you run on the page with your own business details, and the labs are done on the platform. The capstone is a 30-day AI rollout in your own business.`,
  level: "beginner",
  levelEnd: "intermediate",
  status: "live",
  sortOrder: 7,
  accentColor: "#0F6E56",
  certificateName: "TIBLOGICS Certified: AI for Small Business",
  audience:
    "Owners and managers of small businesses (1 to 50 people): shops, salons, trades, clinics, agencies, restaurants, consultancies and online stores. No tech team or technical background needed.",
  outcomes: [
    "Map your customer journey as a system and find the bottleneck worth fixing first",
    "Create marketing in your own voice in about an hour a week, with honest claims",
    "Answer enquiries, send quotes and handle reviews faster without losing the personal touch",
    "Build simple automations with a human checkpoint and alerts when they fail",
    "Read your numbers, check your pricing and model what-if scenarios with AI",
    "Plan, measure and lead a 90-day AI rollout with your team",
  ],
  // Lessons total 625 minutes (600 plus the personal-agents lesson).
  estimatedHours: 10.5,
  estimatedWeeksAt3Hrs: 6,
  // Module 4 ("Admin and Operations on Autopilot") ends with personal AI agents.
  modules: [...SMB_MODULES_1_TO_3, ...SMB_MODULES_4_TO_6]
    .map((m, i) => (i === 3 ? { ...m, lessons: [...m.lessons, AGENTS_LESSON_SMB] } : m))
    .map(spreadModule),
  labs: SMB_LABS,
  finalExam: { ...SMB_FINAL_EXAM, questions: SMB_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: SMB_CAPSTONE,
};
