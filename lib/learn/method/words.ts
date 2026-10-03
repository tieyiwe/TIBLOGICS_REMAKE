// Shared by the reflection box (browser) and the reflection API (server).

/** Reflections this long or longer earn the one-time reflection XP. */
export const REFLECTION_MIN_WORDS = 15;
export const REFLECTION_MAX_CHARS = 2000;

export function countWords(text: string): number {
  const m = text.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return m ? m.length : 0;
}
