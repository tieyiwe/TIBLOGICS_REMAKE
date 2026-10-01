import type { StudioToolMeta } from "../types";

// Metadata for the "task-sorter" Studio tool. The component lives in
// components/learn/studio/tools/task-sorter.tsx (decks in ./sorter/decks.ts);
// its interface text in lib/i18n/messages/studio-task-sorter.ts.
// Challenge ids are the deck ids.
export const taskSorter: StudioToolMeta = {
  id: "task-sorter",
  icon: "🗂️",
  tracks: ["ai-forward-professional", "ai-small-business", "ai-practitioner", "ai-foundations", "ai-ml-fundamentals", "ai-governance", "ai-apps-agents"],
  challenges: [
    { id: "office", difficulty: 1 },
    { id: "teacher", difficulty: 1 },
    { id: "shop", difficulty: 1 },
    { id: "healthcare", difficulty: 2 },
    { id: "sales", difficulty: 2 },
    { id: "social", difficulty: 3 },
  ],
  ready: true,
};
