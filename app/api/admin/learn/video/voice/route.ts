import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { staffAiLimit } from "@/lib/rate-limit";
import { polishSample } from "@/lib/learn/video/ffmpeg";
import { queueRevoice } from "@/lib/learn/video/queue";
import {
  DEFAULT_RATE,
  DEFAULT_VOICES,
  VOICE_NAME,
  VOICE_SETTING_KEY,
  googleSample,
  listGoogleVoices,
  loadVoiceSettings,
  setVoiceSettingsCache,
  ttsProvider,
  type GoogleVoice,
} from "@/lib/learn/video/tts";

// Staff only: the narration voice on /admin_pro/learn/videos.
//   GET                                   the chosen voices and speed, and the male voices to choose from
//   POST { action: "sample", voice, rate } a short spoken sample (MP3), with the same polish as the videos
//   POST { action: "save", en, fr, rate }  use these for every new video
//   POST { action: "revoice" }             re-make the videos made with another voice (scripts reused)

export const maxDuration = 120;

const LANGS: Record<"en" | "fr", string[]> = { en: ["en-US", "en-GB"], fr: ["fr-FR", "fr-CA"] };
// Most natural first. Standard voices are left out: they are the robotic ones.
const FAMILY_ORDER = ["Chirp3-HD", "Studio", "Chirp-HD", "Neural2", "Wavenet", "Polyglot"];

// The same sample for every voice, in a lecturer's register, so voices are compared fairly.
const SAMPLE: Record<"en" | "fr", string> = {
  en: "Here is the idea I want you to hold on to. A tool is only as useful as the question you bring to it. So before you ask the AI anything, pause, and decide what a good answer would actually look like. That one habit will change the quality of everything that follows.",
  fr: "Voici l'idée que je veux que vous reteniez. Un outil ne vaut que par la question qu'on lui pose. Alors, avant de demander quoi que ce soit à l'IA, prenez un instant pour décider à quoi ressemblerait une bonne réponse. Cette seule habitude change la qualité de tout ce qui suit.",
};

// Samples are cached in memory: playing a voice twice costs nothing.
const cache = new Map<string, Buffer>();

let voicesCache: { at: number; list: GoogleVoice[] } | null = null;

async function maleVoices(): Promise<Record<"en" | "fr", GoogleVoice[]>> {
  if (!voicesCache || Date.now() - voicesCache.at > 6 * 3_600_000) {
    voicesCache = { at: Date.now(), list: await listGoogleVoices([...LANGS.en, ...LANGS.fr]) };
  }
  const pick = (codes: string[]) =>
    voicesCache!.list
      .filter((v) => codes.includes(v.languageCode) && v.gender === "MALE" && FAMILY_ORDER.includes(v.family))
      .sort((a, b) => FAMILY_ORDER.indexOf(a.family) - FAMILY_ORDER.indexOf(b.family) || codes.indexOf(a.languageCode) - codes.indexOf(b.languageCode) || a.name.localeCompare(b.name));
  return { en: pick(LANGS.en), fr: pick(LANGS.fr) };
}

export async function GET() {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const chosen = await loadVoiceSettings(true);
  const p = ttsProvider();
  let voices: Record<"en" | "fr", GoogleVoice[]> = { en: [], fr: [] };
  let error: string | null = null;
  if (p?.id === "google") {
    try {
      voices = await maleVoices();
    } catch (err) {
      console.error("[admin/video/voice] list", err);
      error = "Could not load Google's voice list. Check that the Cloud Text-to-Speech API is enabled for the key.";
    }
  }
  return NextResponse.json({
    provider: p?.id ?? null,
    current: { en: p?.voice("en") ?? null, fr: p?.voice("fr") ?? null },
    rate: chosen.rate ?? (Number(process.env.GOOGLE_TTS_RATE) || DEFAULT_RATE),
    defaults: { ...DEFAULT_VOICES, rate: DEFAULT_RATE },
    voices,
    error,
  });
}

const Voice = z.string().regex(VOICE_NAME);
const Rate = z.number().min(0.8).max(1.2);
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("sample"), voice: Voice, rate: Rate }),
  z.object({ action: z.literal("save"), en: Voice, fr: Voice, rate: Rate }),
  z.object({ action: z.literal("revoice") }),
]);

export async function POST(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;
  try {
    switch (body.action) {
      case "sample": {
        if (!process.env.GOOGLE_TTS_API_KEY) return NextResponse.json({ error: "GOOGLE_TTS_API_KEY is not set." }, { status: 400 });
        const lang = body.voice.startsWith("fr-") ? "fr" : body.voice.startsWith("en-") ? "en" : null;
        if (!lang) return NextResponse.json({ error: "Only English and French voices." }, { status: 400 });
        const key = `${body.voice}|${body.rate}`;
        let audio = cache.get(key);
        if (!audio) {
          // A sample is about 300 characters (well under a cent); the ceiling stops a loop.
          const limited = await staffAiLimit("video-voice-sample", 120);
          if (limited) return limited;
          const tmp = await mkdtemp(path.join(os.tmpdir(), "arfa-voice-"));
          try {
            audio = await polishSample(await googleSample(body.voice, SAMPLE[lang], body.rate), tmp);
          } finally {
            await rm(tmp, { recursive: true, force: true }).catch(() => {});
          }
          if (cache.size > 60) cache.delete(cache.keys().next().value as string);
          cache.set(key, audio);
        }
        return new NextResponse(new Uint8Array(audio), { headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=3600" } });
      }
      case "save": {
        if (!body.en.startsWith("en-") || !body.fr.startsWith("fr-")) return NextResponse.json({ error: "Pick an English voice and a French voice." }, { status: 400 });
        const value = { en: body.en, fr: body.fr, rate: Math.round(body.rate * 100) / 100 };
        await prisma.adminSettings.upsert({
          where: { key: VOICE_SETTING_KEY },
          create: { key: VOICE_SETTING_KEY, value: JSON.stringify(value) },
          update: { value: JSON.stringify(value) },
        });
        setVoiceSettingsCache(value);
        return NextResponse.json({ ok: true, ...value });
      }
      case "revoice": {
        const queued = await queueRevoice();
        return NextResponse.json({ ok: true, queued });
      }
    }
  } catch (err) {
    console.error("[POST admin/learn/video/voice]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message.slice(0, 300) : "Something went wrong." }, { status: 500 });
  }
}
