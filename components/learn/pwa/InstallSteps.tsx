"use client";

import { Ellipsis, EllipsisVertical, MonitorDown, Share, SquarePlus } from "lucide-react";
import type { InstallEnv, InstallPlatform } from "@/lib/learn/pwa/platform";

type T = (key: string, vars?: Record<string, string | number>) => string;

// The browser buttons named in the steps, drawn small and inline so learners
// can match them on screen.
const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>> = {
  share: Share,
  menu: EllipsisVertical,
  more: Ellipsis,
  add: SquarePlus,
  install: MonitorDown,
};

/** A message with {share}, {menu}, {more}, {add} or {install} drawn as icons. */
export function IconText({ text }: { text: string }) {
  const parts = text.split(/\{(share|menu|more|add|install)\}/);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const Icon = ICONS[part];
        return (
          <span
            key={i}
            className="mx-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--border)] bg-white align-middle text-[#1B3A6B] shadow-sm"
            data-icon={part}
          >
            <Icon size={14} aria-hidden />
          </span>
        );
      })}
    </>
  );
}

/** The one-line hint for the nav popover and the install card. */
export function hintKey(env: InstallEnv): string {
  switch (env.platform) {
    case "ios-safari":
      return "pwa.hint.ios-safari";
    case "ios-other":
      return env.legacy ? "pwa.hint.ios-legacy" : "pwa.hint.ios-other";
    case "mac-safari":
      return env.legacy ? "pwa.hint.mac-legacy" : "pwa.hint.mac-safari";
    case "android-firefox":
      return "pwa.hint.android-firefox";
    case "android-other-no-prompt":
      return env.legacy ? "pwa.hint.android-inapp" : "pwa.hint.android-other";
    case "desktop-chromium-no-prompt":
      return env.browser === "opera" ? "pwa.guide.desktop-opera" : "pwa.hint.desktop-chromium";
    case "firefox-desktop":
      return "pwa.hint.firefox-desktop";
    default:
      return "pwa.hint.unsupported";
  }
}

/**
 * Where the install card and the nav icon offer to install: the browser's
 * own prompt, and the browsers whose only path is a menu step that learners
 * rarely find on their own (iPhone/iPad, Safari on Mac, Firefox on Android).
 * Chromium without a prompt usually means "already installed" or "not yet
 * eligible", and desktop Firefox cannot install, so those only get the
 * guide (menu row, account card, /learn/install), never an unprompted offer.
 */
export function offersInstall(env: InstallEnv | null): boolean {
  if (!env) return false;
  switch (env.platform) {
    case "prompt":
    case "ios-safari":
    case "android-firefox":
      return true;
    case "ios-other":
    case "mac-safari":
      return !env.legacy;
    default:
      return false;
  }
}

/** Guides shown on /learn/install, in the order of the "Other devices" list. */
export const GUIDES = [
  "ios-safari",
  "ios-other",
  "android-other",
  "android-firefox",
  "desktop-chromium",
  "mac-safari",
  "firefox-desktop",
] as const;
export type GuideId = (typeof GUIDES)[number];

export function guideFor(p: InstallPlatform): GuideId | null {
  switch (p) {
    case "ios-safari":
    case "ios-other":
    case "mac-safari":
    case "android-firefox":
    case "firefox-desktop":
      return p;
    case "android-other-no-prompt":
      return "android-other";
    case "desktop-chromium-no-prompt":
      return "desktop-chromium";
    default:
      return null;
  }
}

/** Numbered steps for one browser; a note instead where it cannot install. */
export function Guide({ id, env, t, showTitle = true }: { id: GuideId; env?: InstallEnv | null; t: T; showTitle?: boolean }) {
  // This browser cannot follow the usual steps: say what to do instead (and
  // only that; the steps stay in "Other devices").
  const note =
    env && guideFor(env.platform) === id
      ? env.platform === "ios-other" && env.legacy
        ? "pwa.guide.ios-legacy"
        : env.platform === "android-other-no-prompt" && env.legacy
          ? "pwa.guide.android-inapp"
          : env.platform === "mac-safari" && env.legacy
            ? "pwa.hint.mac-legacy"
            : env.platform === "desktop-chromium-no-prompt" && env.browser === "opera"
              ? "pwa.guide.desktop-opera"
              : null
      : null;
  const steps = [1, 2, 3].map((n) => `pwa.guide.${id}.${n}`).filter((k) => t(k) !== k);
  return (
    <div data-guide={id}>
      {showTitle && <h3 className="text-sm font-bold text-[var(--ink)]">{t(`pwa.guide.${id}.title`)}</h3>}
      {note && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950 ring-1 ring-amber-200" data-testid="install-note">
          <IconText text={t(note)} />
        </p>
      )}
      {!note && <ol className="mt-3 space-y-3">
        {steps.map((k, i) => (
          <li key={k} className="flex gap-3 text-sm leading-relaxed text-[var(--ink2)]">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B3A6B] text-xs font-bold text-white">{i + 1}</span>
            <span className="min-w-0">
              <IconText text={t(k)} />
            </span>
          </li>
        ))}
      </ol>}
    </div>
  );
}
