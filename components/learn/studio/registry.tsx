"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { StudioToolProps } from "@/lib/learn/studio/types";

// Tool components, loaded on demand so a lesson only downloads the tool it
// embeds. Add new tools here and in lib/learn/studio/catalog.ts.
const load = (f: () => Promise<{ default: ComponentType<StudioToolProps> }>) =>
  dynamic(f, { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-[var(--s2)]" /> });

export const STUDIO_COMPONENTS: Record<string, ComponentType<StudioToolProps>> = {
  "automation-builder": load(() => import("./tools/automation-builder")),
  "loop-mapper": load(() => import("./tools/loop-mapper")),
  "prompt-builder": load(() => import("./tools/prompt-builder")),
  "task-sorter": load(() => import("./tools/task-sorter")),
  "spot-the-risk": load(() => import("./tools/spot-the-risk")),
  "wireframe-builder": load(() => import("./tools/wireframe-builder")),
  "prompt-arena": load(() => import("./tools/prompt-arena")),
  "critic-mode": load(() => import("./tools/critic-mode")),
  "test-bench": load(() => import("./tools/test-bench")),
};
