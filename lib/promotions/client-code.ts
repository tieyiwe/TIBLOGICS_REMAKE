"use client";

// The promo code a customer applied in our field, kept for the browser tab
// (sessionStorage) so every buy button on the page sends it. Display state
// only: checkout routes validate the code again on the server.
import { useEffect, useState } from "react";

const KEY = "tib_promo_code";
const EVENT = "tib-promo-code";

export function getStoredCode(): string | null {
  try {
    return window.sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredCode(code: string | null) {
  try {
    if (code) window.sessionStorage.setItem(KEY, code);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* private mode: the field still works for this page view */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: code }));
}

/** The applied code, kept in step across components on the page. */
export function useStoredCode(): string | null {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    setCode(getStoredCode());
    const on = (e: Event) => setCode((e as CustomEvent<string | null>).detail ?? null);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return code;
}
