"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Play, Trash2 } from "lucide-react";
import { Badge, Button, Drawer, useConfirm, useToast, type BadgeTone } from "@/components/admin/ui";
import VideoPlayer from "../VideoPlayer";
import { readVariants, type Variant as ClientVariant } from "@/lib/learn/video/variants";

// One lesson's narrated video on /admin_pro/learn/videos: whether the plan
// includes it (and why), the staff override, the English and French job
// status, and Generate / Regenerate / Remove / Preview.

export interface RowJob {
  status: string;
  error: string | null;
  durationSec: number;
}

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  queued: { label: "Queued", tone: "info" },
  running: { label: "Making…", tone: "orange" },
  done: { label: "Ready", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  needs_tts: { label: "Needs voice key", tone: "warn" },
  skipped: { label: "Off", tone: "neutral" },
};

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function AutoVideoRow({
  lessonId,
  lessonTitle,
  planned,
  decision,
  reason,
  override,
  ownVideo,
  generated,
  stale,
  jobs,
}: {
  lessonId: string;
  lessonTitle: string;
  planned: boolean;
  decision: boolean;
  reason: string;
  override: "include" | "exclude" | null;
  ownVideo: boolean;
  generated: boolean;
  /** The lesson changed since its video was made. */
  stale: boolean;
  jobs: { en?: RowJob; fr?: RowJob };
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ en?: ClientVariant; fr?: ClientVariant } | null>(null);
  const [lang, setLang] = useState<"en" | "fr">("en");

  async function post(key: string, body: Record<string, unknown>, ok: string) {
    setBusy(key);
    try {
      const r = await fetch("/api/admin/learn/video/auto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId, ...body }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Something went wrong");
      toast.success(ok);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function openPreview() {
    setBusy("preview");
    try {
      const r = await fetch(`/api/admin/learn/video?lessonId=${encodeURIComponent(lessonId)}`);
      const d = await r.json();
      const v = readVariants(d.variants);
      if (!v.en && !v.fr) throw new Error("No generated video yet.");
      setLang(v.en ? "en" : "fr");
      setPreview(v);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the preview");
    } finally {
      setBusy(null);
    }
  }

  const include = override === "include" ? true : override === "exclude" ? false : decision;
  const running = jobs.en?.status === "running" || jobs.fr?.status === "running" || jobs.en?.status === "queued" || jobs.fr?.status === "queued";
  const shown = preview?.[lang];

  if (ownVideo) return <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">Your own video is used</span>;

  return (
    <div className="flex min-w-[300px] flex-col gap-1.5" data-testid={`auto-video-${lessonId}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span title={reason || undefined}>
          {planned || override ? (
            <Badge tone={include ? "success" : "neutral"}>{include ? "Video helps" : "Better read"}</Badge>
          ) : (
            <Badge tone="neutral">Not planned</Badge>
          )}
        </span>
        <select
          aria-label={`Video for ${lessonTitle}`}
          value={override ?? "auto"}
          disabled={!!busy}
          onChange={(e) => {
            const v = e.target.value;
            void post("override", { action: "override", override: v === "auto" ? null : v }, v === "auto" ? "Back to the automatic choice." : v === "include" ? "This lesson will get a video." : "This lesson will not get a video.");
          }}
          className="h-7 rounded-md border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-1.5 font-dm text-[12px] text-[var(--a-ink)]"
          data-testid="video-override"
        >
          <option value="auto">Auto</option>
          <option value="include">Always</option>
          <option value="exclude">Never</option>
        </select>
        {(["en", "fr"] as const).map((l) => {
          const j = jobs[l];
          if (!j) return null;
          const st = STATUS[j.status] ?? { label: j.status, tone: "neutral" as BadgeTone };
          return (
            <span key={l} title={j.error ?? (j.durationSec ? fmt(j.durationSec) : undefined)}>
              <Badge tone={st.tone}>
                {l.toUpperCase()} {st.label}
                {j.status === "done" && j.durationSec ? ` ${fmt(j.durationSec)}` : ""}
              </Badge>
            </span>
          );
        })}
        {stale && <Badge tone="warn">Lesson changed</Badge>}
      </div>
      <div className="flex flex-wrap gap-1">
        {include && (
          <Button size="sm" variant="ghost" icon={Play} loading={busy === "gen"} disabled={running} onClick={() => post("gen", { action: "generate" }, "Queued: the video is being made now.")} data-testid="video-generate">
            {generated || jobs.en ? "Regenerate" : "Generate"}
          </Button>
        )}
        {generated && (
          <>
            <Button size="sm" variant="ghost" icon={Eye} loading={busy === "preview"} onClick={openPreview} data-testid="video-preview">
              Preview
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              loading={busy === "remove"}
              onClick={async () => {
                if (await confirm({ title: "Remove the generated video?", body: "Learners stop seeing it. Set the lesson to Never to keep it from being made again.", confirmLabel: "Remove" }))
                  await post("remove", { action: "remove" }, "Video removed from the lesson.");
              }}
            >
              Remove
            </Button>
          </>
        )}
      </div>
      <Drawer open={!!preview} onClose={() => setPreview(null)} title={`Preview: ${lessonTitle}`} width={760}>
        {preview && (
          <div className="space-y-3">
            <div className="inline-flex rounded-md border border-[var(--a-border)] p-0.5" role="group" aria-label="Language">
              {(["en", "fr"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  disabled={!preview[l]}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded px-3 py-1 font-dm text-[12.5px] font-semibold disabled:opacity-40 ${lang === l ? "bg-[var(--a-surface-2)] text-[var(--a-ink)]" : "text-[var(--a-ink-3)]"}`}
                >
                  {l === "en" ? "English" : "Français"}
                </button>
              ))}
            </div>
            {shown && (
              <VideoPlayer
                key={shown.url}
                url={shown.url}
                title={lessonTitle}
                chapters={shown.chapters}
                captions={shown.captions}
                voiceLang={lang}
                sources={[
                  { src: shown.url, type: 'video/mp4; codecs="avc1.640029, mp4a.40.2"' },
                  ...(shown.webm ? [{ src: shown.webm, type: 'video/webm; codecs="vp9, opus"' }] : []),
                ]}
              />
            )}
            {shown && (
              <p className="font-dm text-[12px] text-[var(--a-ink-3)]">
                {fmt(shown.durationSec)} · {shown.voice} · made {shown.generatedAt ? new Date(shown.generatedAt).toLocaleString() : ""}
              </p>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
