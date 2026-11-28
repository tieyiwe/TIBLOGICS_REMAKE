// The AI Times categories, in display order. Stored on BlogPost.category as a
// plain string, so this list is the one place that says which values are
// valid. Never rename an existing value: posts already carry them.
//
// "advanced-tech" covers frontier technology beyond AI software: semiconductors
// and AI chips, quantum computing, robotics and humanoids, autonomous vehicles
// and drones, space tech, biotech and health tech, energy and climate tech,
// AR/VR and spatial computing, frontier cybersecurity, next-generation networks
// and brain-computer interfaces.

export const BLOG_CATEGORIES = [
  "breaking",
  "ai-business",
  "tips",
  "tools",
  "case-studies",
  "industry",
  "advanced-tech",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function isBlogCategory(v: unknown): v is BlogCategory {
  return typeof v === "string" && (BLOG_CATEGORIES as readonly string[]).includes(v);
}

/** Short English labels for the admin screens. */
export const BLOG_CATEGORY_ADMIN_LABELS: Record<BlogCategory, string> = {
  "breaking": "⚡ Breaking",
  "ai-business": "💼 Business",
  "tips": "💡 Tips",
  "tools": "🔧 Tools",
  "case-studies": "📊 Case Study",
  "industry": "🌐 Industry",
  "advanced-tech": "🚀 Advanced Tech",
};
