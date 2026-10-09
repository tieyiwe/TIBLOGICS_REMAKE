import type { StudioToolMeta } from "./types";
import { automationBuilder } from "./tools/automation-builder";
import { loopMapper } from "./tools/loop-mapper";
import { promptBuilder } from "./tools/prompt-builder";
import { taskSorter } from "./tools/task-sorter";
import { spotTheRisk } from "./tools/spot-the-risk";
import { wireframeBuilder } from "./tools/wireframe-builder";
import { promptArena } from "./tools/prompt-arena";
import { criticMode } from "./tools/critic-mode";
import { testBench } from "./tools/test-bench";
import { securityDoors } from "./tools/security-doors";
import { teachTheMachine } from "./tools/teach-the-machine";
import { feedSimulator } from "./tools/feed-simulator";
import { fakeOrReal } from "./tools/fake-or-real";
import { systemMapper } from "./tools/system-mapper";
import { vibeCodeStudio } from "./tools/vibe-code-studio";

// Every Studio tool. Safe to import on the server and in the browser.
export const STUDIO_TOOLS: StudioToolMeta[] = [
  automationBuilder,
  loopMapper,
  promptBuilder,
  taskSorter,
  spotTheRisk,
  wireframeBuilder,
  promptArena,
  criticMode,
  testBench,
  securityDoors,
  // AI-Empowered Youth (ages 10 to 17).
  teachTheMachine,
  feedSimulator,
  fakeOrReal,
  systemMapper,
  vibeCodeStudio,
];

export const STUDIO_BY_ID = new Map(STUDIO_TOOLS.map((t) => [t.id, t]));

export function readyTools(): StudioToolMeta[] {
  return STUDIO_TOOLS.filter((t) => t.ready);
}

export function toolsForTrack(slug: string): StudioToolMeta[] {
  return readyTools().filter((t) => t.tracks.includes(slug));
}

export function isValidChallenge(toolId: string, challengeId: string): boolean {
  const t = STUDIO_BY_ID.get(toolId);
  return !!t && t.ready && t.challenges.some((c) => c.id === challengeId);
}

/**
 * Challenges unlock in order within a tool: the one before must be done
 * first. Returns the previous challenge id, or null for the first one.
 */
export function previousChallenge(toolId: string, challengeId: string): string | null {
  const list = STUDIO_BY_ID.get(toolId)?.challenges ?? [];
  const i = list.findIndex((c) => c.id === challengeId);
  return i > 0 ? list[i - 1].id : null;
}

/** Whether a challenge is open, given the learner's completed challenge ids for the tool. */
export function isUnlocked(toolId: string, challengeId: string, done: (id: string) => boolean): boolean {
  const prev = previousChallenge(toolId, challengeId);
  return !prev || done(prev) || done(challengeId);
}
