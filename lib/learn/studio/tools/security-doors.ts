import type { StudioToolMeta } from "../types";

// Metadata for the "security-doors" Studio tool (the 30 Doors pre-launch
// security audit). The component lives in
// components/learn/studio/tools/security-doors/ (doors in ./doors.ts); its
// interface text in lib/i18n/messages/studio-security-doors.ts.
// Challenges: one per door group, in lesson order, then the full launch audit.
// Lessons in other tracks embed focused views (view-owner, view-agents...),
// which are not challenges and earn no points.
export const securityDoors: StudioToolMeta = {
  id: "security-doors",
  icon: "🚪",
  tracks: [
    "vibe-coding-engineer",
    "ai-apps-agents",
    "ai-practitioner",
    "ai-systems-expert",
    "ai-small-business",
    "practical-prompt-engineering",
    "ai-governance",
    "ai-forward-professional",
    "ai-ml-fundamentals",
  ],
  challenges: [
    { id: "push", difficulty: 1 },
    { id: "auth", difficulty: 2 },
    { id: "input", difficulty: 2 },
    { id: "ai", difficulty: 3 },
    { id: "launch", difficulty: 3 },
  ],
  ready: true,
};
