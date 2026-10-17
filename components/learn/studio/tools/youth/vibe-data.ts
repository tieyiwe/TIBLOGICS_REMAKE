// Vibe Code Studio: the starting apps and the Fix-it checks. The app text is
// in the learner's language (passed in as already-translated strings); ids
// and code stay the same in every language so the checks work everywhere.

import type { SandboxCheck } from "@/lib/learn/labs/code-sandbox";

export const VIBE_IDS = ["first-app", "fix-it", "level-up"] as const;
export type VibeId = (typeof VIBE_IDS)[number];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The empty canvas a new project starts from. */
export function starterApp(text: { title: string; hint: string }): string {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {
    font-family: system-ui, sans-serif;
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #1B3A6B, #0D1B2A);
    color: #fff;
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
  }
  .wand { font-size: 56px; margin: 0; }
</style>
</head>
<body>
  <main>
    <p class="wand">🪄</p>
    <h1>${esc(text.title)}</h1>
    <p>${esc(text.hint)}</p>
  </main>
</body>
</html>
`;
}

/**
 * Fix it: a star counter with two bugs. "+1" glues text together (0, 01,
 * 011...) instead of adding, and "Start again" is wired to an id that does
 * not exist, so the page also stops with an error.
 */
export function buggyApp(text: {
  title: string;
  hint: string;
  add: string;
  reset: string;
  c1: string;
  c2: string;
  c3: string;
}): string {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(text.title)}</title>
<style>
  body {
    font-family: system-ui, sans-serif;
    background: #0D1B2A;
    color: #fff;
    text-align: center;
    padding: 24px;
  }
  .big { font-size: 64px; font-weight: 800; margin: 16px 0; }
  button {
    font-size: 20px;
    font-weight: 700;
    padding: 12px 20px;
    margin: 6px;
    border: 0;
    border-radius: 14px;
    cursor: pointer;
  }
  #add { background: #F47C20; color: #fff; }
  #reset { background: #E8EFF8; color: #0D1B2A; }
</style>
</head>
<body>
  <h1>⭐ ${esc(text.title)}</h1>
  <p>${esc(text.hint)}</p>
  <p class="big"><span id="score">0</span> ⭐</p>
  <button id="add">${esc(text.add)}</button>
  <button id="reset">${esc(text.reset)}</button>
  <script>
    // ${esc(text.c1)}
    const score = document.getElementById("score");

    // ${esc(text.c2)}
    document.getElementById("add").addEventListener("click", function () {
      score.textContent = score.textContent + 1;
    });

    // ${esc(text.c3)}
    document.getElementById("restart").addEventListener("click", function () {
      score.textContent = 0;
    });
  </script>
</body>
</html>
`;
}

/** The Fix-it checks (run in a hidden copy of the app, in this order). */
export const FIX_CHECKS: SandboxCheck[] = [
  {
    id: "adds",
    code: `var s = doc.getElementById("score"), a = doc.getElementById("add");
if (!s || !a) return "The page needs #score and #add";
a.click(); a.click(); a.click();
return s.textContent.trim() === "3" || ("After 3 taps the score shows " + s.textContent.trim());`,
  },
  {
    id: "resets",
    code: `var s = doc.getElementById("score"), r = doc.getElementById("reset");
if (!s || !r) return "The page needs #score and #reset";
r.click();
return s.textContent.trim() === "0" || ("After Start again the score shows " + s.textContent.trim());`,
  },
  {
    id: "again",
    code: `var s = doc.getElementById("score"), a = doc.getElementById("add");
if (!s || !a) return "The page needs #score and #add";
a.click(); a.click();
return s.textContent.trim() === "2" || ("After starting again and 2 taps the score shows " + s.textContent.trim());`,
  },
  {
    id: "no-errors",
    code: `var e = win.__vibeErrors || [];
return e.length === 0 || ("Error: " + e[0]);`,
  },
];

export type QuizId = "a" | "b" | "c";
/** The right answer for each challenge's quick question. */
export const QUIZ_ANSWER: Record<VibeId, QuizId> = { "first-app": "a", "fix-it": "b", "level-up": "c" };

/** A short, stable fingerprint of some code (to know which code the checks ran on). */
export function codeHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + ":" + s.length;
}
