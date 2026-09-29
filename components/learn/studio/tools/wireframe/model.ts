// Wireframe Builder data model and pure helpers (no React).

export type CType = "header" | "text" | "input" | "button" | "list" | "card" | "image" | "error" | "empty" | "tabs";

export const CTYPES: CType[] = ["header", "text", "input", "button", "list", "card", "image", "error", "empty", "tabs"];

export const CICON: Record<CType, string> = {
  header: "🔝",
  text: "📝",
  input: "⌨️",
  button: "🔘",
  list: "📋",
  card: "🪪",
  image: "🖼️",
  error: "⚠️",
  empty: "📭",
  tabs: "🧭",
};

/** Types that can navigate to another screen. */
export const LINKABLE: CType[] = ["header", "button", "list", "card", "text", "image"];

export interface Comp {
  id: string;
  type: CType;
  /** Empty means "use the default label for this type". */
  label: string;
  note: string;
  /** Target screen id, or null. */
  link: string | null;
  half: boolean;
}

export interface Screen {
  id: string;
  name: string;
  comps: Comp[];
}

export interface Design {
  app: string;
  screens: Screen[];
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export function newComp(type: CType): Comp {
  return { id: uid(), type, label: "", note: "", link: null, half: type === "button" ? false : false };
}

export function newScreen(name: string): Screen {
  return { id: uid(), name, comps: [] };
}

/** Tab items of a nav tabs component, from its label ("Home, Search, Profile"). */
export function tabItems(label: string): string[] {
  return label
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function screenByName(d: Design, name: string): Screen | undefined {
  const n = name.trim().toLowerCase();
  return d.screens.find((s) => s.name.trim().toLowerCase() === n);
}

/** Every screen a screen links to (component links plus nav tabs matched by screen name). */
export function outLinks(d: Design, s: Screen, tabDefault: string): Set<string> {
  const out = new Set<string>();
  for (const c of s.comps) {
    if (c.link && c.link !== s.id && d.screens.some((x) => x.id === c.link)) out.add(c.link);
    if (c.type === "tabs") {
      for (const item of tabItems(c.label || tabDefault)) {
        const target = screenByName(d, item);
        if (target && target.id !== s.id) out.add(target.id);
      }
    }
  }
  return out;
}

/** Sanitise anything read from storage. */
export function parseDesign(raw: unknown): Design | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { app?: unknown; screens?: unknown };
  if (!Array.isArray(r.screens) || r.screens.length === 0) return null;
  const screens: Screen[] = [];
  for (const s of r.screens.slice(0, 12)) {
    if (!s || typeof s !== "object") continue;
    const so = s as { id?: unknown; name?: unknown; comps?: unknown };
    const comps: Comp[] = [];
    if (Array.isArray(so.comps)) {
      for (const c of so.comps.slice(0, 40)) {
        const co = c as Partial<Comp>;
        if (!co || !CTYPES.includes(co.type as CType)) continue;
        comps.push({
          id: typeof co.id === "string" ? co.id : uid(),
          type: co.type as CType,
          label: typeof co.label === "string" ? co.label.slice(0, 120) : "",
          note: typeof co.note === "string" ? co.note.slice(0, 300) : "",
          link: typeof co.link === "string" ? co.link : null,
          half: co.half === true,
        });
      }
    }
    screens.push({ id: typeof so.id === "string" ? so.id : uid(), name: typeof so.name === "string" ? so.name.slice(0, 40) : "Screen", comps });
  }
  if (!screens.length) return null;
  return { app: typeof r.app === "string" ? r.app.slice(0, 60) : "", screens };
}
