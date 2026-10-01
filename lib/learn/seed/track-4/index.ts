import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { TRACK_4_MODULES_1_TO_3 } from "./modules-1-3";
import { TRACK_4_MODULES_4_TO_6 } from "./modules-4-6";
import { TRACK_4_CAPSTONE, TRACK_4_FINAL_EXAM, TRACK_4_LABS } from "./assessments";

// Specialist track: building software with AI, the way an engineer would.
// Code labs run in the built-in Code Studio (lib/learn/labs/code.ts); their
// reference solutions are in ./solutions.ts, used only for testing.

export const VIBE_CODING_ENGINEER: SeedTrack = {
  slug: "vibe-coding-engineer",
  title: "Vibe Coding Like a Software Engineer",
  tagline: "Build real apps with AI, with the habits that keep them working: specs, small steps, tests, security and shipping.",
  description: `AI can write code faster than anyone. It cannot decide what to build, notice what it broke, or keep your users' data safe. That part is engineering, and this track teaches it to people who build with AI.

You will learn to write a spec before you prompt, build in small loops with version control as your undo button, read and debug code you did not write, test what the AI produced instead of trusting it, spot the security mistakes AI makes most often, and ship and maintain an app without it falling over.

It is hands-on from the first lesson. Every lesson has live code playgrounds and prompts you run on the page, and the labs happen in the built-in Code Studio: an editor, a live preview, an AI pair programmer whose changes you review before applying, saved versions like Git commits, and automated checks. The capstone is a small real app you build and ship yourself, reviewed by a person.

Skills this track builds also appear in AI-assisted and agentic coding courses from model providers and developer platforms. This track is independent: it is not affiliated with any of them and is not official preparation for any certificate.`,
  level: "intermediate",
  status: "live",
  sortOrder: 4,
  accentColor: "#7C3AED",
  certificateName: "TIBLOGICS Certified AI-Assisted Software Builder",
  audience:
    "Founders, analysts, designers, product people and junior developers who build software with AI tools and want to do it like a professional. No prior coding experience needed, but you should be comfortable learning by doing.",
  outcomes: [
    "Map the system around an app before building it: users, data, hosting and who maintains it",
    "Write a build-ready spec with user stories and acceptance criteria an AI can build from",
    "Build in small, reviewed steps with version control, and debug with AI methodically",
    "Test AI-written code with edge cases and automated checks, and review its changes like a senior engineer",
    "Find and fix the common security mistakes: exposed keys, injection, XSS and made-up packages",
    "Deploy, monitor, cost and hand over an app, and know when to bring in a professional engineer",
  ],
  // Lessons total 610 minutes.
  estimatedHours: 10,
  estimatedWeeksAt3Hrs: 6,
  modules: [...TRACK_4_MODULES_1_TO_3, ...TRACK_4_MODULES_4_TO_6].map(spreadModule),
  labs: TRACK_4_LABS,
  finalExam: { ...TRACK_4_FINAL_EXAM, questions: TRACK_4_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: TRACK_4_CAPSTONE,
};
