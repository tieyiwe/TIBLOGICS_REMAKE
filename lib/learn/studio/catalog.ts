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
