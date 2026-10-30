import { YOUTH_BUILDER } from "@/lib/learn/youth";
import type { StudioToolMeta } from "../types";

// Metadata for the "prompt-arena" Studio tool. The component lives in
// components/learn/studio/tools/prompt-arena.tsx; its text in
// lib/i18n/messages/studio-prompt-arena.ts.
export const promptArena: StudioToolMeta = {
  id: "prompt-arena",
  icon: "⚔️",
  tracks: ["practical-prompt-engineering", "ai-foundations", "ai-practitioner", "ai-forward-professional", "ai-small-business", "ai-ml-fundamentals", YOUTH_BUILDER],
  challenges: [
    { id: "rookie", difficulty: 1 },
    { id: "pro", difficulty: 2 },
    { id: "master", difficulty: 3 },
  ],
  ready: true,
};
