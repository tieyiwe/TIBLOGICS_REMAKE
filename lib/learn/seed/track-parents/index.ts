import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { PARENTS_MODULES_1_TO_3 } from "./modules-1-3";
import { PARENTS_MODULES_4_TO_6 } from "./modules-4-6";
import { PARENTS_CAPSTONE, PARENTS_FINAL_EXAM, PARENTS_LABS } from "./assessments";
import { PARENTS_DOORS_LESSON, PARENTS_DOORS_QUIZ } from "./security-doors";

// Specialist track for parents and carers. Module 3 teaches the TIBLOGICS
// In-Story approach at the level the founder has described it publicly;
// extend it with the method's own steps when ready.

export const AI_FOR_PARENTS: SeedTrack = {
  slug: "ai-for-parents",
  title: "AI for Parents: Raising Confident, Safe Learners",
  tagline: "Use AI to help your child learn more, not think less, and keep them safe while they do.",
  description: `Your child is already meeting AI: in homework apps, games, voice assistants and chatbots. This track helps you turn it into a patient tutor instead of an answer machine, and keep your family safe while you do.

You will learn how to explain AI to your child at their age, set up tutoring prompts that make them think, build personalised learning stories with the TIBLOGICS In-Story approach, protect their privacy, prepare for scams and deepfakes, talk about AI companions, and agree a family AI plan together.

It is practical from the first lesson: every lesson has prompts you can run on the page and use with your child tonight. The labs are done on the platform, and the capstone is a two-week learning sprint with your own child. No technical background needed.`,
  level: "beginner",
  status: "live",
  sortOrder: 5,
  accentColor: "#0F9D8A",
  certificateName: "TIBLOGICS Certificate: AI for Parents",
  audience:
    "Parents, carers and grandparents of children aged roughly 5 to 17, and anyone who supports children's learning at home. No technical background needed.",
  outcomes: [
    "Explain what AI is to your child, in words that fit their age",
    "Set up AI as a Socratic tutor that helps your child think instead of handing over answers",
    "Create personalised learning stories with the In-Story approach, and check the facts in them",
    "Protect your child's privacy and prepare your family for AI scams and deepfakes",
    "Recognise the risks of AI companions and talk about them calmly",
    "Agree a family AI plan with your child and work with their school",
  ],
  // Lessons total 545 minutes (523 plus "Keeping your family safe with AI apps").
  estimatedHours: 9,
  estimatedWeeksAt3Hrs: 5,
  // Module 4 ends with the family app-safety lesson (appended).
  modules: [...PARENTS_MODULES_1_TO_3, ...PARENTS_MODULES_4_TO_6]
    .map((m, i) => (i === 3 ? { ...m, lessons: [...m.lessons, PARENTS_DOORS_LESSON], quiz: [...(m.quiz ?? []), ...PARENTS_DOORS_QUIZ] } : m))
    .map(spreadModule),
  labs: PARENTS_LABS,
  finalExam: { ...PARENTS_FINAL_EXAM, questions: PARENTS_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: PARENTS_CAPSTONE,
};
