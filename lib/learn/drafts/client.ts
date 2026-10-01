"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DRAFT_MAX_BYTES, draftBytes, isEmptyDraft } from "./shared";

// Autosave for learner work in progress. The work is kept twice:
//
//   - in this browser (localStorage), at once, so a closed tab or a lost
//     connection never loses it;
//   - on the server (/api/learn/drafts), ~1.5 s after typing stops and when
//     the page is hidden or closed, so it follows the learner to any device.
//
// On load the newest copy wins, except that an empty copy never replaces a
// non-empty one. Each local copy records whether the server has it
// ("synced") and which learner it belongs to, so signing in as someone else
// on the same browser never shows them the previous learner's work.

export type DraftSaveStatus = "idle" | "saving" | "saved" | "local" | "restored";

interface Mirror {
  v: unknown;
  /** ms: when it was edited (unsynced) or when the server saved it (synced). */
  at: number;
  synced: boolean;
  owner?: string;
}

const mirrorKey = (key: string) => `tib:draft:${key}`;
const OWNER_KEY = "tib:draft:owner";
/** Browser storage that belongs to the signed-in learner. */
const LEARNER_PREFIXES = ["tib:draft:", "tiblogics:lab-draft:", "tiblogics:code-lab:", "tib.studio.", "tib:studio:", "tib:loop:", "tib:game:"];
const BEACON_MAX = 60_000;

function readMirror(key: string): Mirror | null {
  try {
    const raw = window.localStorage.getItem(mirrorKey(key));
    const m = raw ? (JSON.parse(raw) as Mirror) : null;
    return m && typeof m === "object" && typeof m.at === "number" ? m : null;
  } catch {
    return null;
  }
}
function writeMirror(key: string, m: Mirror) {
  try {
    window.localStorage.setItem(mirrorKey(key), JSON.stringify(m));
  } catch {
    /* storage full or blocked: the server copy still applies */
  }
}
function removeMirror(key: string) {
  try {
    window.localStorage.removeItem(mirrorKey(key));
  } catch {
    /* nothing to remove */
  }
}

/**
 * Remembers which learner this browser's drafts belong to. When another
 * learner signs in, everything learner-specific in storage is removed and the
 * page reloads once, so tools that read storage on mount start clean.
 * Returns true when that reload is under way.
 */
function claimOwner(owner: string | undefined): boolean {
  if (!owner) return false;
  try {
    const prev = window.localStorage.getItem(OWNER_KEY);
    if (prev === owner) return false;
    if (prev) {
      const doomed: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && LEARNER_PREFIXES.some((p) => k.startsWith(p))) doomed.push(k);
      }
      for (const k of doomed) window.localStorage.removeItem(k);
      window.localStorage.setItem(OWNER_KEY, owner);
      window.location.reload();
      return true;
    }
    window.localStorage.setItem(OWNER_KEY, owner);
  } catch {
    /* storage blocked: nothing local to protect */
  }
  return false;
}

export interface ServerDraftOptions<T> {
  /** Debounce before saving to the server, in ms. */
  delay?: number;
  /** Rejects a stored value that no longer fits the tool (old format). */
  validate?: (v: unknown) => boolean;
  /** Shrinks the value for the server if it is over the size limit. */
  fit?: (v: T) => T;
  /**
   * A localStorage key where the component already keeps this work (or used
   * to). Read when there is no local copy yet, so work saved before drafts
   * reached the server is uploaded once.
   */
  legacyKey?: string;
  /** Remove legacyKey after reading it (it is no longer used). */
  dropLegacy?: boolean;
}

/**
 * Keeps `value` saved under `key`, restoring the newest saved copy through
 * `apply` once on load. Pass `value` as undefined until the component has its
 * own initial value (for tools that load it in an effect); pass `key` as null
 * to switch saving off.
 */
export function useServerDraft<T>(
  key: string | null,
  value: T | undefined,
  apply: (v: T) => void,
  opts: ServerDraftOptions<T> = {},
) {
  const delay = opts.delay ?? 1500;
  const [status, setStatus] = useState<DraftSaveStatus>("idle");
  const readyFor = useRef<string | null>(null);
  const lastJson = useRef<string | null>(null);
  const pending = useRef<{ key: string; value: T } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const owner = useRef<string | undefined>(undefined);
  const latest = useRef({ value, apply, opts });
  useEffect(() => {
    latest.current = { value, apply, opts };
  });

  const send = useCallback((key: string, value: T, background: boolean) => {
    const fit = latest.current.opts.fit;
    let body: T = value;
    if (fit && draftBytes(body) > DRAFT_MAX_BYTES) body = fit(body);
    if (draftBytes(body) > DRAFT_MAX_BYTES) {
      setStatus("local");
      return;
    }
    const payload = JSON.stringify({ key, value: body });
    if (background) {
      // The page is going away: hand the save to the browser.
      if (payload.length < BEACON_MAX) {
        try {
          if (navigator.sendBeacon?.("/api/learn/drafts", new Blob([payload], { type: "application/json" }))) return;
        } catch {
          /* fall back to fetch */
        }
      }
      void fetch("/api/learn/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: payload.length < BEACON_MAX,
      }).catch(() => {});
      return;
    }
    // One save at a time, in order, so an older save never lands last.
    chain.current = chain.current.then(async () => {
      try {
        const res = await fetch("/api/learn/drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (!res.ok) {
          setStatus("local");
          return;
        }
        const d = (await res.json().catch(() => ({}))) as { updatedAt?: string; owner?: string };
        if (d.owner) owner.current = d.owner;
        const m = readMirror(key);
        if (m && !pending.current && JSON.stringify(m.v) === JSON.stringify(value)) {
          writeMirror(key, { ...m, synced: true, at: Date.parse(d.updatedAt ?? "") || Date.now(), owner: owner.current });
        }
        setStatus(pending.current ? "saving" : "saved");
      } catch {
        setStatus("local");
      }
    });
  }, []);

  const flush = useCallback(
    (background = false) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const p = pending.current;
      if (!p) return;
      pending.current = null;
      send(p.key, p.value, background);
    },
    [send],
  );

  // Restore once per key, as soon as the component has its own value.
  const hasValue = value !== undefined;
  useEffect(() => {
    if (!key || !hasValue || readyFor.current === key) return;
    let cancelled = false;
    (async () => {
      let mirror = readMirror(key);
      if (!mirror && latest.current.opts.legacyKey) {
        try {
          const raw = window.localStorage.getItem(latest.current.opts.legacyKey);
          if (raw) mirror = { v: JSON.parse(raw), at: 0, synced: false };
          if (latest.current.opts.dropLegacy) window.localStorage.removeItem(latest.current.opts.legacyKey);
        } catch {
          /* unreadable: ignore */
        }
      }
      let reached = false;
      let server: { value: unknown; updatedAt: string } | null = null;
      try {
        const res = await fetch(`/api/learn/drafts?key=${encodeURIComponent(key)}`, { cache: "no-store" });
        if (res.ok) {
          const d = (await res.json()) as { owner?: string; draft: typeof server };
          reached = true;
          if (claimOwner(d.owner)) return;
          owner.current = d.owner;
          if (mirror?.owner && mirror.owner !== d.owner) {
            removeMirror(key);
            mirror = null;
          }
          server = d.draft;
        }
      } catch {
        /* offline: the local copy is all there is */
      }
      if (cancelled) return;

      const valid = latest.current.opts.validate ?? (() => true);
      if (server && !valid(server.value)) server = null;
      if (mirror && !valid(mirror.v)) mirror = null;
      const serverAt = server ? Date.parse(server.updatedAt) || 0 : 0;

      let chosen: { v: unknown; from: "server" | "local" } | null = null;
      let push = false;
      if (mirror && !mirror.synced && (!server || mirror.at > serverAt)) {
        chosen = { v: mirror.v, from: "local" };
        push = true;
      } else if (server) {
        chosen = { v: server.value, from: "server" };
      } else if (mirror && (!reached || !mirror.synced)) {
        chosen = { v: mirror.v, from: "local" };
        push = reached;
      } else if (mirror && mirror.synced) {
        // The server had it and no longer does: it was submitted or cleared
        // on another device. Do not bring it back.
        removeMirror(key);
      }
      // Never let an empty copy win over one with work in it.
      if (chosen && isEmptyDraft(chosen.v)) {
        const other = chosen.from === "server" ? mirror?.v : server?.value;
        if (other !== undefined && !isEmptyDraft(other)) {
          chosen = { v: other, from: chosen.from === "server" ? "local" : "server" };
          push = chosen.from === "local" && reached;
        }
      }

      const current = latest.current.value;
      const currentJson = JSON.stringify(current);
      if (chosen && JSON.stringify(chosen.v) !== currentJson) {
        lastJson.current = JSON.stringify(chosen.v);
        latest.current.apply(chosen.v as T);
        if (!isEmptyDraft(chosen.v)) setStatus("restored");
      } else {
        lastJson.current = currentJson;
      }
      if (chosen?.from === "server" && server) {
        writeMirror(key, { v: server.value, at: serverAt, synced: true, owner: owner.current });
      }
      readyFor.current = key;
      if (push && chosen) {
        pending.current = { key, value: chosen.v as T };
        flush();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, hasValue, flush]);

  // Every change: a local copy at once, the server shortly after.
  useEffect(() => {
    if (!key || readyFor.current !== key || value === undefined) return;
    const json = JSON.stringify(value);
    if (json === lastJson.current) return;
    lastJson.current = json;
    // Nothing written and nothing saved before (e.g. a form emptied after it
    // was submitted): there is nothing to keep.
    if (isEmptyDraft(value) && !readMirror(key)) return;
    writeMirror(key, { v: value, at: Date.now(), synced: false, owner: owner.current });
    pending.current = { key, value };
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), delay);
  }, [key, value, delay, flush]);

  // Save before the page goes away, comes back online, or the key changes.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    const onLeave = () => flush(true);
    const onOnline = () => {
      if (!key || readyFor.current !== key) return;
      const m = readMirror(key);
      if (m && !m.synced && !pending.current) pending.current = { key, value: m.v as T };
      flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("online", onOnline);
      flush(true);
    };
  }, [key, flush]);

  /** Forget the draft everywhere, e.g. after the work was submitted. */
  const clear = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    if (!key) return;
    removeMirror(key);
    lastJson.current = JSON.stringify(latest.current.value);
    setStatus("idle");
    await chain.current;
    await fetch(`/api/learn/drafts?key=${encodeURIComponent(key)}`, { method: "DELETE" }).catch(() => {});
  }, [key]);

  return { status, clear, flush: () => flush() };
}

/** Saves a small record without the hook (e.g. a reading position). */
export function putDraft(key: string, value: unknown, background = false): void {
  const payload = JSON.stringify({ key, value });
  if (background && payload.length < BEACON_MAX) {
    try {
      if (navigator.sendBeacon?.("/api/learn/drafts", new Blob([payload], { type: "application/json" }))) return;
    } catch {
      /* fall back to fetch */
    }
  }
  void fetch("/api/learn/drafts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: payload.length < BEACON_MAX,
  }).catch(() => {});
}

/** Drops this browser's copy of a draft (the server copy is cleared separately). */
export function forgetLocalDraft(key: string): void {
  removeMirror(key);
}
