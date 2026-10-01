import type { SeedTrack } from "./types";
import { TRACK_1 } from "./track-1";
import { TRACK_1_CAPSTONE, TRACK_1_FINAL_EXAM, TRACK_1_MODULES_3_TO_7 } from "./track-1-part2";
import { TRACK_1_LABS } from "./labs-track-1";
import { TRACK_1_MODULE_8, TRACK_1_MODULE_8_EXAM } from "./track-1-module-8";
import { TRACK_1_MODULE_8_LABS } from "./labs-track-1-module-8";
import { TRACK_1_MODULE_9, TRACK_1_MODULE_9_EXAM } from "./track-1-module-9";
import { TRACK_1_MODULE_9_LABS } from "./labs-track-1-module-9";
import { AI_PRACTITIONER } from "./track-2";
import { AI_SYSTEMS_EXPERT } from "./track-3";
import { VIBE_CODING_ENGINEER } from "./track-4";
import { AI_FOR_PARENTS } from "./track-parents";
import { AI_FORWARD_PROFESSIONAL } from "./track-ai-forward";
import { AI_SMALL_BUSINESS } from "./track-smb";
import { PROMPT_SPECIALIST } from "./track-prompt";
import { AI_ML_FUNDAMENTALS } from "./track-ml";
import { AI_GOVERNANCE } from "./track-governance";
import { AI_APPS_AGENTS } from "./track-agents";

// Track 1 (Level 1 · Basic) is assembled from its content files. Module 8,
// "Seeing the Whole System", is appended rather than inserted so the existing
// labs' and exam questions' 1-based module numbers stay valid.
const AI_FOUNDATIONS: SeedTrack = {
  ...TRACK_1,
  // 12h of lessons, Module 8's 70 minutes and Module 9 (AI Fluency)'s 85.
  estimatedHours: 14.5,
  estimatedWeeksAt3Hrs: 6,
  modules: [...TRACK_1.modules, ...TRACK_1_MODULES_3_TO_7, ...TRACK_1_MODULE_8, ...TRACK_1_MODULE_9],
  finalExam: {
    ...TRACK_1_FINAL_EXAM,
    questions: [...TRACK_1_FINAL_EXAM.questions, ...TRACK_1_MODULE_8_EXAM, ...TRACK_1_MODULE_9_EXAM],
  },
  capstone: TRACK_1_CAPSTONE,
  labs: [...TRACK_1_LABS, ...TRACK_1_MODULE_8_LABS, ...TRACK_1_MODULE_9_LABS],
};

// ═══════════════════════════════════════════════════════════════════════════
// RETIRED OUTLINES — kept as `draft`, which hides them from the catalog and
// their landing pages. They were four "coming soon" tracks with a curriculum
// outline and no lessons. Their ground (business operations, prompt
// engineering, automation, strategy) is now taught properly inside Level 2 ·
// Intermediate (track-2/) and Level 3 · Expert (track-3/). Kept rather than
// deleted so their slugs, and any waitlist sign-ups against them, stay
// meaningful if one is revived as a specialist track.
//
// Practical Prompt Engineering (slug "practical-prompt-engineering") has been
// revived that way: it is now the live specialist track in track-prompt/, on
// the same slug, so only three outlines remain here.
// ═══════════════════════════════════════════════════════════════════════════

const AI_FOR_BUSINESS: SeedTrack = {
  slug: "ai-for-business",
  title: "AI for Business Operations",
  tagline: "Find the processes in your organisation that AI genuinely improves — and the ones it doesn't.",
  description: `Most organisations adopting AI start from the tool and look for a problem. This track works the other way round.

You'll learn to audit your own processes, identify where AI creates measurable value, build a business case that survives scrutiny, and run a pilot that produces evidence rather than enthusiasm. You'll also learn to recognise the projects that should be killed early.

Assumes you're comfortable using AI tools day to day — if you're not, take AI Foundations first.`,
  level: "beginner",
  levelEnd: "intermediate",
  status: "draft",
  sortOrder: 10,
  accentColor: "#3B82F6",
  certificateName: "TIBLOGICS Certified — AI for Business Operations",
  audience: "Managers, operations leads and business owners deciding where AI fits in their organisation.",
  outcomes: [
    "Audit a business process and score it for AI suitability",
    "Build a business case with realistic costs, risks and success measures",
    "Run a structured pilot that produces decision-grade evidence",
    "Recognise and kill low-value AI projects early",
    "Write a practical AI usage policy for a team",
    "Brief a vendor and evaluate their claims sceptically",
  ],
  estimatedHours: 18,
  estimatedWeeksAt3Hrs: 6,
  modules: [
    { title: "Finding the Real Opportunity", summary: "Process auditing, value mapping, and why tool-first adoption fails.", lessons: [] },
    { title: "Building the Business Case", summary: "Costs, risks, success measures, and the numbers that convince a finance director.", lessons: [] },
    { title: "Running a Pilot", summary: "Scoping, baselines, measurement, and producing evidence rather than anecdote.", lessons: [] },
    { title: "Governance and Policy", summary: "Data handling, approval processes, and writing a policy people actually follow.", lessons: [] },
    { title: "Vendors and Build-vs-Buy", summary: "Evaluating claims, briefing suppliers, and knowing when to build.", lessons: [] },
    { title: "Change and Adoption", summary: "Why good tools fail, and what makes adoption stick.", lessons: [] },
  ],
};

const AI_AUTOMATION: SeedTrack = {
  slug: "ai-automation",
  title: "AI Automation Without Code",
  tagline: "Connect AI to your actual systems and let it do work while you sleep.",
  description: `Chatting with AI is useful. Wiring it into your workflows is transformative.

This track covers no-code automation platforms, connecting AI to email, documents, spreadsheets and databases, and building automations that fail safely. Emphasis throughout on error handling and human checkpoints — an automation that fails silently is worse than no automation.

No programming required, but you should be comfortable with spreadsheets and web tools.`,
  level: "intermediate",
  status: "draft",
  sortOrder: 12,
  accentColor: "#8B5CF6",
  certificateName: "TIBLOGICS Certified — AI Automation",
  audience: "Operators and analysts who want AI working inside their systems, not just in a chat window.",
  outcomes: [
    "Build multi-step automations connecting AI to real data sources",
    "Design human checkpoints at the right points in a workflow",
    "Handle errors so failures are visible rather than silent",
    "Estimate and control the running cost of an automation",
    "Test an automation before it touches production data",
    "Decide what should never be automated",
  ],
  estimatedHours: 22,
  estimatedWeeksAt3Hrs: 8,
  modules: [
    { title: "Automation Foundations", summary: "Triggers, actions, and thinking in workflows.", lessons: [] },
    { title: "Connecting Your Data", summary: "Email, sheets, documents and databases as inputs and outputs.", lessons: [] },
    { title: "AI Steps in a Workflow", summary: "Where a model fits, and what it should and shouldn't decide.", lessons: [] },
    { title: "Failing Safely", summary: "Error handling, alerting, and human checkpoints.", lessons: [] },
    { title: "Cost and Performance", summary: "Understanding and controlling what an automation costs to run.", lessons: [] },
    { title: "Testing and Deployment", summary: "Proving it works before it touches anything real.", lessons: [] },
  ],
};

const AI_STRATEGY: SeedTrack = {
  slug: "ai-strategy-leadership",
  title: "AI Strategy and Leadership",
  tagline: "Set direction on AI for an organisation, and defend those decisions to a board.",
  description: `For people accountable for AI decisions rather than executing them.

Covers portfolio thinking, capability building, risk and regulation, ethical frameworks that survive contact with commercial pressure, and communicating AI strategy to boards, staff and customers. Heavy emphasis on the decisions that are hard to reverse.

Assumes senior operational experience and working familiarity with AI capabilities.`,
  level: "advanced",
  status: "draft",
  sortOrder: 13,
  accentColor: "#EF4444",
  certificateName: "TIBLOGICS Certified — AI Strategy and Leadership",
  audience: "Directors, heads of function and founders accountable for organisational AI decisions.",
  outcomes: [
    "Build an AI portfolio balancing quick wins against structural bets",
    "Assess build, buy and partner options against real constraints",
    "Apply an ethical framework that holds under commercial pressure",
    "Navigate the current regulatory landscape and prepare for change",
    "Develop AI capability in a team without over-hiring",
    "Communicate AI strategy credibly to a board and to staff",
  ],
  estimatedHours: 24,
  estimatedWeeksAt3Hrs: 8,
  modules: [
    { title: "Portfolio Thinking", summary: "Balancing quick wins, capability building and structural bets.", lessons: [] },
    { title: "Build, Buy or Partner", summary: "Evaluating options against capability, cost and control.", lessons: [] },
    { title: "Risk and Regulation", summary: "The current landscape and how to prepare for what's coming.", lessons: [] },
    { title: "Ethics Under Pressure", summary: "Frameworks that survive commercial reality.", lessons: [] },
    { title: "Building Capability", summary: "Skills, hiring and structure without over-investing.", lessons: [] },
    { title: "Communicating Strategy", summary: "Boards, staff and customers — three different conversations.", lessons: [] },
  ],
};

export const TRACKS: SeedTrack[] = [
  AI_FOUNDATIONS,
  AI_PRACTITIONER,
  AI_SYSTEMS_EXPERT,
  VIBE_CODING_ENGINEER,
  AI_FOR_PARENTS,
  AI_FORWARD_PROFESSIONAL,
  AI_SMALL_BUSINESS,
  AI_FOR_BUSINESS,
  PROMPT_SPECIALIST,
  AI_ML_FUNDAMENTALS,
  AI_GOVERNANCE,
  AI_APPS_AGENTS,
  AI_AUTOMATION,
  AI_STRATEGY,
];
