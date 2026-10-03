import type { StudioToolMeta } from "../types";

// Metadata for the "loop-mapper" Studio tool. The component lives in
// components/learn/studio/tools/loop-mapper.tsx; its text in
// lib/i18n/messages/studio-loop-mapper.ts. Challenge ids must match
// components/learn/studio/tools/loops/challenges.ts.
export const loopMapper: StudioToolMeta = {
  id: "loop-mapper",
  icon: "🔁",
  tracks: ["ai-foundations", "ai-practitioner", "ai-systems-expert", "ai-small-business", "ai-forward-professional", "ai-for-parents", "ai-ml-fundamentals", "ai-governance", "ai-apps-agents"],
  challenges: [
    { id: "reviews-loop", difficulty: 1 },
    { id: "capacity-limit", difficulty: 2 },
    { id: "review-bottleneck", difficulty: 2 },
    { id: "tech-debt", difficulty: 2 },
    { id: "screen-time", difficulty: 2 },
    { id: "goodhart", difficulty: 3 },
    { id: "ai-adoption", difficulty: 3 },
  ],
  ready: true,
};
