"use client";

import { useState } from "react";
import { Handshake, Mail, Phone, Globe, MapPin, ChevronDown, ChevronUp } from "lucide-react";

export type App = {
  id: string; businessName: string; contactName: string; email: string;
  phone: string; website?: string; address?: string; description: string; createdAt: string;
};

function ApplicationCard({ app }: { app: App }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[var(--a-surface)] border border-[var(--a-border)] rounded-[var(--a-radius-card)] shadow-[var(--a-shadow-card)] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#FAFBFD] transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--a-info-bg)] rounded-[var(--a-radius-control)] flex items-center justify-center shrink-0">
            <Handshake size={16} className="text-[var(--a-blue)]" />
          </div>
          <div>
            <p className="font-syne font-bold text-sm text-[var(--a-ink)]">{app.businessName}</p>
            <p className="font-dm text-xs text-[var(--a-ink-3)]">{app.contactName} · {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-[var(--a-ink-3)]" /> : <ChevronDown size={16} className="text-[var(--a-ink-3)]" />}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-[var(--a-border)] pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={`mailto:${app.email}`} className="flex items-center gap-2 text-sm font-dm text-[var(--a-blue)] hover:underline">
              <Mail size={13} className="text-[var(--a-ink-3)]" /> {app.email}
            </a>
            <a href={`tel:${app.phone}`} className="flex items-center gap-2 text-sm font-dm text-[var(--a-ink-2)]">
              <Phone size={13} className="text-[var(--a-ink-3)]" /> {app.phone}
            </a>
            {app.website && (
              <a href={app.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-dm text-[var(--a-blue)] hover:underline">
                <Globe size={13} className="text-[var(--a-ink-3)]" /> {app.website}
              </a>
            )}
            {app.address && (
              <p className="flex items-center gap-2 text-sm font-dm text-[var(--a-ink-2)]">
                <MapPin size={13} className="text-[var(--a-ink-3)]" /> {app.address}
              </p>
            )}
          </div>
          <div className="bg-[var(--a-surface-2)] rounded-[var(--a-radius-control)] p-4">
            <p className="font-dm text-xs text-[var(--a-ink-3)] font-semibold uppercase tracking-wide mb-2">About &amp; Partnership Interest</p>
            <p className="font-dm text-sm text-[var(--a-ink-2)] leading-relaxed whitespace-pre-wrap">{app.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PartnershipsClient({ apps }: { apps: App[] }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-syne font-bold text-[24px] leading-tight sm:text-[26px] text-[var(--a-ink)]">Partnership Applications</h1>
        <p className="font-dm text-sm text-[var(--a-ink-3)] mt-1">{apps.length} application{apps.length !== 1 ? "s" : ""} received</p>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 text-[var(--a-ink-3)] font-dm">No partnership applications yet.</div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => <ApplicationCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}
