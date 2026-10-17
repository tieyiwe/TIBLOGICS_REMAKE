import type { StudioToolMeta } from "../types";
import { YOUTH_SLUGS } from "@/lib/learn/youth";

// Metadata for the "feed-simulator" Studio tool (AI-Empowered Youth): a
// pretend video app whose recommendation algorithm the learner can watch and
// tune. Component: components/learn/studio/tools/youth/feed-simulator.tsx
// (posts in ./feed-data.ts); text: lib/i18n/messages/studio-youth.ts.
export const feedSimulator: StudioToolMeta = {
  id: "feed-simulator",
  icon: "📱",
  tracks: [...YOUTH_SLUGS],
  challenges: [
    { id: "your-feed", difficulty: 1 },
    { id: "filter-bubble", difficulty: 2 },
    { id: "break-the-bubble", difficulty: 3 },
  ],
  ready: true,
};
