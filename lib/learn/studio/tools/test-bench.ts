import type { StudioToolMeta } from "../types";

// Metadata for the "test-bench" Studio tool. The component lives in
// components/learn/studio/tools/test-bench.tsx; its text in
// lib/i18n/messages/studio-test-bench.ts.
export const testBench: StudioToolMeta = {
  id: "test-bench",
  icon: "🧪",
  tracks: [
    "practical-prompt-engineering",
    "ai-foundations",
    "ai-practitioner",
    "ai-forward-professional",
    "ai-small-business",
    "ai-systems-expert",
    "vibe-coding-engineer",
  ],
  challenges: [
    { id: "pick-best", difficulty: 1 },
    { id: "catch-planted", difficulty: 2 },
    { id: "expose-weak", difficulty: 3 },
  ],
  ready: true,
};
