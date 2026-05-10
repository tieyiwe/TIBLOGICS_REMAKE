"use client";

import { useEffect, useState } from "react";
import { Handshake, Mail, Phone, Globe, MapPin, ChevronDown, ChevronUp } from "lucide-react";

type App = {
  id: string; businessName: string; contactName: string; email: string;
  phone: string; website?: string; address?: string; description: string; createdAt: string;
};

function ApplicationCard({ app }: { app: App }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#FAFBFD] transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center shrink-0">
            <Handshake size={16} className="text-[#2251A3]" />
          </div>
          <div>
            <p className="font-syne font-bold text-sm text-[#0D1B2A]">{app.businessName}</p>
            <p className="font-dm text-xs text-[#7A8FA6]">{app.contactName} · {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-[#7A8FA6]" /> : <ChevronDown size={16} className="text-[#7A8FA6]" />}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-[#F4F7FB] pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={`mailto:${app.email}`} className="flex items-center gap-2 text-sm font-dm text-[#2251A3] hover:underline">
              <Mail size={13} className="text-[#7A8FA6]" /> {app.email}
            </a>
            <a href={`tel:${app.phone}`} className="flex items-center gap-2 text-sm font-dm text-[#3A4A5C]">
              <Phone size={13} className="text-[#7A8FA6]" /> {app.phone}
            </a>
            {app.website && (
              <a href={app.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-dm text-[#2251A3] hover:underline">
                <Globe size={13} className="text-[#7A8FA6]" /> {app.website}
              </a>
            )}
            {app.address && (
              <p className="flex items-center gap-2 text-sm font-dm text-[#3A4A5C]">
                <MapPin size={13} className="text-[#7A8FA6]" /> {app.address}
              </p>
            )}
          </div>
          <div className="bg-[#F4F7FB] rounded-xl p-4">
            <p className="font-dm text-xs text-[#7A8FA6] font-semibold uppercase tracking-wide mb-2">About &amp; Partnership Interest</p>
            <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed whitespace-pre-wrap">{app.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PartnershipsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/partnerships")
      .then(r => r.json())
      .then(d => { setApps(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A]">Partnership Applications</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-1">{apps.length} application{apps.length !== 1 ? "s" : ""} received</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-[#F4F7FB] rounded-2xl" />)}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 text-[#7A8FA6] font-dm">No partnership applications yet.</div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => <ApplicationCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}
