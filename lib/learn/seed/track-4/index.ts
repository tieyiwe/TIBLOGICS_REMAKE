import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { TRACK_4_MODULES_1_TO_3 } from "./modules-1-3";
import { TRACK_4_MODULES_4_TO_6 } from "./modules-4-6";
import { TRACK_4_CAPSTONE, TRACK_4_FINAL_EXAM, TRACK_4_LABS } from "./assessments";
import { TRACK_4_MODULE_7 } from "./module-7";
import { TRACK_4_MODULE_7_EXAM, TRACK_4_MODULE_7_LABS } from "./module-7-assessments";

// Specialist track: building software with AI, the way an engineer would.
// Code labs run in the built-in Code Studio (lib/learn/labs/code.ts); their
// reference solutions are in ./solutions.ts, used only for testing.

export const VIBE_CODING_ENGINEER: SeedTrack = {
  slug: "vibe-coding-engineer",
  title: "Vibe Coding Like a Software Engineer",
  tagline: "Build real apps with AI, with the habits that keep them working: specs, small steps, tests, security and shipping.",
  description: `AI can write code faster than anyone. It cannot decide what to build, notice what it broke, or keep your users' data safe. That part is engineering, and this track teaches it to people who build with AI.

You will learn to write a spec before you prompt, build in small loops with version control as your undo button, read and debug code you did not write, test what the AI produced instead of trusting it, spot the security mistakes AI makes most often, and ship and maintain an app without it falling over.

Security gets special emphasis, because most people who build with AI are not traditional developers. The Ship Safe module walks you through 30 doors an attacker will try before your first user signs up: keys and code history, logins and access, untrusted input, AI and agents, and what happens when it breaks. For each door you learn a two-minute check and a prompt that gets your AI assistant to audit and fix it, then you run a full security audit on a planted-flaw app and on your own. You cannot finish the track without it: the final exam covers it and your capstone needs a security section.

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
    "Run a 30-door security audit before launch, from keys and access checks to AI spending caps, prompt injection and tested backups, and fix the gaps with your AI assistant",
    "Deploy, monitor, cost and hand over an app, and know when to bring in a professional engineer",
  ],
  // Lessons total 777 minutes (610 plus Module 7, Ship Safe, at 167).
  estimatedHours: 13,
  estimatedWeeksAt3Hrs: 7,
  // Module 7 (Ship Safe) is appended so earlier module numbers stay valid; it
  // sits right before the capstone and the final exam covers it.
  modules: [...TRACK_4_MODULES_1_TO_3, ...TRACK_4_MODULES_4_TO_6, ...TRACK_4_MODULE_7].map(spreadModule),
  labs: [...TRACK_4_LABS, ...TRACK_4_MODULE_7_LABS],
  finalExam: {
    ...TRACK_4_FINAL_EXAM,
    questions: [...TRACK_4_FINAL_EXAM.questions, ...TRACK_4_MODULE_7_EXAM].map(spreadAnswer),
  },
  capstone: TRACK_4_CAPSTONE,
};
