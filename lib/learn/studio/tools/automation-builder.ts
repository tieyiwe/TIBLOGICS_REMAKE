import type { StudioToolMeta } from "../types";

// Metadata for the "automation-builder" Studio tool. The component lives in
// components/learn/studio/tools/automation-builder.tsx; its text in
// lib/i18n/messages/studio-automation-builder.ts. Challenge ids must match
// components/learn/studio/tools/automation/challenges.ts.
export const automationBuilder: StudioToolMeta = {
  id: "automation-builder",
  icon: "⚙️",
  tracks: ["ai-practitioner", "ai-small-business", "ai-systems-expert", "ai-forward-professional", "vibe-coding-engineer", "ai-ml-fundamentals", "ai-apps-agents"],
  challenges: [
    { id: "support-triage", difficulty: 1 },
    { id: "weekly-report", difficulty: 1 },
    { id: "faq-autoreply", difficulty: 2 },
    { id: "invoice-chaser", difficulty: 2 },
    { id: "content-pipeline", difficulty: 2 },
    { id: "lead-intake", difficulty: 3 },
    { id: "social-monitor", difficulty: 3 },
  ],
  ready: true,
};
