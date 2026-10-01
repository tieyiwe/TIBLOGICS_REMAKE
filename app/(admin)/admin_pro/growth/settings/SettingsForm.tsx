"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Audience, GrowthSettingsData } from "@/lib/growth/settings";
import { LANGUAGE_LABEL, LANGUAGES, PLATFORM_INFO, PLATFORMS, type Language, type Platform } from "@/lib/growth/content/platforms";
import { btn, Card, input, label } from "../_components/ui";

const ZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto",
  "Africa/Abidjan", "Africa/Ouagadougou", "Africa/Dakar", "Africa/Douala", "Africa/Kinshasa", "Africa/Lagos", "Africa/Nairobi",
  "Europe/Paris", "Europe/London", "UTC",
];

const lines = (a: string[]) => a.join("\n");
const unlines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export default function SettingsForm({ initial }: { initial: GrowthSettingsData }) {
  const [s, setS] = useState(initial);
  const [offers, setOffers] = useState(lines(initial.offers));
  const [proof, setProof] = useState(lines(initial.proofPoints));
  const [banned, setBanned] = useState(lines(initial.bannedClaims));
  const [tags, setTags] = useState(initial.brandHashtags.join(" "));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const setAud = (i: number, patch: Partial<Audience>) => setS((x) => ({ ...x, audiences: x.audiences.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));

  async function save() {
    setBusy(true);
    setMsg(null);
    const body = { ...s, offers: unlines(offers), proofPoints: unlines(proof), bannedClaims: unlines(banned), brandHashtags: tags.split(/[\s,]+/).filter(Boolean) };
    const res = await fetch("/api/admin/growth/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: j.error ?? "Save failed" });
    setS(j.settings);
    setOffers(lines(j.settings.offers));
    setProof(lines(j.settings.proofPoints));
    setBanned(lines(j.settings.bannedClaims));
    setTags(j.settings.brandHashtags.join(" "));
    setMsg({ ok: true, text: "Saved. New generations use these settings." });
  }

  return (
    <div className="space-y-4">
      <Card title="Brand voice">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="gs-brand">Brand name</label>
            <input id="gs-brand" className={input} value={s.brandName} onChange={(e) => setS({ ...s, brandName: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="gs-lang">Default language</label>
            <select id="gs-lang" className={input} value={s.defaultLanguage} onChange={(e) => setS({ ...s, defaultLanguage: e.target.value as Language })}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="gs-tags">Brand hashtags</label>
            <input id="gs-tags" className={input} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="TIBLOGICS" />
          </div>
        </div>
        <div className="mt-3">
          <label className={label} htmlFor="gs-voice">Voice and style</label>
          <textarea id="gs-voice" rows={4} className={input} value={s.voice} onChange={(e) => setS({ ...s, voice: e.target.value })} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Offers" subtitle="What you sell, one per line (context for the AI).">
          <textarea aria-label="Offers" rows={7} className={input} value={offers} onChange={(e) => setOffers(e.target.value)} />
        </Card>
        <Card title="Proof points" subtitle="Approved facts and results, one per line. The only brand numbers the AI may use.">
          <textarea aria-label="Proof points" rows={7} className={input} value={proof} onChange={(e) => setProof(e.target.value)} placeholder="e.g. Built 12 AI agents for clients in 2025" />
        </Card>
        <Card title="Banned claims" subtitle="Phrases never to use, one per line. Flagged in every kit.">
          <textarea aria-label="Banned claims" rows={7} className={input} value={banned} onChange={(e) => setBanned(e.target.value)} />
        </Card>
      </div>

      <Card
        title="Audiences (ICPs)"
        subtitle="Each audience sets the language, the time zone for best-time suggestions and the channels used for auto-drafted posts."
        action={
          <button
            className={btn.ghost}
            onClick={() => setS({ ...s, audiences: [...s.audiences, { id: `audience-${s.audiences.length + 1}`, name: "New audience", region: "", timezone: "UTC", language: "en", pains: "", goals: "", channels: ["linkedin"] }] })}
          >
            <Plus size={15} /> Add audience
          </button>
        }
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {s.audiences.map((a, i) => (
            <div key={i} className="rounded-xl border border-[#D2DCE8] p-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={label} htmlFor={`a-name-${i}`}>Name</label>
                  <input id={`a-name-${i}`} className={input} value={a.name} onChange={(e) => setAud(i, { name: e.target.value })} />
                </div>
                <button className={`${btn.danger} self-end`} aria-label={`Remove ${a.name}`} onClick={() => setS({ ...s, audiences: s.audiences.filter((_, j) => j !== i) })}><Trash2 size={15} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <label className={label} htmlFor={`a-lang-${i}`}>Language</label>
                  <select id={`a-lang-${i}`} className={input} value={a.language} onChange={(e) => setAud(i, { language: e.target.value as Language })}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_LABEL[l]}</option>)}
                  </select>
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className={label} htmlFor={`a-tz-${i}`}>Time zone</label>
                  <input id={`a-tz-${i}`} list="gs-zones" className={input} value={a.timezone} onChange={(e) => setAud(i, { timezone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={label} htmlFor={`a-region-${i}`}>Region</label>
                <input id={`a-region-${i}`} className={input} value={a.region} onChange={(e) => setAud(i, { region: e.target.value })} />
              </div>
              <div>
                <label className={label} htmlFor={`a-pains-${i}`}>Pains</label>
                <textarea id={`a-pains-${i}`} rows={2} className={input} value={a.pains} onChange={(e) => setAud(i, { pains: e.target.value })} />
              </div>
              <div>
                <label className={label} htmlFor={`a-goals-${i}`}>Goals</label>
                <textarea id={`a-goals-${i}`} rows={2} className={input} value={a.goals} onChange={(e) => setAud(i, { goals: e.target.value })} />
              </div>
              <fieldset>
                <legend className={label}>Channels</legend>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <label key={p} className="inline-flex items-center gap-1 font-dm text-xs text-[#3A4A5C]">
                      <input
                        type="checkbox"
                        checked={a.channels.includes(p)}
                        onChange={(e) => setAud(i, { channels: e.target.checked ? [...a.channels, p] : a.channels.filter((c: Platform) => c !== p) })}
                      />
                      {PLATFORM_INFO[p].label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ))}
        </div>
        <datalist id="gs-zones">{ZONES.map((z) => <option key={z} value={z} />)}</datalist>
      </Card>

      <div className="sticky bottom-0 -mx-1 flex items-center gap-3 bg-[#F4F7FB]/95 px-1 py-3 backdrop-blur">
        <button className={btn.primary} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save settings"}</button>
        {msg && <p role="status" className={`font-dm text-sm ${msg.ok ? "text-[#0F6E56]" : "text-[#B42318]"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
