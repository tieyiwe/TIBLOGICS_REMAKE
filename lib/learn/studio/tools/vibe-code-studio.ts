import type { StudioToolMeta } from "../types";
import { YOUTH_SLUGS } from "@/lib/learn/youth";

// Metadata for the "vibe-code-studio" Studio tool (AI-Empowered Youth): the
// young person describes an app, the AI builds it as one offline HTML file,
// it runs in a locked sandbox, and they test, fix and iterate. Unlike the
// other Studio tools it calls a model (app/api/learn/studio/vibe/*), for
// learners holding a youth lane. Component:
// components/learn/studio/tools/youth/vibe-code-studio.tsx; rules:
// lib/learn/vibe/; text: lib/i18n/messages/studio-youth.ts. Free building is
// the "sandbox" mode (vibe-code-studio:sandbox), as in the other youth tools.
export const vibeCodeStudio: StudioToolMeta = {
  id: "vibe-code-studio",
  icon: "🪄",
  tracks: [...YOUTH_SLUGS],
  challenges: [
    { id: "first-app", difficulty: 1 },
    { id: "fix-it", difficulty: 2 },
    { id: "level-up", difficulty: 3 },
  ],
  ready: true,
};
