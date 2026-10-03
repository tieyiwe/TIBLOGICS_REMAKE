// Text-to-speech for the narrated lesson videos. Pluggable: Google Cloud
// Text-to-Speech (REST, API key) first, OpenAI TTS as a fallback. With
// neither key set there is no provider, and the pipeline marks jobs
// "needs_tts" instead of making silent videos.
//
// Environment:
//   GOOGLE_TTS_API_KEY        Google Cloud API key (Cloud Text-to-Speech API enabled)
//   GOOGLE_TTS_VOICE_EN       default en-US-Chirp3-HD-Charon (male, Chirp 3 HD)
//   GOOGLE_TTS_VOICE_FR       default fr-FR-Chirp3-HD-Charon
//   GOOGLE_TTS_RATE           speaking rate, default 0.95 (0.8-1.2 sensible)
//   The voices and speed chosen in the admin (Videos, Voice card) override
//   these three; they are stored in AdminSettings "video_voice".
//   GOOGLE_TTS_API_BASE       default https://texttospeech.googleapis.com (tests point it at a mock)
//   OPENAI_API_KEY            fallback provider
//   OPENAI_TTS_MODEL          default gpt-4o-mini-tts
//   OPENAI_TTS_VOICE_EN / _FR default coral
//   OPENAI_API_BASE           default https://api.openai.com
//   VIDEO_TTS_PROVIDER        google | openai, to force one when both keys are set
//   VIDEO_TTS_PRICE_PER_MCHAR override the price used for cost estimates (USD per million characters)

export type TtsLocale = "en" | "fr";

export const DEFAULT_VOICES: Record<TtsLocale, string> = { en: "en-US-Chirp3-HD-Charon", fr: "fr-FR-Chirp3-HD-Charon" };
export const DEFAULT_RATE = 0.95;
export const VOICE_SETTING_KEY = "video_voice";

/** Voices and speed chosen in the admin; null fields fall back to the environment. */
export interface VoiceSettings {
  en?: string;
  fr?: string;
  rate?: number;
}

let chosen: { v: VoiceSettings; at: number } | null = null;

/** Reads the admin's voice choice (cached 30 seconds). Call before ttsProvider() where it matters. */
export async function loadVoiceSettings(force = false): Promise<VoiceSettings> {
  if (!force && chosen && Date.now() - chosen.at < 30_000) return chosen.v;
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const row = await prisma.adminSettings.findUnique({ where: { key: VOICE_SETTING_KEY } });
    chosen = { v: parseVoiceSettings(row?.value), at: Date.now() };
  } catch {
    chosen = { v: chosen?.v ?? {}, at: Date.now() };
  }
  return chosen.v;
}

/** After the admin saves a new choice. */
export function setVoiceSettingsCache(v: VoiceSettings) {
  chosen = { v, at: Date.now() };
}

export const VOICE_NAME = /^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9-]{2,60}$/;

export function parseVoiceSettings(raw: unknown): VoiceSettings {
  try {
    const o = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown> | null;
    if (!o || typeof o !== "object") return {};
    const out: VoiceSettings = {};
    if (typeof o.en === "string" && VOICE_NAME.test(o.en)) out.en = o.en;
    if (typeof o.fr === "string" && VOICE_NAME.test(o.fr)) out.fr = o.fr;
    if (typeof o.rate === "number" && o.rate >= 0.75 && o.rate <= 1.25) out.rate = Math.round(o.rate * 100) / 100;
    return out;
  } catch {
    return {};
  }
}

export interface TtsProvider {
  id: "google" | "openai";
  voice(locale: TtsLocale): string;
  /** USD per million characters, for estimates. */
  pricePerMChar(locale: TtsLocale): number;
  /** MP3 audio for the text, one buffer per request chunk, in order. */
  synthesize(text: string, locale: TtsLocale): Promise<Buffer[]>;
}

const TIMEOUT_MS = 60_000;

// ── Audio cache ─────────────────────────────────────────────────────────────
// Narration already paid for is kept on local disk for a while (by provider,
// voice, speed and text), so a retry after a later step failed, or a video
// re-made with the same voice and words, does not pay for the voice again.
// Local and temporary: lost on restart, which only means paying once more.

const CACHE_MAX_FILES = 400;

async function cacheDir(): Promise<string> {
  const os = await import("os");
  const path = await import("path");
  return path.join(os.tmpdir(), "arfa-tts-cache");
}

async function cached(key: string, make: () => Promise<Buffer>): Promise<Buffer> {
  const { createHash } = await import("crypto");
  const fs = await import("fs/promises");
  const path = await import("path");
  const dir = await cacheDir();
  const file = path.join(dir, `${createHash("sha256").update(key).digest("hex").slice(0, 40)}.mp3`);
  const hit = await fs.readFile(file).catch(() => null);
  if (hit && hit.length > 0) return hit;
  const buf = await make();
  try {
    await fs.mkdir(dir, { recursive: true });
    // Written aside and renamed: a crash mid-write never leaves a cut-off file to reuse.
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, buf);
    await fs.rename(tmp, file);
    const names = await fs.readdir(dir);
    if (names.length > CACHE_MAX_FILES) {
      const stats = await Promise.all(names.map(async (n) => ({ n, t: (await fs.stat(path.join(dir, n)).catch(() => null))?.mtimeMs ?? 0 })));
      stats.sort((a, b) => a.t - b.t);
      for (const { n } of stats.slice(0, names.length - CACHE_MAX_FILES)) await fs.rm(path.join(dir, n), { force: true }).catch(() => {});
    }
  } catch {
    /* a full disk only loses the cache */
  }
  return buf;
}

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
  const pick = chosen?.v ?? {};
  const voices: Record<TtsLocale, string> = {
    en: pick.en || process.env.GOOGLE_TTS_VOICE_EN || DEFAULT_VOICES.en,
    fr: pick.fr || process.env.GOOGLE_TTS_VOICE_FR || DEFAULT_VOICES.fr,
  };
  const rate = pick.rate || Number(process.env.GOOGLE_TTS_RATE) || DEFAULT_RATE;
  // Chirp and Journey voices take plain text only (no SSML).
  const plain = (v: string) => /chirp|journey/i.test(v);
  return {
    id: "google",
    voice: (l) => voices[l],
    pricePerMChar: (l) => priceForVoice(voices[l]),
    async synthesize(text, locale) {
      const voice = voices[locale];
      const languageCode = voice.split("-").slice(0, 2).join("-");
      const usePlain = plain(voice);
      // The API limit is 5,000 bytes of input; stay well under with the SSML markup.
      const pieces = chunkText(text, 4500, (s) => Buffer.byteLength(usePlain ? s : toSsml(s), "utf8"));
      const out: Buffer[] = [];
      for (const piece of pieces) {
        out.push(
          await cached(`google|${voice}|${rate}|${usePlain ? "text" : "ssml"}|${piece}`, () =>
            googleSynthesize({ base, key, voice, languageCode, rate, input: usePlain ? { text: piece } : { ssml: toSsml(piece) } }),
          ),
        );
      }
      return out;
    },
  };
}

/** One Google request. A voice that does not take a speaking rate is asked again without one. */
async function googleSynthesize(o: { base: string; key: string; voice: string; languageCode: string; rate: number; input: { text: string } | { ssml: string } }): Promise<Buffer> {
  const call = (withRate: boolean) =>
    withRetry("Google TTS", async () => {
      const res = await fetch(`${o.base}/v1/text:synthesize`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": o.key },
        body: JSON.stringify({
          input: o.input,
          voice: { languageCode: o.languageCode, name: o.voice },
          audioConfig: { audioEncoding: "MP3", sampleRateHertz: 24000, ...(withRate ? { speakingRate: o.rate } : {}) },
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
  if (o.rate === 1) return call(false);
  try {
    return await call(true);
  } catch (err) {
    if (err instanceof HttpError && err.status === 400 && /rate|pace|speaking/i.test(err.message)) return call(false);
    throw err;
  }
}

export interface GoogleVoice {
  name: string;
  languageCode: string;
  gender: "MALE" | "FEMALE" | "NEUTRAL" | string;
  /** Chirp3-HD, Studio, Neural2, Wavenet, Standard, ... */
  family: string;
  pricePerMChar: number;
}

export function voiceFamily(name: string): string {
  const m = name.match(/^[a-z]{2,3}-[A-Z]{2}-(.+?)-[^-]+$/);
  return m ? m[1] : "Standard";
}

export function priceForVoice(name: string): number {
  const v = name.toLowerCase();
  const env = Number(process.env.VIDEO_TTS_PRICE_PER_MCHAR);
  if (env > 0) return env;
  if (v.includes("studio")) return 160;
  if (v.includes("chirp")) return 30;
  if (v.includes("neural2") || v.includes("polyglot") || v.includes("journey")) return 16;
  if (v.includes("wavenet")) return 16;
  return 4;
}

/** Google's voices for some languages (needs GOOGLE_TTS_API_KEY). */
export async function listGoogleVoices(languageCodes: string[]): Promise<GoogleVoice[]> {
  const key = process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!key) return [];
  const base = (process.env.GOOGLE_TTS_API_BASE || "https://texttospeech.googleapis.com").replace(/\/$/, "");
  const out: GoogleVoice[] = [];
  for (const lc of languageCodes) {
    const res = await fetch(`${base}/v1/voices?languageCode=${encodeURIComponent(lc)}`, { headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new HttpError(res.status, `Google TTS voices ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
    const data = (await res.json()) as { voices?: Array<{ name: string; languageCodes?: string[]; ssmlGender?: string }> };
    for (const v of data.voices ?? []) {
      if (!VOICE_NAME.test(v.name) || !v.name.startsWith(lc)) continue;
      out.push({ name: v.name, languageCode: lc, gender: v.ssmlGender ?? "", family: voiceFamily(v.name), pricePerMChar: priceForVoice(v.name) });
    }
  }
  return out;
}

/** A short spoken sample in one voice (MP3), for choosing a voice in the admin. */
export async function googleSample(voice: string, text: string, rate: number): Promise<Buffer> {
  const key = process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!key) throw new Error("GOOGLE_TTS_API_KEY is not set");
  if (!VOICE_NAME.test(voice)) throw new Error("Unknown voice");
  const base = (process.env.GOOGLE_TTS_API_BASE || "https://texttospeech.googleapis.com").replace(/\/$/, "");
  const languageCode = voice.split("-").slice(0, 2).join("-");
  const plain = /chirp|journey/i.test(voice);
  return googleSynthesize({ base, key, voice, languageCode, rate, input: plain ? { text } : { ssml: toSsml(text) } });
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
        const buf = await cached(`openai|${model}|${voices[locale]}|${locale}|${piece}`, () => withRetry("OpenAI TTS", async () => {
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
        }));
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
