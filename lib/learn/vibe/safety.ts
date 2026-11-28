// Vibe Code Studio (AI-Empowered Youth): the rules a young person's app must
// follow, shared by the server (vetting what the AI writes) and the browser
// (the locked preview and warnings on hand edits). Client-safe.
//
// An app is ONE offline HTML file. It never reaches the network, never loads
// anything from another site, and never asks for personal information. The
// preview enforces the first two on its own (sandbox + CSP below); the server
// also refuses AI output that tries, so a child is never shown such code as
// "the way to do it".

import { hasBadWords } from "@/lib/learn/youth-text";

/** Largest app, in characters (about 600 lines). */
export const VIBE_MAX_CODE = 24_000;
/** Longest "describe what you want" message. */
export const VIBE_MAX_REQUEST = 600;
/** Longest piece of code sent to "Explain this code". */
export const VIBE_MAX_SELECTION = 6_000;
/** Saved versions kept per project. */
export const VIBE_MAX_VERSIONS = 30;

/**
 * The policy injected into every preview. With sandbox="allow-scripts" (no
 * allow-same-origin, no allow-forms, no popups, no top navigation) the app
 * runs in an opaque origin with no network, no forms posting out and no way
 * to touch the platform.
 */
export const VIBE_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'";

export type VibeProblem = "network" | "external" | "personal" | "unsafe" | "tooBig";

// XML namespaces (inline SVG) are identifiers, not links: kept.
const NAMESPACE = /^https?:\/\/www\.w3\.org\//i;

const NETWORK: RegExp[] = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bsendBeacon\b/,
  /\bRTCPeerConnection\b/,
  /\bimportScripts\b/,
  /\bserviceWorker\b/,
  /\bwindow\s*\.\s*open\s*\(/,
  /\bimport\s*\(/,
];

const EXTERNAL: RegExp[] = [
  // src="https://..." or src="//cdn..." on any element.
  /\bsrc\s*=\s*["']?\s*(?:https?:)?\/\//i,
  // A stylesheet, icon or preload from elsewhere.
  /<link\b[^>]*\bhref\s*=\s*["']?\s*(?:https?:)?\/\//i,
  // CSS from elsewhere.
  /url\(\s*["']?\s*(?:https?:)?\/\//i,
  /@import\b/i,
  /<\s*(?:iframe|frame|object|embed|base|portal)\b/i,
  /<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh/i,
  /<form\b[^>]*\baction\s*=/i,
];

const PERSONAL: RegExp[] = [
  /<input\b[^>]*\btype\s*=\s*["']?\s*(?:email|tel|password)\b/i,
  /\bautocomplete\s*=\s*["']?\s*(?:email|tel|street-address|address-line\d|postal-code|cc-|bday|name|given-name|family-name)/i,
  /\bgetUserMedia\b/,
  /\bgeolocation\b/,
  /\bdocument\s*\.\s*cookie\b/,
];

/** What a piece of code does that a Vibe app may not (empty when fine). */
export function vibeProblems(code: string): VibeProblem[] {
  const out = new Set<VibeProblem>();
  if (code.length > VIBE_MAX_CODE) out.add("tooBig");
  if (NETWORK.some((re) => re.test(code))) out.add("network");
  if (EXTERNAL.some((re) => re.test(code))) out.add("external");
  if (PERSONAL.some((re) => re.test(code))) out.add("personal");
  if (hasBadWords(code)) out.add("unsafe");
  return [...out];
}

/**
 * Removes links to other sites. A link's target becomes "#"; any other web
 * address left in the text or comments is dropped. XML namespaces stay.
 * External `src` and CSS `url()` are NOT rewritten here: vibeProblems refuses
 * them, so code that depends on them is never passed off as working.
 */
export function stripExternalUrls(code: string): string {
  return code
    .replace(/\bhref\s*=\s*(["'])\s*((?:https?:)?\/\/[^"']*)\1/gi, (m, _q: string, url: string) => (NAMESPACE.test(url) ? m : 'href="#"'))
    .replace(/\bhref\s*=\s*(?:https?:)?\/\/[^\s>]+/gi, 'href="#"')
    .replace(/\b(?:https?:\/\/|www\.)[^\s"'<>)]+/gi, (m) => (NAMESPACE.test(m) ? m : ""));
}

/** One line, no newlines, so line numbers in the preview match the editor. */
function headPrefix(reporter: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="${VIBE_CSP}">${reporter}`;
}

/** Puts `prefix` first (after a doctype, on the same line, so no line shifts). */
function inject(code: string, prefix: string): string {
  const m = /^\s*<!doctype[^>]*>/i.exec(code);
  return m ? code.slice(0, m[0].length) + prefix + code.slice(m[0].length) : prefix + code;
}

/**
 * The preview document: the policy above, then a tiny reporter that tells the
 * Studio when the app loaded and which errors it hit (tagged with `nonce`,
 * so a stale preview cannot report for a new one), and keeps clicks on links
 * inside the app. Web addresses are removed before it runs.
 */
export function previewDoc(code: string, nonce: string): string {
  const n = JSON.stringify(nonce);
  const reporter =
    `<script>(function(){var n=${n};function s(m){m.vibe=n;try{parent.postMessage(m,"*")}catch(e){}}` +
    `addEventListener("error",function(e){s({type:"error",message:String((e&&e.message)||"Error").slice(0,200),line:(e&&e.lineno)||0})});` +
    `addEventListener("unhandledrejection",function(e){s({type:"error",message:String((e&&e.reason&&e.reason.message)||(e&&e.reason)||"Error").slice(0,200),line:0})});` +
    `addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(a&&!/^#/.test(a.getAttribute("href")||"")){e.preventDefault()}},true);` +
    `addEventListener("load",function(){s({type:"loaded"})})})();</script>`;
  return inject(stripExternalUrls(code), headPrefix(reporter));
}

/**
 * The hidden page the checks run in: the same policy, an error log the checks
 * can read (win.__vibeErrors), and the check runner.
 */
export function checkDoc(code: string): string {
  const recorder =
    `<script>window.__vibeErrors=[];addEventListener("error",function(e){window.__vibeErrors.push(String((e&&e.message)||"Error"))});</script>`;
  return inject(stripExternalUrls(code), headPrefix(recorder));
}

/** Words in a piece of free text (spec fields, test notes). */
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
