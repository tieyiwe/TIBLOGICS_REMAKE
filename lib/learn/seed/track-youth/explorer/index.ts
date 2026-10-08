import type { SeedModule, SeedTrack } from "../../types";
import { spreadModule } from "../../balance";
import { YOUTH_EXPLORER } from "../../../youth";
import { YOUTH_EXPLORER_S1_LABS, YOUTH_EXPLORER_S1_MODULES } from "./season-1";
import { YOUTH_EXPLORER_S2_LABS, YOUTH_EXPLORER_S2_MODULES } from "./season-2";

// AI-Empowered Youth: Think, Build, Lead. Explorer lane, ages 10 to 13.
// 15 modules in 4 seasons, shared with the Builder lane (../builder) at a
// younger pitch. Season 1 is modules 1-3, Season 2 modules 4-7; Seasons 3
// and 4, the final exam and the capstone come later. Labs carry their own
// 1-based moduleNumber, so seasons must stay in order here.

const modules: SeedModule[] = [...YOUTH_EXPLORER_S1_MODULES, ...YOUTH_EXPLORER_S2_MODULES].map(spreadModule);

// Advertised hours always follow the lessons, so adding a season never
// trips assertDurationConsistency.
const minutes = modules.reduce((n, m) => n + m.lessons.reduce((x, l) => x + l.durationMinutes, 0), 0);

export const AI_YOUTH_EXPLORER: SeedTrack = {
  slug: YOUTH_EXPLORER,
  title: "AI-Empowered Youth: Think, Build, Lead (Explorer, ages 10-13)",
  tagline: "The skills that shape tomorrow. Discover how the AI in your world really works, then learn to think, build and lead with it.",
  description: `AI already shapes your world: the videos in your feed, the characters in your games, the filters on your camera, the voice assistant in the kitchen. Explorer helps you understand it, question it and use it to make things, in short, playful lessons made for ages 10 to 13.

The program runs in four seasons. **Season 1, Understand**, opens the box: how your feed learns what you like, what is really inside an AI "brain", and how the AI in your games and phone works. Later seasons move from understanding to thinking critically with AI, building your own projects with no-code tools, and leading: using AI fairly, safely and to help the people around you.

Every lesson follows the same rhythm: learn one clear idea with an everyday example from school, football, music, gaming or family life; play with it in an interactive tool; build or do something small; and reflect. Along the way you practise the thinking tools that matter far beyond AI: first principles, the 5 Whys, systems maps, claim-evidence-reasoning, the debugging mindset and explaining it back.

Everything happens on the page. The practice AI runs on ARFA's own safe system, so there are no outside accounts to create and no personal details to share.`,
  level: "beginner",
  status: "coming_soon",
  sortOrder: 15,
  accentColor: "#7C3AED",
  certificateName: "AI-Empowered Youth: Explorer",
  audience:
    "Young people aged 10 to 13 who are curious about the AI in their apps, games and phones. No coding or technical background needed. Parents and carers can follow along.",
  outcomes: [
    "Explain how video and social feeds learn from your signals, and steer your own feed",
    "Describe how AI learns from examples, in your own words, and why it makes mistakes",
    "Spot unfair training data and explain why it leads to unfair AI",
    "Explain how game characters, camera filters, voice assistants and autocomplete work",
    "Use thinking tools like first principles, the 5 Whys and systems maps on real problems",
    "Use AI safely: keep personal details private and check what AI tells you",
  ],
  estimatedHours: Math.round((minutes / 60) * 10) / 10,
  modules,
  labs: [...YOUTH_EXPLORER_S1_LABS, ...YOUTH_EXPLORER_S2_LABS],
};
