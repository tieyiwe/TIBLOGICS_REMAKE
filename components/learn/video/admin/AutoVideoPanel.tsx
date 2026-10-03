"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioLines, CircleStop, ListChecks, Play, RefreshCw, Zap } from "lucide-react";
import { Button, Card, Notice, StatCard, tableStyles, useConfirm, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import type { VideoSummary } from "@/lib/learn/video/queue";

// The narrated-video pipeline on /admin_pro/learn/videos: which voice and
// storage are in use, how far generation has got, what the rest would cost,
// and the bulk actions (plan, generate or cancel, all or one track). Polls while jobs
// are queued or running.

const usd = (n: number) => `$${n.toFixed(2)}`;
const ago = (iso: string | null) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};
// A queue with work that has not started anything for this long is not being run.
const STALLED_MIN = 30;

export default function AutoVideoPanel() {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [s, setS] = useState<VideoSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/learn/video/auto", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not load");
      setS(d);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = (s?.jobs.queued ?? 0) + (s?.jobs.running ?? 0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      void load();
      router.refresh();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [active, load, router]);

  async function post(key: string, body: Record<string, unknown>, done: (d: Record<string, number>) => string) {
    setBusy(key);
    try {
      const r = await fetch("/api/admin/learn/video/auto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Something went wrong");
      toast.success(done(d));
      await load();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function generate(trackId?: string, title?: string) {
    if (!s) return;
    const e = s.estimate;
    const tr = trackId ? s.perTrack.find((x) => x.trackId === trackId) : undefined;
    const ok = await confirm({
      title: trackId ? `Generate videos for ${title}?` : "Generate every planned video?",
      body: (
        <div className="space-y-2">
          <p>
            {trackId
              ? `${tr?.estVideos ?? 0} videos (English and French) for the lessons in this track that the plan includes and that have no current video are queued.`
              : `${e.videos} videos for ${e.lessons} lessons (English and French) are queued.`}{" "}
            The &ldquo;videos&rdquo; cron job makes them a few at a time (VIDEO_MAX_PER_RUN, default 2, every 15 minutes).
          </p>
          {tr && <p className="font-semibold">Estimated cost: about {usd(tr.estUsd)} (voice and AI scripts).</p>}
          {!trackId && (
            <p className="font-semibold">
              Estimated cost: about {usd(e.totalUsd)} ({usd(e.ttsUsd)} voice for {e.chars.toLocaleString()} characters, about {e.minutes} minutes of
              narration, plus {usd(e.aiUsd)} for AI scripts and translation).
            </p>
          )}
          {!s.provider.provider && <p className="text-[var(--a-danger)]">No voice provider is set: jobs will wait as &ldquo;needs voice key&rdquo;.</p>}
        </div>
      ),
      confirmLabel: "Queue videos",
      danger: false,
    });
    if (!ok) return;
    await post(trackId ? `gen:${trackId}` : "gen", { action: "generate", trackId }, (d) => `${d.queued ?? 0} video jobs queued.`);
  }

  async function runNow() {
    setBusy("run");
    try {
      const r = await fetch("/api/admin/learn/video/auto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "run" }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Something went wrong");
      if (d.done) toast.success("One video made. Preview it on its lesson row below.");
      else if (d.needsTts) toast.error("No voice key is set: the videos wait as \u201cneeds voice key\u201d.");
      else if (d.error) toast.error(`The video failed: ${d.error}`);
      else toast.success("Nothing started: no video is queued, or one is already being made.");
      await load();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function cancel(trackId?: string, title?: string) {
    const ok = await confirm({
      title: trackId ? `Cancel the queued videos for ${title}?` : "Cancel every queued video?",
      body: "Videos waiting in the queue are taken out and nothing is spent on them. A video being made right now finishes. Press Generate again any time to queue them back.",
      confirmLabel: "Cancel queued",
      danger: true,
    });
    if (!ok) return;
    await post(trackId ? `cancel:${trackId}` : "cancel", { action: "cancel", trackId }, (d) => `${d.cancelled ?? 0} queued videos cancelled.`);
  }

  if (err && !s) return <Notice tone="danger" title="Narrated videos">{err}</Notice>;
  if (!s) return <Card title="Narrated videos (AI voice)"><p className="font-dm text-[13px] text-[var(--a-ink-3)]">Loading…</p></Card>;

  const e = s.estimate;
  const waiting = s.jobs.queued + s.jobs.needs_tts;
  const cancellable = waiting + s.activity.stuck;
  const lastMove = [s.activity.lastStartedAt, s.activity.lastFinishedAt].filter(Boolean).sort().pop() ?? null;
  const stalled = s.jobs.queued > 0 && (!lastMove || Date.now() - new Date(lastMove).getTime() > STALLED_MIN * 60_000);
  return (
    <Card
      title="Narrated videos (AI voice)"
      icon={AudioLines}
      subtitle="Slides and an AI voice-over made from each lesson, in English and French. Learners see them with chapters, captions and a transcript."
      action={
        <>
          <Button size="sm" icon={ListChecks} loading={busy === "plan"} onClick={() => post("plan", { action: "plan" }, (d) => `Planned ${d.planned ?? 0} lessons: ${d.yes ?? 0} with a video, ${d.no ?? 0} without${d.pending ? `, ${d.pending} provisional` : ""}.`)} data-testid="video-plan-all">
            Plan videos for all tracks
          </Button>
          {s.jobs.queued > 0 && (
            <Button size="sm" icon={Zap} loading={busy === "run"} disabled={!!busy} onClick={runNow} data-testid="video-run-now">
              Make next video now
            </Button>
          )}
          {cancellable > 0 && (
            <Button size="sm" variant="danger" icon={CircleStop} loading={busy === "cancel"} onClick={() => cancel()} data-testid="video-cancel-all">
              Cancel queued ({cancellable})
            </Button>
          )}
          <Button size="sm" variant="primary" icon={Play} loading={busy === "gen"} onClick={() => generate()} disabled={!e.videos} data-testid="video-generate-all">
            Generate all planned
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {s.provider.provider ? (
          <p className="font-dm text-[13px] text-[var(--a-ink-2)]" data-testid="video-provider">
            Voice: <b>{s.provider.provider === "google" ? "Google Cloud Text-to-Speech" : "OpenAI TTS"}</b> ({s.provider.voices?.en} · {s.provider.voices?.fr}). Files stored in{" "}
            <b>{s.storage === "object" ? "Replit Object Storage" : "the database"}</b>.
          </p>
        ) : (
          <Notice tone="warn" title="No voice provider configured" >
            Set <code>GOOGLE_TTS_API_KEY</code> (Google Cloud Text-to-Speech) or <code>OPENAI_API_KEY</code> in the Replit Secrets, then restart. Until then
            videos are not made: queued jobs wait as &ldquo;needs voice key&rdquo; and start on their own once a key is set. Silent videos are never published.
          </Notice>
        )}

        {stalled && (
          <div data-testid="video-stalled"><Notice tone="warn" title="Queued videos are not being made">
            {s.jobs.queued} videos are queued, and no video has started {lastMove ? `since ${ago(lastMove)}` : "yet"}. Videos are made by the
            &ldquo;videos&rdquo; scheduled job (<code>npm run cron videos</code>, every 15 minutes), 2 at a time. Schedule it in Replit, or press
            &ldquo;Make next video now&rdquo; to make one at a time from here.
          </Notice></div>
        )}
        {s.activity.lastError && (
          <div data-testid="video-last-error"><Notice tone="danger" title="Last error">
            {s.activity.lastError.lessonTitle} ({s.activity.lastError.locale.toUpperCase()}), {ago(s.activity.lastError.at)}: {s.activity.lastError.error}
          </Notice></div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Lessons a video helps" value={s.include} hint={`${s.planned} of ${s.lessons} lessons planned · ${s.exclude} better read · ${s.ownVideo} have your own video`} />
          <StatCard label="Videos made" value={s.jobs.done} tone="success" hint="Each lesson has an English and a French video" />
          <StatCard
            label="In progress"
            value={active}
            tone={active ? "orange" : "default"}
            hint={`${s.jobs.queued} queued · ${s.jobs.running} running${s.activity.stuck ? ` (${s.activity.stuck} stuck)` : ""} · last started ${ago(s.activity.lastStartedAt)}`}
          />
          <StatCard
            label="Need attention"
            value={s.jobs.failed + s.jobs.needs_tts}
            tone={s.jobs.failed + s.jobs.needs_tts ? "warn" : "default"}
            hint={`${s.jobs.failed} failed · ${s.jobs.needs_tts} need a voice key`}
          />
        </div>

        <p className="font-dm text-[13px] text-[var(--a-ink-2)]" data-testid="video-estimate">
          {e.videos ? (
            <>
              Still to make: <b>{e.videos} videos</b> for {e.lessons} lessons, about {e.minutes} minutes of narration ({e.chars.toLocaleString()} characters). Estimated
              cost <b>{usd(e.totalUsd)}</b>: {usd(e.ttsUsd)} voice at ${s.provider.pricePerMChar} per million characters, {usd(e.aiUsd)} AI scripts and French
              translation.
            </>
          ) : (
            <>Every planned lesson has a current video.</>
          )}
        </p>
        {process.env.NEXT_PUBLIC_BUILD_SHA ? (
          <p className="font-dm text-[11px] text-[var(--a-ink-3)]" data-testid="build-version">Live version: {process.env.NEXT_PUBLIC_BUILD_SHA}</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className={cn(tableStyles.table, "min-w-[560px]")}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>Track</th>
                <th className={cn(tableStyles.th, "text-right")}>With video planned</th>
                <th className={cn(tableStyles.th, "text-right")}>Made</th>
                <th className={cn(tableStyles.th, "text-right")}>Queued</th>
                <th className={cn(tableStyles.th, "text-right")}>Failed</th>
                <th className={tableStyles.th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {s.perTrack.map((t) => (
                <tr key={t.trackId} className={tableStyles.tr}>
                  <td className={cn(tableStyles.td, "font-medium text-[var(--a-ink)]")}>{t.title}</td>
                  <td className={cn(tableStyles.td, "text-right tabular-nums")}>
                    {t.include} / {t.lessons}
                  </td>
                  <td className={cn(tableStyles.td, "text-right tabular-nums")}>{t.done}</td>
                  <td className={cn(tableStyles.td, "text-right tabular-nums")}>{t.queued}</td>
                  <td className={cn(tableStyles.td, "text-right tabular-nums", t.failed ? "text-[var(--a-danger)]" : "")}>{t.failed}</td>
                  <td className={cn(tableStyles.td, "text-right")}>
                    <span className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" icon={RefreshCw} loading={busy === `plan:${t.trackId}`} onClick={() => post(`plan:${t.trackId}`, { action: "plan", trackId: t.trackId }, (d) => `Planned ${d.planned ?? 0} lessons in ${t.title}.`)}>
                        Plan
                      </Button>
                      <Button size="sm" variant="ghost" icon={Play} loading={busy === `gen:${t.trackId}`} onClick={() => generate(t.trackId, t.title)} disabled={!t.include}>
                        Generate
                      </Button>
                      {t.queued + t.needsTts > 0 && (
                        <Button size="sm" variant="ghost" icon={CircleStop} loading={busy === `cancel:${t.trackId}`} onClick={() => cancel(t.trackId, t.title)} data-testid="video-cancel-track">
                          Cancel
                        </Button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
