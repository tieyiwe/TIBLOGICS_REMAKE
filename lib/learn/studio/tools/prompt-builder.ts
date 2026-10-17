import type { StudioToolMeta } from "../types";

// Metadata for the "prompt-builder" Studio tool. The component lives in
// components/learn/studio/tools/prompt-builder.tsx; its text in
// lib/i18n/messages/studio-prompt-builder.ts.
export const promptBuilder: StudioToolMeta = {
  id: "prompt-builder",
  icon: "🧱",
  tracks: ["practical-prompt-engineering", "ai-foundations", "ai-practitioner", "ai-forward-professional", "ai-small-business", "ai-ml-fundamentals"],
  challenges: [
    { id: "client-email", difficulty: 1 },
    { id: "policy-summary", difficulty: 1 },
    { id: "pilot-plan", difficulty: 2 },
    { id: "spreadsheet", difficulty: 2 },
    { id: "four-day-week", difficulty: 3 },
  ],
  ready: true,
};
