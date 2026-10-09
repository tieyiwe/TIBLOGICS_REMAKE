import { ENGINE_LABEL_KEYS, type EngineLabels } from "./engine";

/** The engine's texts in the viewer's language (studio.game-forge.engine.*). */
export function engineLabels(t: (key: string) => string): EngineLabels {
  return Object.fromEntries(ENGINE_LABEL_KEYS.map((k) => [k, t(`studio.game-forge.engine.${k}`)])) as EngineLabels;
}

/** A random nonce for the game document's script and style. */
export function newNonce(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  let s = "";
  for (const b of a) s += b.toString(16).padStart(2, "0");
  return s;
}
