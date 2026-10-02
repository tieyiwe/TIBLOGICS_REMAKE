// Text-to-speech for the narrated lesson videos. Pluggable: Google Cloud
// Text-to-Speech (REST, API key) first, OpenAI TTS as a fallback. With
// neither key set there is no provider, and the pipeline marks jobs
// "needs_tts" instead of making silent videos.
//
// Environment:
//   GOOGLE_TTS_API_KEY        Google Cloud API key (Cloud Text-to-Speech API enabled)
//   GOOGLE_TTS_VOICE_EN       default en-US-Neural2-F
//   GOOGLE_TTS_VOICE_FR       default fr-FR-Neural2-A
//   GOOGLE_TTS_RATE           speaking rate, default 1.0 (0.8-1.2 sensible)
//   GOOGLE_TTS_API_BASE       default https://texttospeech.googleapis.com (tests point it at a mock)
//   OPENAI_API_KEY            fallback provider
//   OPENAI_TTS_MODEL          default gpt-4o-mini-tts
//   OPENAI_TTS_VOICE_EN / _FR default coral
//   OPENAI_API_BASE           default https://api.openai.com
//   VIDEO_TTS_PROVIDER        google | openai, to force one when both keys are set
//   VIDEO_TTS_PRICE_PER_MCHAR override the price used for cost estimates (USD per million characters)

export type TtsLocale = "en" | "fr";

export interface TtsProvider {
  id: "google" | "openai";
  voice(locale: TtsLocale): string;
  /** USD per million characters, for estimates. */
  pricePerMChar(locale: TtsLocale): number;
  /** MP3 audio for the text, one buffer per request chunk, in order. */
  synthesize(text: string, locale: TtsLocale): Promise<Buffer[]>;
}

const TIMEOUT_MS = 60_000;

async function withRetry<T>(what: string, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const status = (err as { status?: number }).status ?? 0;
      // Bad key, bad voice, bad request: retrying will not help.
      if (status >= 400 && status < 500 && status !== 429 && status !== 408) break;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1) ** 2));
    }
  }
  throw last instanceof Error ? last : new Error(`${what} failed`);
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Sentences, kept whole where possible. */
function sentences(text: string): string[] {
  return text.replace(/\s+/g, " ").trim().split(/(?<=[.!?:;])\s+/).filter(Boolean);
}

/** Splits text into pieces whose encoded size (by `size`) stays under `limit`. */
export function chunkText(text: string, limit: number, size: (s: string) => number = (s) => Buffer.byteLength(s, "utf8")): string[] {
  const out: string[] = [];
  let cur = "";
  const push = () => {
    if (cur.trim()) out.push(cur.trim());
    cur = "";
  };
  for (const s of sentences(text)) {
    const next = cur ? `${cur} ${s}` : s;
    if (size(next) <= limit) {
      cur = next;
      continue;
    }
    push();
    if (size(s) <= limit) {
      cur = s;
      continue;
    }
    // One very long sentence: cut at word boundaries.
    for (const w of s.split(" ")) {
      const n = cur ? `${cur} ${w}` : w;
      if (size(n) > limit) {
        push();
        cur = w;
      } else cur = n;
    }
  }
  push();
  return out;
}

// ── Google Cloud Text-to-Speech ─────────────────────────────────────────────

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** SSML with a short pause between sentences. */
export function toSsml(text: string): string {
  return `<speak>${sentences(text).map(xml).join(' <break time="250ms"/> ')}</speak>`;
}

function googleProvider(key: string): TtsProvider {
  const base = (process.env.GOOGLE_TTS_API_BASE || "https://texttospeech.googleapis.com").replace(/\/$/, "");
  const voices: Record<TtsLocale, string> = {
    en: process.env.GOOGLE_TTS_VOICE_EN || "en-US-Neural2-F",
    fr: process.env.GOOGLE_TTS_VOICE_FR || "fr-FR-Neural2-A",
  };
  const rate = Number(process.env.GOOGLE_TTS_RATE) || 1;
  // Chirp and Journey voices take plain text only (no SSML).
  const plain = (v: string) => /chirp|journey/i.test(v);
  return {
    id: "google",
    voice: (l) => voices[l],
    pricePerMChar: (l) => {
      const v = voices[l].toLowerCase();
      const env = Number(process.env.VIDEO_TTS_PRICE_PER_MCHAR);
      if (env > 0) return env;
      if (v.includes("studio")) return 160;
      if (v.includes("chirp")) return 30;
      if (v.includes("neural2") || v.includes("polyglot") || v.includes("journey")) return 16;
      if (v.includes("wavenet")) return 16;
      return 4; // Standard
    },
    async synthesize(text, locale) {
      const voice = voices[locale];
      const languageCode = voice.split("-").slice(0, 2).join("-");
      const usePlain = plain(voice);
      // The API limit is 5,000 bytes of input; stay well under with the SSML markup.
      const pieces = chunkText(text, 4500, (s) => Buffer.byteLength(usePlain ? s : toSsml(s), "utf8"));
      const out: Buffer[] = [];
      for (const piece of pieces) {
        const buf = await withRetry("Google TTS", async () => {
          const res = await fetch(`${base}/v1/text:synthesize`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              input: usePlain ? { text: piece } : { ssml: toSsml(piece) },
              voice: { languageCode, name: voice },
              audioConfig: { audioEncoding: "MP3", speakingRate: rate, sampleRateHertz: 24000 },
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!res.ok) {
            const msg = (await res.text().catch(() => "")).slice(0, 300);
            throw new HttpError(res.status, `Google TTS ${res.status}: ${msg}`);
          }
          const data = (await res.json()) as { audioContent?: string };
          if (!data.audioContent) throw new Error("Google TTS returned no audio");
          return Buffer.from(data.audioContent, "base64");
        });
        out.push(buf);
      }
      return out;
    },
  };
}

// ── OpenAI TTS ──────────────────────────────────────────────────────────────

function openAiProvider(key: string): TtsProvider {
  const base = (process.env.OPENAI_API_BASE || "https://api.openai.com").replace(/\/$/, "");
  const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
  const voices: Record<TtsLocale, string> = {
    en: process.env.OPENAI_TTS_VOICE_EN || "coral",
    fr: process.env.OPENAI_TTS_VOICE_FR || "coral",
  };
  return {
    id: "openai",
    voice: (l) => `${model}/${voices[l]}`,
    // About $0.015 a minute of audio; a minute is about 900 characters.
    pricePerMChar: () => Number(process.env.VIDEO_TTS_PRICE_PER_MCHAR) || 17,
    async synthesize(text, locale) {
      const out: Buffer[] = [];
      for (const piece of chunkText(text, 3800, (s) => s.length)) {
        const buf = await withRetry("OpenAI TTS", async () => {
          const res = await fetch(`${base}/v1/audio/speech`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model,
              voice: voices[locale],
              input: piece,
              response_format: "mp3",
              ...(model.includes("gpt-4o")
                ? { instructions: `Warm, clear, steady teaching voice${locale === "fr" ? ", in natural French" : ""}. Moderate pace.` }
                : {}),
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          if (!res.ok) {
            const msg = (await res.text().catch(() => "")).slice(0, 300);
            throw new HttpError(res.status, `OpenAI TTS ${res.status}: ${msg}`);
          }
          return Buffer.from(await res.arrayBuffer());
        });
        out.push(buf);
      }
      return out;
    },
  };
}

/** The configured provider, or null when no key is set. */
export function ttsProvider(): TtsProvider | null {
  const google = process.env.GOOGLE_TTS_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const forced = process.env.VIDEO_TTS_PROVIDER?.trim().toLowerCase();
  if (forced === "openai" && openai) return openAiProvider(openai);
  if (forced === "google" && google) return googleProvider(google);
  if (google) return googleProvider(google);
  if (openai) return openAiProvider(openai);
  return null;
}

/** For the admin: which provider and voices, without secrets. */
export function ttsStatus(): { provider: "google" | "openai" | null; voices: Record<TtsLocale, string> | null; pricePerMChar: number } {
  const p = ttsProvider();
  if (!p) return { provider: null, voices: null, pricePerMChar: 16 };
  return { provider: p.id, voices: { en: p.voice("en"), fr: p.voice("fr") }, pricePerMChar: p.pricePerMChar("en") };
}
