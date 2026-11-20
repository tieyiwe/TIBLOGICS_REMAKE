import type { StudioToolMeta } from "../types";

// Metadata for the "wireframe-builder" Studio tool. The component lives in
// components/learn/studio/tools/wireframe-builder.tsx (challenge checks in
// ./wireframe/); its text in lib/i18n/messages/studio-wireframe-builder.ts.
export const wireframeBuilder: StudioToolMeta = {
  id: "wireframe-builder",
  icon: "📐",
  tracks: ["vibe-coding-engineer", "ai-small-business", "ai-forward-professional"],
  challenges: [
    { id: "todo-empty", difficulty: 1 },
    { id: "bill-splitter", difficulty: 1 },
    { id: "login-forgot", difficulty: 2 },
    { id: "shop-product", difficulty: 2 },
    { id: "salon-booking", difficulty: 3 },
  ],
  ready: true,
};
