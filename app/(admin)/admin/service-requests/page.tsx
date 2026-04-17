"use client";

import { useState, useEffect } from "react";
import { Briefcase, Mail, Phone, Building2, Clock, CheckCircle2, XCircle, Loader2, Bot } from "lucide-react";

interface ServiceRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service: string;
  description: string;
  budget?: string | null;
  timeline?: string | null;
  tiboAssisted: boolean;
  aiSummary?: string | null;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-[#FEF0E3] text-[#F47C20]",
  COMPLETED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const STATUSES = ["ALL", "NEW", "IN_PROGRESS", "COMPLETED", "CLOSED"];

export default function ServiceRequestsAdminPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/service-requests?${params}`);
      const data = await res.json();
      setRequests(data.requests ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/service-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : s);
    setUpdating(null);
  }

  const counts = {
    ALL: requests.length,
    NEW: requests.filter(r => r.status === "NEW").length,
    IN_PROGRESS: requests.filter(r => r.status === "IN_PROGRESS").length,
    COMPLETED: requests.filter(r => r.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Service Requests</h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">Incoming project inquiries from the website</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-dm font-semibold px-3 py-1.5 rounded-full">
            {counts.NEW} New
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: requests.length, icon: Briefcase, color: "#2251A3" },
          { label: "New", value: counts.NEW, icon: Clock, color: "#2251A3" },
          { label: "In Progress", value: counts.IN_PROGRESS, icon: Loader2, color: "#F47C20" },
          { label: "Completed", value: counts.COMPLETED, icon: CheckCircle2, color: "#0F6E56" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-dm text-sm text-[#7A8FA6]">{stat.label}</p>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <p className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-dm font-medium transition-colors ${statusFilter === s ? "bg-[#1B3A6B] text-white" : "bg-white border border-[#D2DCE8] text-[#3A4A5C] hover:border-[#1B3A6B]"}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* List */}
        <div className={`bg-white border border-[#D2DCE8] rounded-2xl overflow-hidden flex-1 min-w-0 ${selected ? "hidden lg:block" : ""}`}>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-[#7A8FA6]" /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Briefcase size={32} className="text-[#D2DCE8] mx-auto mb-3" />
              <p className="font-dm text-sm text-[#7A8FA6]">No service requests yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F4F7FB]">
              {requests.map(r => (
                <button key={r.id} onClick={() => setSelected(r)}
                  className={`w-full text-left px-5 py-4 hover:bg-[#F4F7FB]/60 transition-colors ${selected?.id === r.id ? "bg-[#F4F7FB]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{r.firstName} {r.lastName}</p>
                        {r.tiboAssisted && (
                          <span className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-dm">
                            <Bot size={9} /> Tibo
                          </span>
                        )}
                      </div>
                      <p className="font-dm text-xs text-[#2251A3] font-medium truncate">{r.service}</p>
                      <p className="font-dm text-xs text-[#7A8FA6] mt-0.5 line-clamp-1">{r.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-xs font-dm font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {r.status.replace("_", " ")}
                      </span>
                      <span className="text-[11px] font-dm text-[#7A8FA6]">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 w-full lg:w-[420px] flex-shrink-0">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Request Details</h2>
              <button onClick={() => setSelected(null)} className="text-[#7A8FA6] hover:text-[#0D1B2A] text-sm font-dm">
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Contact */}
              <div className="bg-[#F4F7FB] rounded-xl p-4 space-y-2">
                <p className="text-xs font-dm font-semibold text-[#7A8FA6] uppercase tracking-wide mb-2">Contact</p>
                <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{selected.firstName} {selected.lastName}</p>
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-xs font-dm text-[#2251A3] hover:underline">
                  <Mail size={12} /> {selected.email}
                </a>
                {selected.phone && (
                  <p className="flex items-center gap-2 text-xs font-dm text-[#3A4A5C]">
                    <Phone size={12} /> {selected.phone}
                  </p>
                )}
                {selected.company && (
                  <p className="flex items-center gap-2 text-xs font-dm text-[#3A4A5C]">
                    <Building2 size={12} /> {selected.company}
                  </p>
                )}
              </div>

              {/* Service */}
              <div>
                <p className="text-xs font-dm font-semibold text-[#7A8FA6] uppercase tracking-wide mb-1.5">Service</p>
                <p className="font-dm text-sm font-semibold text-[#2251A3]">{selected.service}</p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-dm font-semibold text-[#7A8FA6] uppercase tracking-wide mb-1.5">Project Description</p>
                <p className="font-dm text-sm text-[#3A4A5C] leading-relaxed">{selected.description}</p>
              </div>

              {selected.aiSummary && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                  <p className="flex items-center gap-1.5 text-xs font-dm font-semibold text-purple-700 mb-1.5">
                    <Bot size={11} /> Tibo's Summary
                  </p>
                  <p className="font-dm text-xs text-purple-600 leading-relaxed">{selected.aiSummary}</p>
                </div>
              )}

              {/* Budget / Timeline */}
              {(selected.budget || selected.timeline) && (
                <div className="grid grid-cols-2 gap-3">
                  {selected.budget && (
                    <div>
                      <p className="text-xs font-dm font-semibold text-[#7A8FA6] uppercase tracking-wide mb-1">Budget</p>
                      <p className="font-dm text-sm text-[#0D1B2A]">{selected.budget}</p>
                    </div>
                  )}
                  {selected.timeline && (
                    <div>
                      <p className="text-xs font-dm font-semibold text-[#7A8FA6] uppercase tracking-wide mb-1">Timeline</p>
                      <p className="font-dm text-sm text-[#0D1B2A]">{selected.timeline}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status management */}
              <div>
                <p className="text-xs font-dm font-semibold text-[#7A8FA6] uppercase tracking-wide mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {["NEW", "IN_PROGRESS", "COMPLETED", "CLOSED"].map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      disabled={updating === selected.id || selected.status === s}
                      className={`py-2 px-3 rounded-xl text-xs font-dm font-medium transition-colors ${
                        selected.status === s
                          ? "bg-[#1B3A6B] text-white"
                          : "bg-[#F4F7FB] text-[#3A4A5C] hover:bg-[#EBF0FA]"
                      } disabled:opacity-60`}
                    >
                      {updating === selected.id && selected.status !== s ? (
                        <Loader2 size={11} className="animate-spin mx-auto" />
                      ) : s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] font-dm text-[#7A8FA6] pt-1">
                Submitted {new Date(selected.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
