import type { SeedTrack } from "../types";
import { spreadAnswer, spreadModule } from "../balance";
import { ML_MODULE_1 } from "./module-1";
import { ML_MODULE_2 } from "./module-2";
import { ML_MODULE_3 } from "./module-3";
import { ML_MODULE_4 } from "./module-4";
import { ML_MODULE_5 } from "./module-5";
import { ML_MODULE_6 } from "./module-6";
import { ML_CAPSTONE, ML_FINAL_EXAM, ML_LABS } from "./assessments";

// Specialist track: a vendor-neutral technical foundation in how AI and
// machine learning work. Covers, in original words and examples, the ground
// behind entry-level cloud AI certifications. Not affiliated with, or drawn
// from, any vendor's certification material.

export const AI_ML_FUNDAMENTALS: SeedTrack = {
  slug: "ai-ml-fundamentals",
  title: "AI and Machine Learning Fundamentals",
  tagline: "Understand how AI and machine learning really work, well enough to speak credibly with engineers and choose the right solution.",
  description: `Most people who work with AI have never been shown how it actually works. This track gives you a solid, vendor-neutral technical foundation without asking you to write code.

You will learn how machines learn from data, what makes data fit for a model, and how the common model types work in plain terms. You will learn to read an evaluation properly: precision and recall, thresholds, error measures, and how to evaluate generative AI with test sets, rubrics and checked model judges. You will look inside foundation models (tokens, transformers, embeddings, retrieval-augmented generation, agents) and learn to apply them: choosing a model, deciding between prompting, retrieval and fine-tuning, estimating cost, and launching with monitoring and a real human in the loop. The final module covers fairness, privacy, security and governance, including risk-based regulation and recognised frameworks.

It covers the core topics behind entry-level cloud AI certifications, in plain language, so you can go on to sit them with confidence.

Lessons include small interactive demos you can edit, prompts you run on the page and Studio tools. Labs are done on the platform. The capstone is an AI solution proposal for a real problem in your own organisation, reviewed by a person.`,
  level: "intermediate",
  status: "live",
  sortOrder: 9,
  accentColor: "#0EA5E9",
  certificateName: "TIBLOGICS Certified: AI and Machine Learning Fundamentals",
  audience:
    "Professionals, analysts, managers and aspiring builders who want a solid technical foundation in how AI and machine learning work: enough to speak credibly with engineers, choose solutions, and prepare for entry-level cloud AI certifications. No coding required.",
  outcomes: [
    "Explain how machines learn, distinguish the main kinds of learning, and frame a business problem as a machine learning task, or recognise when it should not be one",
    "Assess data for quality and bias, and explain splitting, overfitting and the common model types in plain terms",
    "Choose and interpret evaluation metrics for classification, regression and generative AI, and tie them to business outcomes",
    "Explain tokens, transformers, embeddings, retrieval-augmented generation, hallucination and agents",
    "Choose a foundation model, decide between prompting, retrieval and fine-tuning, estimate running cost and plan a monitored launch with a human in the loop",
    "Assess an AI system for fairness, privacy and security risks, and outline proportionate governance using risk tiers and recognised frameworks",
  ],
  // Lessons total 607 minutes.
  estimatedHours: 10,
  estimatedWeeksAt3Hrs: 5,
  modules: [
    ...ML_MODULE_1,
    ...ML_MODULE_2,
    ...ML_MODULE_3,
    ...ML_MODULE_4,
    ...ML_MODULE_5,
    ...ML_MODULE_6,
  ].map(spreadModule),
  labs: ML_LABS,
  finalExam: { ...ML_FINAL_EXAM, questions: ML_FINAL_EXAM.questions.map(spreadAnswer) },
  capstone: ML_CAPSTONE,
};
