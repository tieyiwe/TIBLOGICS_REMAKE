import type { SeedModule, SeedTrack } from "../../types";
import { spreadModule } from "../../balance";
import { YOUTH_BUILDER } from "../../../youth";
import { YOUTH_BUILDER_S1_LABS, YOUTH_BUILDER_S1_MODULES } from "./season-1";
import { YOUTH_BUILDER_S2_LABS, YOUTH_BUILDER_S2_MODULES } from "./season-2";
import { YOUTH_BUILDER_S3_LABS, YOUTH_BUILDER_S3_MODULES } from "./season-3";

// AI-Empowered Youth: Think, Build, Lead. Builder lane, ages 14 to 17.
// Same 15 modules in 4 seasons as the Explorer lane (../explorer), taken
// deeper, with code where it helps. Season 1 is modules 1-3, Season 2
// modules 4-7, Season 3 modules 8-12; Season 4, the final exam and the
// capstone come later.
// Labs carry their own 1-based moduleNumber, so seasons must stay in order.

const modules: SeedModule[] = [...YOUTH_BUILDER_S1_MODULES, ...YOUTH_BUILDER_S2_MODULES, ...YOUTH_BUILDER_S3_MODULES].map(spreadModule);

// Advertised hours always follow the lessons, so adding a season never
// trips assertDurationConsistency.
const minutes = modules.reduce((n, m) => n + m.lessons.reduce((x, l) => x + l.durationMinutes, 0), 0);

export const AI_YOUTH_BUILDER: SeedTrack = {
  slug: YOUTH_BUILDER,
  title: "AI-Empowered Youth: Think, Build, Lead (Builder, ages 14-17)",
  tagline: "The skills that shape tomorrow. Take AI apart, build with it, and lead how it is used.",
  description: `You will graduate into a world where AI is part of every job, every business and every decision. Builder is for teenagers aged 14 to 17 who want to understand AI properly, think sharply about it and build real things with it, not just scroll past it.

The program runs in four seasons. **Season 1, Understand**, takes the AI in your world apart: the recommendation engine behind your feed and what it is really optimising, how neural networks learn (with code you run and change on the page), why models fail and become unfair, and the engineering behind game AI, pathfinding, face unlock, voice assistants and on-device AI. Later seasons move from understanding to thinking critically with AI, building your own projects and tools, and leading: making the case for AI used fairly and well in your school, community or future business.

Every lesson follows one rhythm: learn the real concept with an example from your world, play with it in an interactive tool or code playground, build something, and reflect. You will use the thinking tools engineers, scientists and founders rely on: first principles, the 5 Whys, systems maps and feedback loops, Goodhart's law, claim-evidence-reasoning and the debugging mindset. The labs are harder: audit and redesign a recommender, peer-review an AI project, program a game character that cannot be tricked.

Everything happens on the platform. The practice AI runs on ARFA's own safe system, so there are no outside accounts to create and no personal details to share.`,
  level: "beginner",
  status: "coming_soon",
  sortOrder: 16,
  accentColor: "#2563EB",
  certificateName: "AI-Empowered Youth: Builder",
  audience:
    "Teenagers aged 14 to 17 who want to understand how AI works and build with it. No coding experience needed; code is introduced gently where it helps. Parents and carers can follow along.",
  outcomes: [
    "Explain the pipeline behind a recommendation feed and redesign its objective with Goodhart's law in mind",
    "Describe how a neural network learns, including weights, loss and gradient descent, and train one in code",
    "Diagnose model failures such as overfitting, shortcuts and distribution shift, and test for bias by group",
    "Explain how game AI, pathfinding, face recognition and voice assistants work, and their trade-offs",
    "Decide where an AI feature should run, on device or in the cloud, with a reasoned argument",
    "Apply systems thinking, the 5 Whys and claim-evidence-reasoning to real problems",
    "Write prompts as specs, test them against criteria and turn the best into reusable templates",
    "Create stories, art, music, web apps and games with AI while respecting copyright, consent and disclosure",
    "Design, red-team and safely automate a helper bot, with a human in the loop where it matters",
  ],
  estimatedHours: Math.round((minutes / 60) * 10) / 10,
  modules,
  labs: [...YOUTH_BUILDER_S1_LABS, ...YOUTH_BUILDER_S2_LABS, ...YOUTH_BUILDER_S3_LABS],
};
