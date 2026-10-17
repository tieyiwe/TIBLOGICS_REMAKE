// Tutor constants and helpers safe to import in the browser and on the server.

/** Longest message a learner can send. */
export const TUTOR_MAX_INPUT = 2000;
/** Longest selected lesson text sent with "Ask Tutor". */
export const TUTOR_MAX_SELECTION = 1200;

/** Quick-action chips. The label is localized; the instruction lives on the server. */
export const TUTOR_ACTIONS = ["simpler", "example", "quiz", "system", "stuck"] as const;
export type TutorAction = (typeof TUTOR_ACTIONS)[number];

export const TUTOR_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type TutorLevel = (typeof TUTOR_LEVELS)[number];

export interface TutorMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface TutorProfileView {
  role: string;
  goal: string;
  level: string;
}

/**
 * Tutor replies (and learner messages) are shown with the lesson Markdown
 * renderer, whose ```try / ```playground / ```studio fences become live
 * widgets. Model output must stay plain text: those fences are shown as code.
 */
export function inertFences(md: string): string {
  return md.replace(/^(\s*)```\s*(try|text|prompt|playground|studio)\b.*$/gim, "$1```txt");
}

/**
 * Removes things that look like secrets before a message is stored or sent
 * to the model: API keys and tokens, private keys, passwords written as
 * "password: ...", and card numbers. Returns the cleaned text and whether
 * anything was removed.
 */
export function redactSecrets(input: string): { text: string; redacted: boolean } {
  let redacted = false;
  const mark = () => {
    redacted = true;
    return "[removed]";
  };
  let text = input
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g, mark)
    .replace(/\b(sk|pk|rk)[-_](live|test|ant|proj)?[-_]?[A-Za-z0-9_-]{16,}\b/g, mark)
    .replace(/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g, mark)
    .replace(/\b(ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/g, mark)
    .replace(/\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g, mark)
    .replace(/\bAIza[0-9A-Za-z_-]{30,}\b/g, mark)
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, mark)
    .replace(/\b(bearer)\s+[A-Za-z0-9._~+/=-]{20,}/gi, (_m, b: string) => `${b} ${mark()}`)
    .replace(
      /\b(password|passwd|pwd|mot de passe|nenosiri|api[_ -]?key|secret|token)(\s*[:=]\s*)([^\s,;]{4,})/gi,
      (_m, k: string, sep: string) => `${k}${sep}${mark()}`,
    );
  // Card numbers: 13 to 19 digits (spaces or dashes allowed) passing Luhn.
  text = text.replace(/\b\d(?:[ -]?\d){12,18}\b/g, (m) => (luhn(m.replace(/\D/g, "")) ? mark() : m));
  return { text, redacted };
}

function luhn(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}
