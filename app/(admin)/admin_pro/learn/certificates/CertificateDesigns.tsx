"use client";

import { useState } from "react";
import { Card, Badge, Segmented } from "@/components/admin/ui";

interface TrackRow {
  id: string;
  title: string;
  certificateName: string;
  status: string;
  level: string;
  levelEnd: string | null;
  tagline: string | null;
  accentColor: string;
}

export default function CertificateDesigns({ tracks, signatory }: { tracks: TrackRow[]; signatory: { name: string; title: string } | null }) {
  const [lang, setLang] = useState("en");
  const [distinction, setDistinction] = useState(false);
  const [name, setName] = useState("Jane Amani Doe");
  const [shown, setShown] = useState<"live" | "all">("live");
  const list = tracks.filter((t) => shown === "all" || t.status === "live");
  const src = (id: string) => `/api/admin/learn/certificate-design?trackId=${encodeURIComponent(id)}&lang=${lang}&distinction=${distinction ? 1 : 0}&name=${encodeURIComponent(name)}`;
  return (
    <div className="space-y-5">
      <Card title="Preview settings">
        <div className="flex flex-wrap items-end gap-4 font-dm text-[13px]">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--a-ink-3)]">Sample name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={70} className="h-9 w-64 rounded-[10px] border border-[var(--a-border-strong)] px-3" data-testid="design-name" />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[var(--a-ink-3)]">Language</span>
            <Segmented value={lang} onChange={setLang} options={[{ value: "en", label: "English" }, { value: "fr", label: "Français" }, { value: "sw", label: "Kiswahili" }]} />
          </div>
          <label className="flex items-center gap-2 pb-2">
            <input type="checkbox" checked={distinction} onChange={(e) => setDistinction(e.target.checked)} /> With distinction
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[var(--a-ink-3)]">Tracks</span>
            <Segmented value={shown} onChange={(v) => setShown(v as "live" | "all")} options={[{ value: "live", label: "Live" }, { value: "all", label: "All" }]} />
          </div>
        </div>
        <p className="mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">
          {signatory ? (
            <>Signed by <b>{signatory.name}</b>, {signatory.title} (the Secret <code>CERT_SIGNATORY_NAME</code>). Remove that Secret to show the organisation only.</>
          ) : (
            <>Issued by <b>TIBLOGICS · ARFA AI Academy</b>, with no personal signature. A signatory can be added with the Secrets <code>CERT_SIGNATORY_NAME</code> and <code>CERT_SIGNATORY_TITLE</code>.</>
          )}{" "}
          The reference shown is a sample;
          each issued certificate gets its own (ARFA-track-year-8 characters).
        </p>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        {list.map((t) => (
          <Card key={t.id} title={t.certificateName || t.title} action={<Badge tone={t.status === "live" ? "success" : "neutral"}>{t.status}</Badge>}>
            <a href={src(t.id)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[10px] border border-[var(--a-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src(t.id)} alt={`Certificate for ${t.title}`} loading="lazy" className="block h-auto w-full" data-testid="design-image" />
            </a>
            <p className="mt-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">
              Track: {t.title} · level {t.levelEnd || t.level}
              {t.tagline ? ` · line under the title: “${t.tagline}”` : " · no tagline set"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
