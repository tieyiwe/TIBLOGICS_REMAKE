import type { StudioToolMeta } from "../types";
import { YOUTH_SLUGS } from "@/lib/learn/youth";

// Metadata for the "system-mapper" Studio tool (AI-Empowered Youth): stock and
// flow diagrams with + / - arrows, a step-by-step simulation and a chart.
// Component: components/learn/studio/tools/youth/system-mapper.tsx (model in
// ./system-model.ts); text: lib/i18n/messages/studio-youth.ts.
export const systemMapper: StudioToolMeta = {
  id: "system-mapper",
  icon: "🗺️",
  tracks: [...YOUTH_SLUGS],
  challenges: [
    { id: "lunch-queue", difficulty: 1 },
    { id: "game-economy", difficulty: 2 },
    { id: "feedback-loops", difficulty: 3 },
  ],
  ready: true,
};
