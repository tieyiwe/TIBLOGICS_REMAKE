// Colours and marks for mastery states. Colour is never the only signal:
// every state also shows its text label and a distinct symbol.
import type { GridState, MasteryLevel, PathStep } from "@/lib/learn/mastery/rules";

export const LEVEL_STYLE: Record<MasteryLevel, { mark: string; cls: string }> = {
  mastered: { mark: "★", cls: "border-green-600 bg-green-50 text-green-900" },
  partial: { mark: "◐", cls: "border-amber-500 bg-amber-50 text-amber-900" },
  new: { mark: "○", cls: "border-slate-300 bg-slate-50 text-slate-700" },
};

export const GRID_STYLE: Record<GridState, { mark: string; cls: string }> = {
  mastered: { mark: "★", cls: "border-green-600 bg-green-50 text-green-900" },
  partial: { mark: "◐", cls: "border-sky-500 bg-sky-50 text-sky-900" },
  weak: { mark: "!", cls: "border-red-500 bg-red-50 text-red-900" },
  new: { mark: "○", cls: "border-slate-300 bg-slate-50 text-slate-700" },
};

export const STEP_STYLE: Record<PathStep, { mark: string; cls: string }> = {
  skip: { mark: "⤼", cls: "border-green-600 bg-green-50 text-green-900" },
  skim: { mark: "◐", cls: "border-amber-500 bg-amber-50 text-amber-900" },
  study: { mark: "●", cls: "border-sky-600 bg-sky-50 text-sky-900" },
};
