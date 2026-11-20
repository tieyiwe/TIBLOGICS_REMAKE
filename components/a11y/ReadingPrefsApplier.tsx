"use client";

import { useEffect } from "react";
import { READING_PREFS_KEY, applyPrefs, clearPrefs, loadPrefs } from "@/lib/a11y/reading-prefs";

/**
 * Keeps the reading preferences on <html> while a /learn page is open: the
 * inline boot script set them before paint; this re-applies them after
 * client navigation, follows changes made in another tab, and removes them
 * when the learner leaves /learn for the marketing site.
 */
export default function ReadingPrefsApplier() {
  useEffect(() => {
    applyPrefs(loadPrefs());
    const onStorage = (e: StorageEvent) => {
      if (e.key === READING_PREFS_KEY) applyPrefs(loadPrefs());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearPrefs();
    };
  }, []);
  return null;
}
