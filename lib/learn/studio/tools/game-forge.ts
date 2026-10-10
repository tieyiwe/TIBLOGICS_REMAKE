import type { StudioToolMeta } from "../types";
import { YOUTH_SLUGS } from "@/lib/learn/youth";

// Metadata for the "game-forge" Studio tool (AI-Empowered Youth, flagship):
// pick a game template, change it by talking to AI or with the controls, add
// AI characters, and share a playable link with family. Unlike the other
// Studio tools it saves projects on the server and can call a model (cheap
// tier, child-safe prompt, daily caps). Component:
// components/learn/studio/tools/youth/game-forge.tsx; game logic and engine:
// lib/learn/game-forge/; text: lib/i18n/messages/studio-game-forge.ts.
export const gameForge: StudioToolMeta = {
  id: "game-forge",
  icon: "🎮",
  tracks: [...YOUTH_SLUGS],
  challenges: [
    { id: "clicker-remix", difficulty: 1 },
    { id: "quiz-maker", difficulty: 2 },
    { id: "platformer-levels", difficulty: 3 },
    { id: "npc-friend", difficulty: 3 },
  ],
  ready: true,
};
