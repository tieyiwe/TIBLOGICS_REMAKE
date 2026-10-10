import type { StudioToolMeta } from "../types";

// Metadata for the "spot-the-risk" Studio tool. The component lives in
// components/learn/studio/tools/spot-the-risk.tsx (cards in ./risk/decks.ts);
// its interface text in lib/i18n/messages/studio-spot-the-risk.ts.
// Challenge ids are the deck ids.
export const spotTheRisk: StudioToolMeta = {
  id: "spot-the-risk",
  icon: "🚨",
  tracks: ["ai-foundations", "ai-for-parents", "vibe-coding-engineer", "ai-small-business", "ai-forward-professional", "ai-ml-fundamentals", "ai-governance", "ai-apps-agents"],
  challenges: [
    { id: "privacy", difficulty: 1 },
    { id: "kids", difficulty: 1 },
    { id: "marketing", difficulty: 2 },
    { id: "workplace", difficulty: 2 },
    { id: "scams", difficulty: 2 },
    { id: "code", difficulty: 3 },
  ],
  ready: true,
};
