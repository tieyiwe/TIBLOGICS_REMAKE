// Browser-side state of the Learning Loop steps that have no server record:
// "read to the end" and "ran the practice pad". Kept per lesson in
// localStorage; every read and write tolerates storage being unavailable,
// in which case the step simply waits for its server-side signal.

export const LOOP_EVENT = "tib:loop";

export type LoopStep = "understand" | "try" | "play" | "apply" | "reflect";

export interface LoopEventDetail {
  lessonId: string;
  step: LoopStep;
  done: boolean;
}

const key = (lessonId: string) => `tib:loop:${lessonId}`;

export function readLoop(lessonId: string): Partial<Record<LoopStep, boolean>> {
  try {
    const raw = window.localStorage.getItem(key(lessonId));
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" ? (v as Partial<Record<LoopStep, boolean>>) : {};
  } catch {
    return {};
  }
}

/** Record a step for this lesson (browser only) and tell the loop strip. */
export function markLoop(lessonId: string, step: LoopStep, done = true): void {
  if (typeof window === "undefined") return;
  try {
    if (step === "understand" || step === "try") {
      const cur = readLoop(lessonId);
      if (cur[step] !== done) {
        cur[step] = done;
        window.localStorage.setItem(key(lessonId), JSON.stringify(cur));
      }
    }
  } catch {
    /* storage unavailable: the strip still updates for this page view */
  }
  window.dispatchEvent(new CustomEvent<LoopEventDetail>(LOOP_EVENT, { detail: { lessonId, step, done } }));
}
