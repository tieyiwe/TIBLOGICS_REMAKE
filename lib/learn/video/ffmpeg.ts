import { spawn } from "child_process";
import { existsSync } from "fs";
import os from "os";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { LEAD_SEC, TAIL_SEC } from "./timing";

// ffmpeg for the narrated lesson videos (the ffmpeg-static binary, or
// FFMPEG_PATH). Every run has a timeout and is killed when it passes.
//
//   VIDEO_KEN_BURNS=1     slow zoom on each slide (more CPU)
//   VIDEO_FFMPEG_THREADS  encoder threads (default 2)
//   VIDEO_FPS             default 25

let resolved: string | null = null;

export function ffmpegPath(): string {
  if (resolved) return resolved;
  const env = process.env.FFMPEG_PATH;
  if (env && existsSync(env)) return (resolved = env);
  // Resolved at runtime (the package is external to the server bundle).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const p = require("ffmpeg-static") as string | null;
  if (p && existsSync(p)) return (resolved = p);
  const local = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
  if (existsSync(local)) return (resolved = local);
  throw new Error("ffmpeg binary not found (install ffmpeg-static or set FFMPEG_PATH)");
}

export async function runFfmpeg(args: string[], timeoutMs: number): Promise<string> {
  const bin = ffmpegPath();
  return new Promise((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ bin, ["-hide_banner", "-nostdin", "-loglevel", "error", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    // Lowest CPU priority: on a shared server the website is served first.
    if (child.pid) {
      try {
        os.setPriority(child.pid, 19);
      } catch {
        /* not permitted here: runs at normal priority */
      }
    }
    let err = "";
    child.stderr.on("data", (d) => {
      if (err.length < 20_000) err += String(d);
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`ffmpeg timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(err);
      else reject(new Error(`ffmpeg exited ${code}: ${err.trim().split("\n").slice(-4).join(" | ").slice(0, 600)}`));
    });
  });
}

/** Duration in seconds of any media file (from ffmpeg's own report). */
export async function probe(file: string): Promise<{ duration: number; streams: string[] }> {
  const bin = ffmpegPath();
  const out: string = await new Promise((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ bin, ["-hide_banner", "-nostdin", "-i", file], { stdio: ["ignore", "ignore", "pipe"] });
    let s = "";
    child.stderr.on("data", (d) => (s += String(d)));
    const timer = setTimeout(() => child.kill("SIGKILL"), 20_000);
    child.on("error", reject);
    child.on("close", () => {
      clearTimeout(timer);
      resolve(s);
    });
  });
  const m = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(out);
  const duration = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
  const streams = [...out.matchAll(/Stream #\d+:\d+[^:]*: (.*)/g)].map((x) => x[1].trim());
  return { duration, streams };
}

const RATE = 48_000;

/** Exact length of a 16-bit mono PCM WAV from its data chunk. */
async function wavSeconds(file: string): Promise<number> {
  const buf = await readFile(file);
  for (let i = 12; i < Math.min(buf.length - 8, 4096); ) {
    const id = buf.toString("ascii", i, i + 4);
    const size = buf.readUInt32LE(i + 4);
    if (id === "data") return Math.min(size, buf.length - i - 8) / (RATE * 2);
    i += 8 + size + (size % 2);
  }
  throw new Error("Could not read the narration audio length");
}

/**
 * One scene's narration: the MP3 chunks from the TTS provider joined into a
 * WAV with a short lead-in and a pause at the end. Returns the speech length
 * (without the padding) and the padded scene length, both measured from the audio.
 */
export async function sceneAudio(chunks: string[], out: string): Promise<{ speech: number; total: number }> {
  const inputs = chunks.flatMap((c) => ["-i", c]);
  const joined = chunks.map((_, i) => `[${i}:a]aresample=${RATE},aformat=sample_fmts=s16:channel_layouts=mono[a${i}]`).join(";");
  const concat = `${chunks.map((_, i) => `[a${i}]`).join("")}concat=n=${chunks.length}:v=0:a=1[speech]`;
  const speechFile = out.replace(/\.wav$/, ".speech.wav");
  await runFfmpeg(["-y", ...inputs, "-filter_complex", `${joined};${concat}`, "-map", "[speech]", "-c:a", "pcm_s16le", "-ar", String(RATE), "-ac", "1", speechFile], 120_000);
  const speech = await wavSeconds(speechFile);
  await runFfmpeg(
    ["-y", "-i", speechFile, "-af", `adelay=${Math.round(LEAD_SEC * 1000)}:all=1,apad=pad_dur=${TAIL_SEC}`, "-c:a", "pcm_s16le", "-ar", String(RATE), "-ac", "1", out],
    120_000,
  );
  return { speech, total: await wavSeconds(out) };
}

/**
 * The video: each slide held for its scene's audio, a short crossfade from
 * the previous slide at the start of each scene, AAC audio, H.264 1080p with
 * fast start.
 *
 * Made one scene at a time and then joined without re-encoding: a single
 * filter graph over every slide made ffmpeg buffer frames for all of them
 * (about 2.4 GB for a 3-minute lesson), which ran a small server out of
 * memory and took the website down with it. A scene clip needs about 200 MB.
 * Each clip's length comes from the running total, rounded to whole frames,
 * so the slides never drift from the narration.
 */
export async function composeVideo(opts: { slides: string[]; audio: string[]; sceneSeconds: number[]; out: string; tmp: string }): Promise<void> {
  const { slides, audio, sceneSeconds, out, tmp } = opts;
  const fps = Number(process.env.VIDEO_FPS) || 25;
  const fade = 0.5;
  const kenBurns = process.env.VIDEO_KEN_BURNS === "1";
  const threads = ["-threads", process.env.VIDEO_FFMPEG_THREADS || "2", "-filter_threads", "1", "-filter_complex_threads", "1"];
  const encode = [
    "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-crf", "24",
    // No lookahead: the frames are stills, and it saves memory.
    "-x264-params", "rc-lookahead=0:sync-lookahead=0",
    "-maxrate", "3M", "-bufsize", "6M", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
    "-r", String(fps), "-g", String(fps * 10), "-an",
  ];
  // A still decoded once and repeated (tpad), not re-read for every frame.
  const hold = (secs: number) => `format=yuv420p,setsar=1,tpad=stop_mode=clone:stop_duration=${secs.toFixed(3)},fps=${fps}`;
  const zoomIn = kenBurns ? `,scale=2880:-1,zoompan=z='min(zoom+0.00025,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=${fps}` : "";
  // The previous slide as it ended (fully zoomed) for the crossfade.
  const zoomEnd = kenBurns ? ",scale=2016:-1,crop=1920:1080" : "";

  const clips: string[] = [];
  let cum = 0;
  let prevFrame = 0;
  for (let i = 0; i < slides.length; i++) {
    cum += sceneSeconds[i];
    const endFrame = Math.round(cum * fps);
    const frames = Math.max(1, endFrame - prevFrame);
    prevFrame = endFrame;
    const secs = frames / fps;
    const clip = path.join(tmp, `clip${i}.mp4`);
    const args =
      i === 0
        ? ["-y", "-i", slides[0], "-filter_complex", `[0:v]${hold(secs + 1)}${zoomIn}[v]`]
        : [
            "-y", "-i", slides[i - 1], "-i", slides[i],
            "-filter_complex",
            `[0:v]${hold(fade + 1)}${zoomEnd}[a];[1:v]${hold(secs + 1)}${zoomIn}[b];[a][b]xfade=transition=fade:duration=${fade}:offset=0[v]`,
          ];
    args.push("-map", "[v]", "-frames:v", String(frames), ...encode, ...threads, clip);
    await runFfmpeg(args, Math.min(30 * 60_000, Math.max(120_000, Math.round(secs * (kenBurns ? 8000 : 3000)))));
    clips.push(clip);
  }

  // Join the clips as they are, with the narration (scene WAVs) as one track.
  const list = (files: string[]) => files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
  const videoList = path.join(tmp, "clips.txt");
  const audioList = path.join(tmp, "audio.txt");
  await writeFile(videoList, list(clips));
  await writeFile(audioList, list(audio));
  const total = sceneSeconds.reduce((a, b) => a + b, 0);
  await runFfmpeg(
    [
      "-y", "-f", "concat", "-safe", "0", "-i", videoList, "-f", "concat", "-safe", "0", "-i", audioList,
      "-map", "0:v", "-map", "1:a", "-c:v", "copy",
      "-c:a", "aac", "-b:a", "96k", "-ac", "1", "-ar", "48000",
      "-t", total.toFixed(3), "-movflags", "+faststart",
      out,
    ],
    Math.min(30 * 60_000, Math.max(120_000, Math.round(total * 1000))),
  );
}

/** Optional WebM (VP9 + Opus) copy for browsers without H.264 (VIDEO_WEBM=1). */
export async function toWebm(mp4: string, out: string, seconds: number): Promise<void> {
  const threads = process.env.VIDEO_FFMPEG_THREADS ? ["-threads", process.env.VIDEO_FFMPEG_THREADS] : [];
  await runFfmpeg(
    ["-y", "-i", mp4, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-deadline", "realtime", "-cpu-used", "8", "-row-mt", "1", "-c:a", "libopus", "-b:a", "64k", ...threads, out],
    Math.min(30 * 60_000, Math.max(180_000, Math.round(seconds * 4000))),
  );
}
