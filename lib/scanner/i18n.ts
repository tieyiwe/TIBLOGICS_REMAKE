import type { Locale, Vars } from "@/lib/i18n/config";
import { BLOCK_MESSAGES } from "@/lib/ssrf";
import type { Finding } from "./audit";

// Scanner findings and scan errors in the visitor's language.
//
// The audit engine stores English text (the admin and the monitor emails read
// it) plus a message id and the measured values, so any page can show the
// same finding in French or Swahili. Findings saved before the ids existed
// have no `msg` and are shown as stored.

type T = (key: string, vars?: Vars) => string;

function localNumbers(vars: Finding["vars"], locale: Locale): Vars | undefined {
  if (!vars) return undefined;
  const nf = new Intl.NumberFormat(locale);
  const out: Vars = {};
  for (const [k, v] of Object.entries(vars)) out[k] = typeof v === "number" && k !== "code" ? nf.format(v) : v;
  return out;
}

/** One finding's text in the translator's language. */
export function findingText(t: T, locale: Locale, f: Pick<Finding, "text"> & Partial<Pick<Finding, "msg" | "vars">>): string {
  if (!f.msg) return f.text;
  const key = `tools.check.${f.msg}`;
  const out = t(key, localNumbers(f.vars, locale));
  return out === key ? f.text : out;
}

/** Findings with their text translated; everything else unchanged. */
export function localizeFindings<F extends Finding>(t: T, locale: Locale, findings: F[]): F[] {
  return findings.map((f) => ({ ...f, text: findingText(t, locale, f) }));
}

/**
 * A scan error in the translator's language. Errors come from lib/scanner/scan.ts
 * and lib/ssrf.ts as English text (and are stored that way for the monitor),
 * so they are recognised by their wording.
 */
export function scanErrorText(t: T, error: string | null | undefined): string {
  if (!error) return t("tools.scanErr.unknown");
  for (const [reason, message] of Object.entries(BLOCK_MESSAGES)) {
    if (error.startsWith(message)) return t(`tools.block.${reason}`);
  }
  const timeout = /over (\d+) seconds|timed out \(>(\d+)s\)/i.exec(error);
  if (timeout) return t("tools.scanErr.timeout", { s: timeout[1] ?? timeout[2] });
  return t("tools.scanErr.unreachable");
}
