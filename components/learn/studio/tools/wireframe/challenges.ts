// Wireframe Builder challenges: each has required checks (all must pass for
// 1 star) plus two shared polish checks for the 2nd and 3rd star. Check
// labels live in lib/i18n/messages/studio-wireframe-builder.ts as
// "studio.wireframe-builder.ch.<challenge>.<check>" and ".polish.<check>".

import { outLinks, type CType, type Design, type Screen } from "./model";

export interface Check {
  id: string;
  test: (d: Design, tabDefault: string) => boolean;
}

export interface WfChallenge {
  id: string;
  icon: string;
  difficulty: 1 | 2 | 3;
  checks: Check[];
}

const all = (d: Design) => d.screens.flatMap((s) => s.comps);
const count = (d: Design, type: CType) => all(d).filter((c) => c.type === type).length;
const has = (s: Screen, type: CType) => s.comps.some((c) => c.type === type);

/** An error message directly above or below an input on the same screen. */
export const errorNearInput = (d: Design) =>
  d.screens.some((s) =>
    s.comps.some((c, i) => c.type === "error" && (s.comps[i - 1]?.type === "input" || s.comps[i + 1]?.type === "input")),
  );

/** A screen with a list also has an empty state. */
const listWithEmpty = (d: Design) => d.screens.some((s) => has(s, "list") && has(s, "empty"));

/** Some button links to a different screen. */
const buttonLinks = (d: Design) => d.screens.some((s) => s.comps.some((c) => c.type === "button" && c.link && c.link !== s.id));

/** Every screen you can reach has a way back to a screen that led there. */
export const wayBack = (d: Design, tabDefault: string) => {
  const links = new Map(d.screens.map((s) => [s.id, outLinks(d, s, tabDefault)]));
  let anyTarget = false;
  for (const s of d.screens) {
    const from = d.screens.filter((a) => links.get(a.id)?.has(s.id));
    if (!from.length) continue;
    anyTarget = true;
    if (!from.some((a) => links.get(s.id)?.has(a.id))) return false;
  }
  return anyTarget;
};

/** Screens reached from the first screen (directly). */
const linkedFromFirst = (d: Design, tabDefault: string): Screen[] => {
  const first = d.screens[0];
  if (!first) return [];
  const out = outLinks(d, first, tabDefault);
  return d.screens.filter((s) => out.has(s.id));
};

export const WF_CHALLENGES: WfChallenge[] = [
  {
    id: "todo-empty",
    icon: "✅",
    difficulty: 1,
    checks: [
      { id: "input", test: (d) => count(d, "input") >= 1 },
      { id: "button", test: (d) => count(d, "button") >= 1 },
      { id: "list", test: (d) => count(d, "list") >= 1 },
      { id: "empty", test: listWithEmpty },
    ],
  },
  {
    id: "bill-splitter",
    icon: "🧾",
    difficulty: 1,
    checks: [
      { id: "inputs", test: (d) => count(d, "input") >= 2 },
      { id: "button", test: (d) => count(d, "button") >= 1 },
      { id: "error", test: errorNearInput },
      { id: "result", test: (d) => count(d, "text") + count(d, "card") >= 1 },
    ],
  },
  {
    id: "login-forgot",
    icon: "🔑",
    difficulty: 2,
    checks: [
      { id: "inputs", test: (d) => count(d, "input") >= 2 },
      { id: "button", test: (d) => count(d, "button") >= 1 },
      { id: "error", test: errorNearInput },
      { id: "forgot", test: (d, td) => linkedFromFirst(d, td).length >= 1 },
      { id: "resetInput", test: (d, td) => linkedFromFirst(d, td).some((s) => has(s, "input")) },
      { id: "back", test: wayBack },
    ],
  },
  {
    id: "shop-product",
    icon: "👟",
    difficulty: 2,
    checks: [
      { id: "image", test: (d) => count(d, "image") >= 1 },
      { id: "details", test: (d) => count(d, "header") >= 1 && count(d, "text") >= 1 },
      { id: "cart", test: buttonLinks },
      { id: "cartList", test: (d, td) => linkedFromFirst(d, td).some((s) => has(s, "list") || has(s, "card")) },
      { id: "back", test: wayBack },
    ],
  },
  {
    id: "salon-booking",
    icon: "💇",
    difficulty: 3,
    checks: [
      { id: "services", test: (d) => count(d, "list") >= 1 || count(d, "card") >= 2 },
      { id: "screens", test: (d) => d.screens.length >= 3 },
      { id: "form", test: (d) => d.screens.some((s) => s.comps.filter((c) => c.type === "input").length >= 2) },
      { id: "error", test: errorNearInput },
      { id: "confirm", test: (d) => d.screens.filter((s) => s.comps.some((c) => c.type === "button" && c.link && c.link !== s.id)).length >= 2 },
      { id: "back", test: wayBack },
    ],
  },
];

export const WF_BY_ID = new Map(WF_CHALLENGES.map((c) => [c.id, c]));

/** 2nd star: inputs, buttons, errors and empty states all have real labels. */
export const polishLabels = (d: Design) => {
  const need = all(d).filter((c) => ["input", "button", "error", "empty"].includes(c.type));
  return need.length > 0 && need.every((c) => c.label.trim().length > 0);
};

/** 3rd star: every button and error message says what happens (a note or a link). */
export const polishNotes = (d: Design) => {
  const need = all(d).filter((c) => c.type === "button" || c.type === "error");
  return need.length > 0 && need.every((c) => c.note.trim().length > 0 || (c.type === "button" && !!c.link));
};
