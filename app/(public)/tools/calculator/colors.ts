import type { CostCategory } from "@/lib/calculator/types";

// Categorical order checked with the dataviz palette validator (light mode):
// adjacent colour-blind separation passes; the lighter hues sit under 3:1
// contrast, so the legend, tooltips and the scenario table carry the values
// as text.
export const CATEGORY_COLORS: Record<CostCategory, string> = {
  ai: "#2251A3",
  usage: "#F47C20",
  infra: "#1BAF7A",
  people: "#4A3AA7",
  fees: "#EDA100",
};
