import type { StudioToolMeta } from "../types";
import { YOUTH_SLUGS } from "@/lib/learn/youth";

// Metadata for the "teach-the-machine" Studio tool (AI-Empowered Youth): train
// a tiny image classifier in the browser (k-nearest neighbours on 16x16
// grayscale grids). Component:
// components/learn/studio/tools/youth/teach-the-machine.tsx; text:
// lib/i18n/messages/studio-youth.ts.
export const teachTheMachine: StudioToolMeta = {
  id: "teach-the-machine",
  icon: "🧠",
  tracks: [...YOUTH_SLUGS],
  challenges: [
    { id: "two-classes", difficulty: 1 },
    { id: "trick-it", difficulty: 2 },
    { id: "fair-data", difficulty: 3 },
  ],
  ready: true,
};
