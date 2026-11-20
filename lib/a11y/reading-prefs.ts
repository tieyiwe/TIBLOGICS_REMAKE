// Reading preferences for the Learning Box (font, text size, spacing,
// contrast, motion, focus mode). Kept per browser in localStorage: there is
// no preferences store on the Student record beyond accessibilityMode, so
// nothing here is sent to the server.
//
// The choices become data-rp-* attributes on <html> (styles in globals.css).
// An inline script in app/learn/layout.tsx stamps them before first paint so
// there is no flash, and <ReadingPrefsApplier> removes them when the learner
// leaves /learn, so the marketing site is never affected.

export const READING_PREFS_KEY = "tib_reading_prefs";

export const FONT_OPTIONS = ["default", "atkinson", "dyslexic"] as const;
export const SIZE_OPTIONS = ["100", "112", "125", "150"] as const;
export const LINE_OPTIONS = ["normal", "relaxed", "loose"] as const;
export const LETTER_OPTIONS = ["normal", "wide", "wider"] as const;

export interface ReadingPrefs {
  font: (typeof FONT_OPTIONS)[number];
  size: (typeof SIZE_OPTIONS)[number];
  line: (typeof LINE_OPTIONS)[number];
  letter: (typeof LETTER_OPTIONS)[number];
  motion: boolean;
  contrast: boolean;
  focus: boolean;
}

export const DEFAULT_PREFS: ReadingPrefs = {
  font: "default",
  size: "100",
  line: "normal",
  letter: "normal",
  motion: false,
  contrast: false,
  focus: false,
};

const pick = <T extends readonly string[]>(list: T, v: unknown, d: T[number]): T[number] =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : d;

export function sanitizePrefs(raw: unknown): ReadingPrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    font: pick(FONT_OPTIONS, r.font, "default"),
    size: pick(SIZE_OPTIONS, r.size, "100"),
    line: pick(LINE_OPTIONS, r.line, "normal"),
    letter: pick(LETTER_OPTIONS, r.letter, "normal"),
    motion: r.motion === true,
    contrast: r.contrast === true,
    focus: r.focus === true,
  };
}

export function loadPrefs(): ReadingPrefs {
  try {
    return sanitizePrefs(JSON.parse(localStorage.getItem(READING_PREFS_KEY) || "{}"));
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: ReadingPrefs): boolean {
  try {
    localStorage.setItem(READING_PREFS_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

/** Attribute name and value for each preference; null means "not set". */
export function prefAttributes(p: ReadingPrefs): Record<string, string | null> {
  return {
    "data-rp-font": p.font === "default" ? null : p.font,
    "data-rp-size": p.size === "100" ? null : p.size,
    "data-rp-line": p.line === "normal" ? null : p.line,
    "data-rp-letter": p.letter === "normal" ? null : p.letter,
    "data-rp-motion": p.motion ? "reduce" : null,
    "data-rp-contrast": p.contrast ? "high" : null,
    "data-rp-focus": p.focus ? "on" : null,
  };
}

export function applyPrefs(p: ReadingPrefs, el: HTMLElement = document.documentElement) {
  for (const [k, v] of Object.entries(prefAttributes(p))) {
    if (v == null) el.removeAttribute(k);
    else el.setAttribute(k, v);
  }
}

export function clearPrefs(el: HTMLElement = document.documentElement) {
  for (const k of Object.keys(prefAttributes(DEFAULT_PREFS))) el.removeAttribute(k);
}

/**
 * The same as loadPrefs + applyPrefs, as a self-contained string for an
 * inline <script> that runs before the page paints. Values are whitelisted
 * by pattern so nothing from storage reaches the DOM unchecked.
 */
export const READING_PREFS_BOOT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  READING_PREFS_KEY,
)})||"{}"),h=document.documentElement,ok=/^[a-z0-9]{1,12}$/,s=function(k,v){if(typeof v==="string"&&ok.test(v))h.setAttribute(k,v)};if(p.font&&p.font!=="default")s("data-rp-font",p.font);if(p.size&&p.size!=="100")s("data-rp-size",p.size);if(p.line&&p.line!=="normal")s("data-rp-line",p.line);if(p.letter&&p.letter!=="normal")s("data-rp-letter",p.letter);if(p.motion===true)s("data-rp-motion","reduce");if(p.contrast===true)s("data-rp-contrast","high");if(p.focus===true)s("data-rp-focus","on")}catch(e){}})();`;

/** True when motion should be avoided: the OS setting or the learner's override. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return (
    document.documentElement.getAttribute("data-rp-motion") === "reduce" ||
    !!document.querySelector('[data-a11y="true"]') ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}
