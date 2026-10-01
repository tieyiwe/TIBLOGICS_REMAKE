"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X, Loader2, Sparkles, MessageSquareReply, ThumbsUp, ThumbsDown, Flame, Briefcase, BadgeCheck, MailX, Ban,
  Copy, ExternalLink, MessageCircle, Linkedin, CheckCircle2, AlertTriangle, Trash2, Clock, MousePointerClick, CalendarCheck,
} from "lucide-react";
import { OFFER_BY_KEY } from "@/lib/growth/outreach/offers";
import { CONSENT_BASES, STAGES } from "@/lib/growth/outreach/shared";
import { api, ScorePill, type Lead } from "./ui";

interface Msg {
  id: string; enrollmentId: string; stepIndex: number; dayOffset: number; toEmail: string | null; subject: string; bodyText: string;
  personalised: boolean; status: string; scheduledFor: string | null; sentAt: string | null; error: string | null;
}
interface Detail {
  lead: Lead & { scoreReasons: unknown; signals: unknown; socials: unknown; publicEmails: unknown; offerReason: string | null; consentNote: string | null; notes: string | null; enrichedAt: string | null };
  blocker: string | null;
  events: Array<{ id: string; type: string; detail: string | null; createdAt: string }>;
  enrollments: Array<{ id: string; sequenceName: string; status: string; stopReason: string | null; linkCode: string | null; createdAt: string }>;
  messages: Msg[];
  clicks: Array<{ linkCode: string; day: string; n: number }>;
  manual: { whatsappText: string; whatsappUrl: string | null; linkedinNote: string; linkedinUrl: string | null; bookingUrl: string };
}

const TABS = ["Overview", "Emails", "WhatsApp & LinkedIn", "Timeline"] as const;
const MSG_STATUS: Record<string, string> = {
  draft: "bg-[#FEF0E3] text-[#B8500A]", approved: "bg-[#EBF0FA] text-[#2251A3]", sending: "bg-[#EBF0FA] text-[#2251A3]",
  sent: "bg-[#E8F7EE] text-[#0F6E56]", failed: "bg-red-50 text-red-600", cancelled: "bg-[#F4F4F5] text-[#6B7280]",
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "");

export default function LeadDrawer({ id, canSend, onClose, onChanged, flash }: {
  id: string; canSend: boolean; onClose: () => void; onChanged: () => Promise<void>; flash: (k: "ok" | "err", t: string) => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [wa, setWa] = useState("");
  const [li, setLi] = useState("");

  const load = useCallback(async () => {
    const r = await api<Detail>(`/api/admin/growth/leads/${id}`);
    setD(r);
    setForm({
      companyName: r.lead.companyName, contactName: r.lead.contactName ?? "", role: r.lead.role ?? "", email: r.lead.email ?? "",
      phone: r.lead.phone ?? "", website: r.lead.website ?? "", industry: r.lead.industry ?? "", area: r.lead.area ?? "",
      linkedinUrl: r.lead.linkedinUrl ?? "", notes: r.lead.notes ?? "", consentNote: r.lead.consentNote ?? "",
    });
    setWa(r.manual.whatsappText);
    setLi(r.manual.linkedinNote);
  }, [id]);

  useEffect(() => { load().catch((e) => flash("err", e.message)); }, [load, flash]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function act(action: string, label: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(action);
    try {
      const r = await api<Detail>(`/api/admin/growth/leads/${id}/action`, { method: "POST", body: JSON.stringify({ action }) });
      setD(r);
      flash("ok", label);
      await onChanged();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function patch(body: Record<string, unknown>, label = "Saved") {
    setBusy("save");
    try {
      const r = await api<Detail>(`/api/admin/growth/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      setD(r);
      flash("ok", label);
      await onChanged();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function msgAction(m: Msg, kind: "approve" | "cancel" | "save", subject?: string, body?: string) {
    setBusy(m.id);
    try {
      if (kind === "approve") await api("/api/admin/growth/outreach/approve", { method: "POST", body: JSON.stringify({ messageIds: [m.id] }) });
      if (kind === "cancel") await api(`/api/admin/growth/outreach/messages/${m.id}`, { method: "DELETE" });
      if (kind === "save") await api(`/api/admin/growth/outreach/messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ subject, bodyText: body }) });
      await load();
      flash("ok", kind === "approve" ? "Approved" : kind === "cancel" ? "Cancelled" : "Saved: needs approval again");
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function aiManual(channel: "whatsapp" | "linkedin") {
    setBusy(channel);
    try {
      const r = await api<{ text: string }>(`/api/admin/growth/leads/${id}/manual-message`, { method: "POST", body: JSON.stringify({ channel }) });
      if (channel === "whatsapp") setWa(r.text); else setLi(r.text);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "AI unavailable");
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    if (!confirm("Delete this lead and its outreach history?")) return;
    await api(`/api/admin/growth/leads/${id}`, { method: "DELETE" });
    await onChanged();
    onClose();
  }

  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => flash("ok", "Copied"), () => flash("err", "Copy failed"));

  const lead = d?.lead;
  const signals = (lead?.signals ?? {}) as Record<string, unknown>;
  const reasons = Array.isArray(lead?.scoreReasons) ? (lead!.scoreReasons as string[]) : [];
  const socials = (lead?.socials ?? {}) as Record<string, string>;
  const publicEmails = Array.isArray(lead?.publicEmails) ? (lead!.publicEmails as string[]) : [];
  const offer = lead?.bestOffer ? OFFER_BY_KEY.get(lead.bestOffer) : null;
  const gaps: string[] = [];
  if (lead?.enrichedAt) {
    if (!signals.hasWebsite) gaps.push("No website");
    else if (!signals.reachable) gaps.push("Website unreachable");
    else {
      if (!signals.https) gaps.push("No SSL");
      if (signals.slow) gaps.push(`Slow (${(((signals.loadMs as number) ?? 0) / 1000).toFixed(1)}s)`);
      if (!signals.hasBooking) gaps.push("No online booking");
      if (!signals.hasChat) gaps.push("No chat");
      if (signals.outdated) gaps.push("Outdated site");
      if (!signals.hasReviewsLink) gaps.push("No Google reviews link");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-label="Lead details">
      <div className="hidden sm:block flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full sm:max-w-2xl bg-white h-full shadow-2xl flex flex-col" data-testid="lead-drawer">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5EAF2] bg-[#F4F7FB]">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-syne font-bold text-lg text-[#0D1B2A] truncate">{lead?.companyName ?? "Loading..."}</h2>
              <p className="font-dm text-sm text-[#7A8FA6] truncate">{lead ? [lead.contactName, lead.role, lead.industry, lead.area].filter(Boolean).join(" · ") || lead.domain : ""}</p>
            </div>
            {lead && <ScorePill lead={lead} />}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#E5EAF2]" aria-label="Close"><X size={18} /></button>
          </div>
          {lead && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={lead.stage}
                onChange={(e) => patch({ stage: e.target.value }, "Stage updated")}
                className="rounded-lg border border-[#D2DCE8] bg-white px-2 py-1 font-dm text-sm"
                aria-label="Stage"
              >
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <Act onClick={() => act("enrich_now", "Enriched")} busy={busy === "enrich_now"} icon={<Sparkles size={14} />} label="Enrich now" testid="enrich-now" />
              <Act onClick={() => act("replied", "Marked replied: sequences stopped")} busy={busy === "replied"} icon={<MessageSquareReply size={14} />} label="Replied" testid="mark-replied" />
              <Act onClick={() => act("interested", "Marked interested")} busy={busy === "interested"} icon={<ThumbsUp size={14} />} label="Interested" />
              <Act onClick={() => act("not_interested", "Marked not interested")} busy={busy === "not_interested"} icon={<ThumbsDown size={14} />} label="Not interested" />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-2 border-b border-[#E5EAF2] overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 font-dm text-sm font-semibold whitespace-nowrap border-b-2 ${tab === t ? "border-[#F47C20] text-[#0D1B2A]" : "border-transparent text-[#7A8FA6]"}`}>
              {t}{t === "Emails" && d?.messages.length ? ` (${d.messages.length})` : ""}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 font-dm text-sm">
          {!d || !lead ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#2251A3]" /></div>
          ) : tab === "Overview" ? (
            <>
              {d.blocker && (
                <div className="flex gap-2 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] p-3 text-[#9A3412]" data-testid="blocker">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Cannot be emailed: <b>{d.blocker}</b>.{d.blocker === "No public email found" ? " Use WhatsApp or LinkedIn (manual) instead." : ""}</span>
                </div>
              )}

              {/* Enrichment */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A8FA6]">Fit and signals</h3>
                {lead.enrichedAt ? (
                  <div className="rounded-xl border border-[#E5EAF2] p-3 space-y-3">
                    {offer && (
                      <p>
                        <span className="text-[#7A8FA6]">Best offer: </span>
                        <a href={offer.path} target="_blank" className="font-semibold text-[#2251A3] hover:underline">{offer.name}</a>
                        {lead.offerReason && <span className="block text-xs text-[#3A4A5C] mt-0.5">{lead.offerReason}</span>}
                      </p>
                    )}
                    {lead.opener && (
                      <div className="rounded-lg bg-[#F4F7FB] p-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-[#7A8FA6]">Opener</p>
                        <p className="text-[#0D1B2A]">{lead.opener}</p>
                      </div>
                    )}
                    {reasons.length > 0 && <ul className="list-disc pl-5 text-[#3A4A5C] space-y-0.5">{reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
                    <div className="flex flex-wrap gap-1.5">
                      {gaps.map((g) => <span key={g} className="rounded-full bg-[#FEF0E3] text-[#B8500A] px-2 py-0.5 text-xs font-semibold">{g}</span>)}
                      {gaps.length === 0 && <span className="text-xs text-[#0F6E56]">No obvious digital gaps</span>}
                    </div>
                    <div className="text-xs text-[#3A4A5C] space-y-1">
                      <p><b>Public emails:</b> {publicEmails.length ? publicEmails.join(", ") : <span className="text-[#9CA3AF]">No public email found</span>}</p>
                      {Object.keys(socials).length > 0 && (
                        <p className="flex flex-wrap gap-2"><b>Social:</b>{Object.entries(socials).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="text-[#2251A3] hover:underline">{k}</a>)}</p>
                      )}
                      <p className="text-[#9CA3AF]">Enriched {fmt(lead.enrichedAt)}{lead.enrichError ? ` · site: ${lead.enrichError}` : ""}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#7A8FA6]">Not enriched yet. <button onClick={() => act("enrich_now", "Enriched")} className="text-[#2251A3] underline">Enrich now</button> to fetch the site, find published contacts and score the fit.</p>
                )}
              </section>

              {/* Consent */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A8FA6]">Consent basis (CASL record)</h3>
                <select
                  value={lead.consentBasis}
                  onChange={(e) => patch({ consentBasis: e.target.value }, "Consent basis saved")}
                  className="w-full rounded-lg border border-[#D2DCE8] px-2 py-2"
                  data-testid="consent-select"
                >
                  {CONSENT_BASES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <input value={form.consentNote ?? ""} onChange={(e) => setForm({ ...form, consentNote: e.target.value })} placeholder="Evidence, e.g. where the address is published" className="flex-1 rounded-lg border border-[#D2DCE8] px-3 py-2" />
                  <button onClick={() => patch({ consentNote: form.consentNote }, "Note saved")} className="px-3 rounded-lg border border-[#D2DCE8]">Save</button>
                </div>
              </section>

              {/* Contact */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A8FA6]">Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([["companyName", "Company"], ["contactName", "Contact"], ["role", "Role"], ["email", "Email"], ["phone", "Phone"], ["website", "Website"], ["industry", "Industry"], ["area", "Area"], ["linkedinUrl", "LinkedIn"]] as const).map(([k, label]) => (
                    <label key={k} className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-[#7A8FA6]">{label}</span>
                      <input value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="rounded-lg border border-[#D2DCE8] px-2.5 py-1.5" />
                    </label>
                  ))}
                  <label className="flex flex-col gap-0.5 sm:col-span-2">
                    <span className="text-[11px] text-[#7A8FA6]">Notes</span>
                    <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="rounded-lg border border-[#D2DCE8] px-2.5 py-1.5" />
                  </label>
                </div>
                <div className="flex justify-between items-center">
                  <a href={d.manual.bookingUrl} target="_blank" className="inline-flex items-center gap-1 text-xs text-[#2251A3] hover:underline"><CalendarCheck size={13} /> Book-a-call link (UTM)</a>
                  <button
                    onClick={() => patch(Object.fromEntries(["companyName", "contactName", "role", "email", "phone", "website", "industry", "area", "linkedinUrl", "notes"].map((k) => [k, form[k] ?? ""])))}
                    disabled={busy === "save"}
                    className="px-4 py-1.5 rounded-lg bg-[#1B3A6B] text-white font-semibold disabled:opacity-50"
                  >
                    Save contact
                  </button>
                </div>
              </section>

              {/* Handover */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A8FA6]">Handover</h3>
                {lead.handedOverAt && <p className="text-xs text-[#0F6E56] flex items-center gap-1"><CheckCircle2 size={13} /> Handed over {fmt(lead.handedOverAt)}{lead.handoverRef ? ` (${String(lead.handoverRef).split(":")[0]})` : ""}</p>}
                <div className="flex flex-wrap gap-2">
                  <Act onClick={() => act("handover_rex", "Sent to Rex as HOT")} busy={busy === "handover_rex"} icon={<Flame size={14} />} label="HOT: send to Rex" tone="orange" testid="handover-rex" />
                  <Act onClick={() => act("handover_prospect", "Added to Prospects")} busy={busy === "handover_prospect"} icon={<Briefcase size={14} />} label="Add to Prospects" />
                  <Act onClick={() => act("convert", "Converted to customer", "Mark this lead as a customer? Linked Aria/Prospect records are updated too.")} busy={busy === "convert"} icon={<BadgeCheck size={14} />} label="Convert to customer" tone="green" />
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#7A8FA6]">Stop contact</h3>
                <div className="flex flex-wrap gap-2">
                  <Act onClick={() => act("bounced", "Marked bounced and suppressed")} busy={busy === "bounced"} icon={<MailX size={14} />} label="Email bounced" />
                  <Act onClick={() => act("unsubscribe", "Unsubscribed and suppressed", "Record that this person asked not to be emailed? This cannot be undone by you.")} busy={busy === "unsubscribe"} icon={<Ban size={14} />} label="Asked to stop" />
                  <button onClick={del} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50"><Trash2 size={14} /> Delete lead</button>
                </div>
              </section>
            </>
          ) : tab === "Emails" ? (
            <>
              {d.enrollments.length === 0 && <p className="text-[#7A8FA6]">Not in any sequence. Select the lead on the board and choose <b>Add to sequence</b>.</p>}
              {d.enrollments.map((e) => (
                <section key={e.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#0D1B2A]">{e.sequenceName}</h3>
                    <span className="text-xs text-[#7A8FA6]">{e.status.replace("_", " ")}{e.stopReason ? `: ${e.stopReason}` : ""}</span>
                  </div>
                  {d.messages.filter((m) => m.enrollmentId === e.id).sort((a, b) => a.stepIndex - b.stepIndex).map((m) => (
                    <MessageCard key={m.id} m={m} canSend={canSend} busy={busy === m.id} onAction={msgAction} />
                  ))}
                </section>
              ))}
            </>
          ) : tab === "WhatsApp & LinkedIn" ? (
            <>
              <p className="rounded-xl bg-[#F4F7FB] p-3 text-xs text-[#3A4A5C]">These are for <b>manual</b> sending only. Automated cold WhatsApp or SMS breaks Meta&apos;s WhatsApp Business policy and SMS consent rules, so this tool never sends them for you.</p>
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold text-[#0D1B2A]"><MessageCircle size={16} className="text-[#25D366]" /> WhatsApp click-to-chat</h3>
                <textarea value={wa} onChange={(e) => setWa(e.target.value)} rows={5} className="w-full rounded-lg border border-[#D2DCE8] p-2.5" data-testid="wa-text" />
                <div className="flex flex-wrap gap-2">
                  {d.manual.whatsappUrl ? (
                    <a
                      href={`${d.manual.whatsappUrl.split("?")[0]}?text=${encodeURIComponent(wa)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] text-white px-3 py-1.5 font-semibold"
                      data-testid="wa-link"
                    >
                      <ExternalLink size={14} /> Message on WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-[#9CA3AF]">No phone number on file.</span>
                  )}
                  <button onClick={() => copy(wa)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D2DCE8] px-3 py-1.5"><Copy size={14} /> Copy</button>
                  <button onClick={() => aiManual("whatsapp")} disabled={busy === "whatsapp"} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D2DCE8] px-3 py-1.5 disabled:opacity-50">
                    {busy === "whatsapp" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Rewrite with AI
                  </button>
                </div>
              </section>
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold text-[#0D1B2A]"><Linkedin size={16} className="text-[#0A66C2]" /> LinkedIn connection note</h3>
                <textarea value={li} onChange={(e) => setLi(e.target.value.slice(0, 300))} rows={4} className="w-full rounded-lg border border-[#D2DCE8] p-2.5" data-testid="li-text" />
                <p className={`text-xs ${li.length > 280 ? "text-[#B8500A]" : "text-[#7A8FA6]"}`}>{li.length}/300 characters</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => copy(li)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D2DCE8] px-3 py-1.5"><Copy size={14} /> Copy note</button>
                  <a
                    href={d.manual.linkedinUrl ?? `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${lead.contactName ?? ""} ${lead.companyName}`.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] text-white px-3 py-1.5 font-semibold"
                  >
                    <ExternalLink size={14} /> {d.manual.linkedinUrl ? "Open profile" : "Search LinkedIn"}
                  </a>
                  <button onClick={() => aiManual("linkedin")} disabled={busy === "linkedin"} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D2DCE8] px-3 py-1.5 disabled:opacity-50">
                    {busy === "linkedin" ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Rewrite with AI
                  </button>
                </div>
              </section>
            </>
          ) : (
            <>
              {d.clicks.length > 0 && (
                <div className="rounded-xl bg-[#EBF0FA] p-3 text-[#1B3A6B] text-xs">
                  <p className="font-semibold flex items-center gap-1"><MousePointerClick size={13} /> Booking link clicks (tracked short link, no pixels)</p>
                  {d.clicks.map((c) => <p key={`${c.linkCode}${c.day}`}>{c.day}: {c.n} click(s)</p>)}
                </div>
              )}
              <ol className="relative border-l border-[#E5EAF2] ml-2 space-y-4" data-testid="timeline">
                {d.events.map((e) => (
                  <li key={e.id} className="ml-4">
                    <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-[#2251A3]" />
                    <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1"><Clock size={11} /> {fmt(e.createdAt)} · {e.type.replace(/_/g, " ")}</p>
                    <p className="text-[#0D1B2A]">{e.detail}</p>
                  </li>
                ))}
                {d.events.length === 0 && <li className="ml-4 text-[#7A8FA6]">Nothing yet.</li>}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Act({ onClick, busy, icon, label, tone, testid }: { onClick: () => void; busy?: boolean; icon: React.ReactNode; label: string; tone?: "orange" | "green"; testid?: string }) {
  const cls = tone === "orange" ? "bg-[#F47C20] text-white border-[#F47C20]" : tone === "green" ? "bg-[#0F6E56] text-white border-[#0F6E56]" : "bg-white text-[#1B3A6B] border-[#D2DCE8] hover:bg-[#F4F7FB]";
  return (
    <button onClick={onClick} disabled={busy} data-testid={testid} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-dm text-sm font-semibold disabled:opacity-60 ${cls}`}>
      {busy ? <Loader2 size={14} className="animate-spin" /> : icon} {label}
    </button>
  );
}

function MessageCard({ m, canSend, busy, onAction }: { m: Msg; canSend: boolean; busy: boolean; onAction: (m: Msg, k: "approve" | "cancel" | "save", s?: string, b?: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [subject, setSubject] = useState(m.subject);
  const [body, setBody] = useState(m.bodyText);
  const editable = m.status === "draft" || m.status === "approved";
  return (
    <div className="rounded-xl border border-[#E5EAF2] p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-[#0D1B2A]">Step {m.stepIndex + 1} · day {m.dayOffset}</span>
        <span className={`rounded-full px-2 py-0.5 font-semibold ${MSG_STATUS[m.status] ?? ""}`}>{m.status}</span>
        {m.personalised && <span className="rounded-full bg-[#F3E8FF] text-[#7c3aed] px-2 py-0.5 font-semibold">AI personalised</span>}
        <span className="ml-auto text-[#9CA3AF]">{m.sentAt ? `sent ${fmt(m.sentAt)}` : m.scheduledFor ? `due ${fmt(m.scheduledFor)}` : ""}</span>
      </div>
      {edit ? (
        <>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-[#D2DCE8] px-2.5 py-1.5 font-semibold" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full rounded-lg border border-[#D2DCE8] p-2.5" />
        </>
      ) : (
        <>
          <p className="font-semibold text-[#0D1B2A]">{m.subject}</p>
          <p className="whitespace-pre-wrap text-[#3A4A5C]">{m.bodyText}</p>
          <p className="text-[11px] text-[#9CA3AF]">To {m.toEmail} · footer with sender, postal address and one-click unsubscribe is added on send.</p>
        </>
      )}
      {m.error && <p className="text-xs text-red-600">{m.error}</p>}
      {editable && (
        <div className="flex flex-wrap gap-2 justify-end">
          {edit ? (
            <>
              <button onClick={() => setEdit(false)} className="px-3 py-1 rounded-lg text-[#3A4A5C]">Cancel</button>
              <button onClick={() => { onAction(m, "save", subject, body); setEdit(false); }} disabled={busy} className="px-3 py-1 rounded-lg bg-[#1B3A6B] text-white font-semibold">Save</button>
            </>
          ) : (
            <>
              <button onClick={() => setEdit(true)} className="px-3 py-1 rounded-lg border border-[#D2DCE8]">Edit</button>
              <button onClick={() => onAction(m, "cancel")} disabled={busy} className="px-3 py-1 rounded-lg border border-[#D2DCE8] text-[#6B7280]">Skip</button>
              {m.status === "draft" && canSend && (
                <button onClick={() => onAction(m, "approve")} disabled={busy} className="px-3 py-1 rounded-lg bg-[#0F6E56] text-white font-semibold">Approve</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
