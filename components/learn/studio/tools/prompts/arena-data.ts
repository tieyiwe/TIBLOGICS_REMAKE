// Prompt Arena: rounds grouped into leagues. Every prompt and response is
// pre-written (text in lib/i18n/messages/studio-prompt-arena.ts).

export const TAGS = ["context", "format", "audience", "leading", "flattery", "verify", "constraints", "iterate"] as const;
export type Tag = (typeof TAGS)[number];

export interface Round {
  id: string;
  tags: Tag[];
  decoy: 1 | 2 | 3;
}

export const LEAGUES: Record<string, Round[]> = {
  rookie: [
    { id: "parent-grade", tags: ["context", "audience", "format"], decoy: 1 },
    { id: "contract", tags: ["audience", "format", "verify"], decoy: 2 },
    { id: "meal-plan", tags: ["context", "constraints", "format"], decoy: 3 },
  ],
  pro: [
    { id: "missed-appt", tags: ["constraints", "audience", "format"], decoy: 2 },
    { id: "debug", tags: ["context", "verify", "format"], decoy: 1 },
    { id: "crm", tags: ["context", "constraints", "verify"], decoy: 3 },
  ],
  master: [
    { id: "school-week", tags: ["leading", "verify"], decoy: 3 },
    { id: "coffee-cart", tags: ["flattery", "verify"], decoy: 1 },
    { id: "grant", tags: ["iterate", "context"], decoy: 2 },
  ],
};

/** Which side shows the strong prompt: varies by round, stable between visits. */
export function strongSide(id: string): "A" | "B" {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 2 === 0 ? "A" : "B";
}

/** Tags are good enough when at most one real reason is missed and at most one is wrong. */
export function gradeTags(chosen: Tag[], correct: Tag[]): { hits: number; wrong: number; good: boolean; perfect: boolean } {
  const hits = chosen.filter((t) => correct.includes(t)).length;
  const wrong = chosen.length - hits;
  return {
    hits,
    wrong,
    good: hits >= 1 && hits >= correct.length - 1 && wrong <= 1,
    perfect: hits === correct.length && wrong === 0,
  };
}
