import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { GOV_MODULE_1 } from "./module-1";
import { GOV_MODULE_2 } from "./module-2";
import { GOV_MODULE_3 } from "./module-3";
import { GOV_MODULE_4 } from "./module-4";
import { GOV_MODULE_5 } from "./module-5";
import { GOV_MODULE_6 } from "./module-6";
import { GOV_CAPSTONE, GOV_FINAL_EXAM, GOV_LABS } from "./assessments";

// Specialist track: AI Governance, Risk and Compliance. Written to
// lib/learn/seed/AUTHORING.md and checked by
// scripts/validate-learn-content.mts. Original content: frameworks, standards
// and laws are described in general terms in our own words, with no claim of
// affiliation or official exam preparation. Time-sensitive statements are
// dated October 2026.

export const AI_GOVERNANCE: SeedTrack = {
  slug: "ai-governance",
  title: "AI Governance, Risk and Compliance",
  tagline: "Decide which AI your organisation uses, how, and who answers for it, with controls that people actually follow.",
  description: `AI is already inside most organisations: in tools staff chose themselves, in features switched on in software you already pay for, and in vendor systems that help make decisions about people. This track is for the people responsible for making that safe, fair and lawful without stopping the useful work.

You will learn what goes wrong with AI and why governance is a system of incentives and feedback loops, not a document. You will learn how risk-based regulation is structured, using the EU AI Act as the main example, how data protection law applies to AI, and how the NIST AI Risk Management Framework, ISO/IEC 42001, ISO/IEC 23894 and the OECD AI Principles fit together. Then you will do the work: build a use-case register, classify risk, write impact assessments, test for unfair outcomes, design human oversight, write policies people follow, respond to AI incidents, question vendors and their contracts, and run a governance programme with metrics leadership can act on.

The labs are done on the platform, and the capstone is a full AI governance pack for an organisation you know, reviewed by a person. This track is general education, not legal advice, and it is not affiliated with or official preparation for any certification body or standard.`,
  level: "advanced",
  status: "live",
  sortOrder: 11,
  accentColor: "#0F766E",
  certificateName: "TIBLOGICS Certified: AI Governance, Risk and Compliance",
  audience:
    "Managers, compliance, risk, legal, HR and IT leads, public sector staff and founders responsible for how AI is used and bought in their organisation.",
  outcomes: [
    "Explain how AI fails in organisations and map governance as a system of owners, incentives and feedback loops",
    "Describe risk-based AI regulation, data protection duties and the main frameworks and standards in accurate general terms",
    "Build an AI use-case register, classify risk consistently and write impact assessments including DPIAs",
    "Design acceptable use policies, human oversight, documentation, monitoring and incident response that work in practice",
    "Run vendor due diligence, spot weak contract terms and set governance gates for in-house builds",
    "Set up and run an AI governance programme with clear roles, paired metrics and a realistic 90-day plan",
  ],
  // Lessons total 613 minutes.
  estimatedHours: 10,
  estimatedWeeksAt3Hrs: 4,
  modules: [
    ...GOV_MODULE_1,
    ...GOV_MODULE_2,
    ...GOV_MODULE_3,
    ...GOV_MODULE_4,
    ...GOV_MODULE_5,
    ...GOV_MODULE_6,
  ].map(spreadModule),
  labs: GOV_LABS,
  finalExam: { ...GOV_FINAL_EXAM, questions: GOV_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: GOV_CAPSTONE,
};
