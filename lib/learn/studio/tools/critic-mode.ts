import type { StudioToolMeta } from "../types";

// Metadata for the "critic-mode" Studio tool. The component lives in
// components/learn/studio/tools/critic-mode.tsx; its text in
// lib/i18n/messages/studio-critic-mode.ts.
export const criticMode: StudioToolMeta = {
  id: "critic-mode",
  icon: "🧐",
  tracks: ["practical-prompt-engineering", "ai-foundations", "ai-practitioner", "ai-forward-professional", "ai-small-business", "ai-governance"],
  challenges: [
    { id: "bakery", difficulty: 1 },
    { id: "launch", difficulty: 1 },
    { id: "clinic-policy", difficulty: 2 },
    { id: "screen-ban", difficulty: 2 },
    { id: "json-file", difficulty: 3 },
  ],
  ready: true,
};
