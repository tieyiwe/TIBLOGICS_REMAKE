"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("inert") && !el.closest("[inert]") && el.getClientRects().length > 0,
  );
}

/**
 * Keeps keyboard focus inside `ref` while `active` (a modal dialog or a
 * full-screen overlay): Tab and Shift+Tab wrap, focus that escapes (a click
 * outside, a script) is pulled back, and when the trap ends focus returns to
 * whatever had it before (the button that opened the dialog).
 * Escape is left to the caller, since some overlays let a child claim it.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  opts: { initialFocus?: RefObject<HTMLElement | null>; returnFocus?: boolean } = {},
) {
  const { initialFocus, returnFocus = true } = opts;
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;

    // Move focus in, unless it is already inside.
    if (!root.contains(document.activeElement)) {
      const target = initialFocus?.current ?? focusables(root)[0] ?? root;
      if (target === root && !root.hasAttribute("tabindex")) root.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables(root);
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const cur = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (cur === first || !root.contains(cur))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (cur === last || !root.contains(cur))) {
        e.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node | null;
      if (t && !root.contains(t)) {
        // Something outside took focus while the trap is on: bring it back.
        (focusables(root)[0] ?? root).focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocusIn);
      if (returnFocus && previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
