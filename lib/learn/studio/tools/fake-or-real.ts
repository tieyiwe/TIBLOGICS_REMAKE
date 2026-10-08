import type { StudioToolMeta } from "../types";
import { YOUTH_SLUGS } from "@/lib/learn/youth";

// Metadata for the "fake-or-real" Studio tool (AI-Empowered Youth): a timed
// card game about misinformation and AI-made media. Component:
// components/learn/studio/tools/youth/fake-or-real.tsx (cards in
// ./fake-data.ts); text: lib/i18n/messages/studio-youth.ts.
export const fakeOrReal: StudioToolMeta = {
  id: "fake-or-real",
  icon: "🕵️",
  tracks: [...YOUTH_SLUGS],
  challenges: [
    { id: "warm-up", difficulty: 1 },
    { id: "deepfake-tells", difficulty: 2 },
    { id: "fact-check", difficulty: 3 },
  ],
  ready: true,
};
