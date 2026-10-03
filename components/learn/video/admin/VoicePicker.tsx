"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mic, Pause, Play } from "lucide-react";
import { Badge, Button, Notice, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

// The narration voice on /admin_pro/learn/videos: Google's male voices for
// English and French, most natural first, each with a short sample in the
// same lecturer's register (with the same polish as the videos), and the
// speaking speed. The choice applies to every new video; videos already made
// keep their voice until re-made (the panel above offers that).

interface Voice {
  name: string;
  languageCode: string;
  family: string;
  pricePerMChar: number;
}
interface VoiceData {
  provider: "google" | "openai" | null;
  current: { en: string | null; fr: string | null };
  rate: number;
  defaults: { en: string; fr: string; rate: number };
  voices: { en: Voice[]; fr: Voice[] };
  error: string | null;
}

const FAMILY_LABEL: Record<string, string> = {
  "Chirp3-HD": "Most natural",
  Studio: "Studio, deep",
  "Chirp-HD": "Natural",
  Neural2: "Clear",
  Wavenet: "Clear",
  Polyglot: "Clear",
};
const LANG_LABEL: Record<string, string> = { "en-US": "American", "en-GB": "British", "fr-FR": "France", "fr-CA": "Canada" };

const short = (name: string) => name.split("-").slice(-1)[0];

export default function VoicePicker({ onSaved }: { onSaved?: () => void }) {
  const toast = useToast();
  const [d, setD] = useState<VoiceData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pick, setPick] = useState<{ en: string; fr: string }>({ en: "", fr: "" });
  const [rate, setRate] = useState(0.95);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const urls = useRef(new Map<string, string>());

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/admin/learn/video/voice", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Could not load the voices");
        setD(j);
        setPick({ en: j.current.en ?? j.defaults.en, fr: j.current.fr ?? j.defaults.fr });
        setRate(j.rate);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Could not load the voices");
      }
    })();
    const map = urls.current;
    return () => {
      audio.current?.pause();
      for (const u of map.values()) URL.revokeObjectURL(u);
    };
  }, []);

  async function play(voice: string) {
    if (playing === voice) {
      audio.current?.pause();
      setPlaying(null);
      return;
    }
    audio.current?.pause();
    const key = `${voice}|${rate}`;
    let url = urls.current.get(key);
    if (!url) {
      setLoading(voice);
      try {
        const r = await fetch("/api/admin/learn/video/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sample", voice, rate }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Could not play this voice");
        url = URL.createObjectURL(await r.blob());
        urls.current.set(key, url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not play this voice");
        return;
      } finally {
        setLoading(null);
      }
    }
    const a = new Audio(url);
    audio.current = a;
    a.onended = () => setPlaying(null);
    setPlaying(voice);
    await a.play().catch(() => setPlaying(null));
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/learn/video/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", en: pick.en, fr: pick.fr, rate }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Could not save");
      setD((x) => (x ? { ...x, current: { en: pick.en, fr: pick.fr }, rate } : x));
      toast.success("Voice saved. New videos use it.");
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (err) return <Notice tone="danger" title="Narration voice">{err}</Notice>;
  if (!d) return <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Loading voices…</p>;
  if (d.provider !== "google") {
    return (
      <Notice tone="info" title="Narration voice">
        Choosing a voice here needs Google Cloud Text-to-Speech (<code>GOOGLE_TTS_API_KEY</code>).
      </Notice>
    );
  }

  const changed = pick.en !== d.current.en || pick.fr !== d.current.fr || rate !== d.rate;

  const column = (lang: "en" | "fr") => {
    const list = d.voices[lang];
    // The chosen voice stays listed even if Google's list did not include it.
    const all = list.some((v) => v.name === pick[lang]) || !pick[lang] ? list : [{ name: pick[lang], languageCode: pick[lang].slice(0, 5), family: "", pricePerMChar: 0 }, ...list];
    return (
      <div className="min-w-0">
        <p className="a-micro mb-2">{lang === "en" ? "English videos" : "French videos"}</p>
        {all.length === 0 ? (
          <p className="font-dm text-[13px] text-[var(--a-ink-3)]">No male voices returned by Google.</p>
        ) : (
          <ul className="max-h-[320px] space-y-1 overflow-y-auto pr-1" data-testid={`voice-list-${lang}`}>
            {all.map((v) => {
              const selected = pick[lang] === v.name;
              return (
                <li
                  key={v.name}
                  className={cn(
                    "flex items-center gap-2 rounded-[10px] border px-2 py-1.5",
                    selected ? "border-[var(--a-blue)] bg-[var(--a-info-bg)]" : "border-[var(--a-border)] bg-[var(--a-surface)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void play(v.name)}
                    aria-label={`${playing === v.name ? "Stop" : "Play"} ${v.name}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--a-navy)] text-white hover:opacity-90"
                    data-testid="voice-play"
                  >
                    {loading === v.name ? <Loader2 size={14} className="animate-spin" aria-hidden /> : playing === v.name ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}
                  </button>
                  <div className="min-w-0 flex-1 font-dm">
                    <p className="truncate text-[13px] font-semibold text-[var(--a-ink)]">
                      {short(v.name)} <span className="font-normal text-[var(--a-ink-3)]">· {LANG_LABEL[v.languageCode] ?? v.languageCode}</span>
                    </p>
                    <p className="text-[11.5px] text-[var(--a-ink-3)]">
                      {FAMILY_LABEL[v.family] ?? v.family}
                      {v.pricePerMChar ? ` · $${v.pricePerMChar}/M characters` : ""}
                    </p>
                  </div>
                  {v.family === "Chirp3-HD" && <Badge tone="success">Best</Badge>}
                  <Button size="sm" variant={selected ? "secondary" : "ghost"} icon={selected ? Check : undefined} onClick={() => setPick((x) => ({ ...x, [lang]: v.name }))} data-testid="voice-use">
                    {selected ? "Chosen" : "Use"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 rounded-[14px] border border-[var(--a-border)] bg-[var(--a-surface-2)] p-4" data-testid="voice-picker">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="font-dm">
          <p className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--a-ink)]">
            <Mic size={15} aria-hidden /> Narration voice
          </p>
          <p className="text-[12.5px] text-[var(--a-ink-3)]">
            Male voices, most natural first. Press play to hear each one read the same short passage, as it will sound in the videos.
          </p>
        </div>
        <Button size="sm" variant="primary" loading={saving} disabled={!changed} onClick={save} data-testid="voice-save">
          Save voice
        </Button>
      </div>
      {d.error && <Notice tone="warn" title="Voice list">{d.error}</Notice>}
      <div className="grid gap-4 md:grid-cols-2">
        {column("en")}
        {column("fr")}
      </div>
      <label className="flex flex-wrap items-center gap-3 font-dm text-[13px] text-[var(--a-ink-2)]">
        Speaking speed
        <input
          type="range"
          min={0.85}
          max={1.1}
          step={0.05}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="w-40 accent-[var(--a-navy)]"
          data-testid="voice-rate"
        />
        <span className="tabular-nums font-semibold text-[var(--a-ink)]">{rate.toFixed(2)}×</span>
        <span className="text-[12px] text-[var(--a-ink-3)]">0.90 to 0.95 suits a calm lecture pace</span>
      </label>
    </div>
  );
}
