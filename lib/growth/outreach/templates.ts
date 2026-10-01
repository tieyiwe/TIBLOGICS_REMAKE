import { firstName } from "./normalize";
import { OFFER_BY_KEY, offerName } from "./offers";
import { siteBase, type OutreachConfig } from "./config";
import { escapeHtml } from "@/lib/require-admin";

// Merge fields, the compliance footer and the manual-channel helpers
// (WhatsApp click-to-chat, LinkedIn connection note).

export interface SequenceStep {
  dayOffset: number;
  subject: string;
  body: string;
  /** Ask Haiku to tailor this step to the lead. */
  personalise: boolean;
}

export const MERGE_FIELDS: Array<[string, string]> = [
  ["firstName", "Contact first name, or \"there\""],
  ["contactName", "Full contact name"],
  ["company", "Company name"],
  ["industry", "Industry"],
  ["area", "City / area"],
  ["website", "Their website"],
  ["opener", "AI one-line opener from enrichment"],
  ["offer", "Best-fit TIBLOGICS offer name"],
  ["offerUrl", "Link to that offer (with UTM)"],
  ["bookingUrl", "Book-a-call link (with UTM, tracked if short links exist)"],
  ["senderName", "Your display name"],
];

export interface LeadForMerge {
  id: string;
  companyName: string;
  contactName: string | null;
  industry: string | null;
  area: string | null;
  website: string | null;
  opener: string | null;
  bestOffer: string | null;
}

export function utm(path: string, campaign: string, leadId: string, medium = "email"): string {
  const u = new URL(path, siteBase());
  u.searchParams.set("utm_source", "outreach");
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", campaign);
  u.searchParams.set("utm_content", leadId.slice(-8));
  return u.toString();
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "outreach";
}

export function mergeValues(lead: LeadForMerge, opts: { campaign: string; bookingUrl?: string | null; senderName: string }) {
  const offer = OFFER_BY_KEY.get(lead.bestOffer ?? "");
  return {
    firstName: firstName(lead.contactName) ?? "there",
    contactName: lead.contactName ?? "",
    company: lead.companyName,
    industry: lead.industry ?? "your industry",
    area: lead.area ?? "",
    website: lead.website ?? "",
    opener: lead.opener ?? `I came across ${lead.companyName} and wanted to reach out.`,
    offer: offerName(lead.bestOffer),
    offerUrl: utm(offer?.path ?? "/services", opts.campaign, lead.id),
    bookingUrl: opts.bookingUrl ?? utm("/book", opts.campaign, lead.id),
    senderName: opts.senderName,
  } as Record<string, string>;
}

export function render(tpl: string, values: Record<string, string>): string {
  return tpl.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (m, k: string) => (k in values ? values[k] : m));
}

/** Footer required by CASL/CAN-SPAM: who we are, where we are, how to stop. */
export function footerText(cfg: OutreachConfig, unsubUrl: string, why: string): string {
  return [
    "--",
    `${cfg.fromName}`,
    `TIBLOGICS · ${cfg.physicalAddress}`,
    `Contact: ${cfg.replyTo} · ${siteBase().replace(/^https?:\/\//, "")}`,
    why,
    `Unsubscribe (one click): ${unsubUrl}`,
  ].join("\n");
}

export function whyText(lead: { website: string | null; consentBasis: string }): string {
  if (lead.consentBasis === "implied_relationship") return "You're receiving this because you recently contacted or did business with TIBLOGICS.";
  if (lead.consentBasis === "express") return "You're receiving this because you asked to hear from TIBLOGICS.";
  return `You're receiving this one-to-one business email because your business address is published${lead.website ? ` on ${lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : ""} and it relates to your role.`;
}

/** Minimal, readable HTML version of a plain-text email (links made clickable). */
export function textToHtml(body: string, footer: string, unsubUrl: string): string {
  const linkify = (s: string) =>
    escapeHtml(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:#2251A3">${u}</a>`);
  const paras = body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${linkify(p).replace(/\n/g, "<br>")}</p>`).join("");
  const foot = footer
    .split("\n")
    .slice(1)
    .map((l) => (l.startsWith("Unsubscribe") ? `<a href="${unsubUrl}" style="color:#7A8FA6">Unsubscribe with one click</a>` : linkify(l)))
    .join("<br>");
  return `<!doctype html><html><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0D1B2A;background:#fff"><div style="max-width:600px">${paras}<div style="margin-top:28px;padding-top:12px;border-top:1px solid #E5EAF2;font-size:12px;color:#7A8FA6;line-height:1.6">${foot}</div></div></body></html>`;
}

// ── Manual channels (never automated) ───────────────────────────────────────

export function whatsappMessage(lead: LeadForMerge, senderName: string, bookingUrl: string): string {
  const hi = firstName(lead.contactName) ? `Hi ${firstName(lead.contactName)}` : "Hi";
  const opener = lead.opener ?? `I came across ${lead.companyName} online.`;
  return `${hi}, this is ${senderName.split(",")[0]} from TIBLOGICS. ${opener} We help businesses like ${lead.companyName} with ${offerName(lead.bestOffer).replace(/\s*\(.*\)$/, "").toLowerCase()}. Would a 15-minute call be useful? ${bookingUrl}`;
}

export function linkedinNote(lead: LeadForMerge, senderName: string): string {
  const hi = firstName(lead.contactName) ? `Hi ${firstName(lead.contactName)},` : "Hi,";
  const base = `${hi} ${lead.opener ?? `I came across ${lead.companyName}.`} I help ${lead.industry ? `${lead.industry.toLowerCase()} ` : ""}businesses put practical AI to work. Happy to connect. ${senderName.split(",")[0]}`;
  // LinkedIn connection notes are capped at 300 characters.
  return base.length <= 300 ? base : `${base.slice(0, 296).replace(/\s+\S*$/, "")}...`;
}

export const DEFAULT_STEPS: SequenceStep[] = [
  {
    dayOffset: 0,
    subject: "Quick question about {{company}}",
    body: "Hi {{firstName}},\n\n{{opener}}\n\nI run TIBLOGICS, a small studio that sets up practical AI and automation for local businesses. For {{company}}, I think {{offer}} could help: {{offerUrl}}\n\nWould a 15-minute call be useful? You can pick a time here: {{bookingUrl}}\n\n{{senderName}}",
    personalise: true,
  },
  {
    dayOffset: 3,
    // Not "Re:": a fake reply subject is a deceptive header under CAN-SPAM.
    subject: "Following up: ideas for {{company}}",
    body: "Hi {{firstName}},\n\nJust following up on my note from earlier this week. If it helps, I'm happy to share two or three concrete ideas for {{company}} on a short call, no obligation: {{bookingUrl}}\n\n{{senderName}}",
    personalise: false,
  },
  {
    dayOffset: 7,
    subject: "Last note from me",
    body: "Hi {{firstName}},\n\nI'll leave it here so I don't crowd your inbox. If improving how {{company}} handles enquiries ever becomes a priority, my calendar is open: {{bookingUrl}}\n\nAll the best,\n{{senderName}}",
    personalise: false,
  },
];

export function parseSteps(raw: unknown): SequenceStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 6)
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return {
        dayOffset: Math.max(0, Math.min(60, Math.floor(Number(o.dayOffset) || 0))),
        subject: String(o.subject ?? "").slice(0, 200),
        body: String(o.body ?? "").slice(0, 5000),
        personalise: o.personalise === true,
      };
    })
    .filter((s) => s.subject.trim() && s.body.trim())
    .sort((a, b) => a.dayOffset - b.dayOffset);
}
