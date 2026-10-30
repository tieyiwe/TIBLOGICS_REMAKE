// Route helpers: a rejected promo code as a translated JSON error.
import { NextResponse } from "next/server";
import { CodeRejected } from "./service";
import { fmtUsd } from "./shared";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function rejectionMessage(t: T, e: CodeRejected): string {
  if (e.reason === "minimum" && e.minimumCents) return t("promo.error.minimumAmount", { amount: fmtUsd(e.minimumCents) });
  return t(`promo.error.${e.reason}`);
}

/** For checkout routes: a 400 for a rejected code, null for any other error. */
export function promoCheckoutError(t: T, err: unknown): NextResponse | null {
  if (!(err instanceof CodeRejected)) return null;
  return NextResponse.json({ error: rejectionMessage(t, err), promoError: err.reason }, { status: 400 });
}

/** A promo code from a request body: trimmed, at most 40 characters, or null. */
export function codeFromBody(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, 40);
  return s ? s : null;
}
