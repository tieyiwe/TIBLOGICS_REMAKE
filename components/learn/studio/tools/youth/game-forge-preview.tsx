"use client";

import { useEffect, useMemo, useRef } from "react";
import { gameDocument, type EngineLabels } from "@/lib/learn/game-forge/engine";
import { newNonce } from "@/lib/learn/game-forge/labels";
import type { GameConfig } from "@/lib/learn/game-forge/schema";

export interface GameEvent {
  ev: string;
  data: Record<string, unknown>;
}

/**
 * The game, running in a sandboxed iframe: allow-scripts only (no
 * allow-same-origin, so an opaque origin with no access to the page, cookies
 * or storage), a CSP with no network, and the engine's events passed up by
 * postMessage. Only messages from this frame's current run are accepted.
 */
export default function GamePreview({
  config,
  labels,
  lang,
  restartKey,
  onEvent,
  title,
  className,
}: {
  config: GameConfig;
  labels: EngineLabels;
  lang: string;
  restartKey: number;
  onEvent: (e: GameEvent) => void;
  title: string;
  className?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  // A new document (and run id) whenever the game or the restart key changes.
  const { doc, run } = useMemo(() => {
    const run = newNonce();
    return { run, doc: gameDocument(config, { labels, nonce: newNonce(), lang, mode: "preview", run }) };
    // restartKey is a dependency on purpose: same game, fresh start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, labels, lang, restartKey]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      const d = e.data as { type?: unknown; run?: unknown; ev?: unknown; data?: unknown } | null;
      if (!d || d.type !== "gf" || d.run !== run || typeof d.ev !== "string") return;
      const data = d.data && typeof d.data === "object" ? (d.data as Record<string, unknown>) : {};
      handler.current({ ev: d.ev, data });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [run]);

  return (
    <iframe
      ref={frame}
      title={title}
      sandbox="allow-scripts"
      srcDoc={doc}
      referrerPolicy="no-referrer"
      className={className}
      data-testid="gf-preview"
    />
  );
}
