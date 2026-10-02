"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BellRing, CalendarClock, Eye, Inbox, Languages, Mail, Megaphone, MessageSquareText, Save, Search, Send, ShieldCheck, Sparkles, TestTube2, UserRound, Users, X,
} from "lucide-react";
import { Badge, Button, Segmented, Select, useToast } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { applyMerge, MERGE_FIELDS, renderMarkdownLite } from "@/lib/learn/inbox/markdown";
import { Dialog } from "../../learn/learners/_components/Dialog";
import { TextField, inputCls, postJson } from "../../learn/learners/_components/fields";

// Compose a message to learners: one learner, a selection, or a segment;
// email and/or in-app Inbox; service or marketing; English with an optional
// French version (AI draft available); send now or schedule. Live preview
// with merge fields filled from a sample learner.

export interface TemplateLite {
  id: string;
  name: string;
  kind: string;
  subject: string;
  body: string;
  subjectFr: string | null;
  bodyFr: string | null;
}

export interface ComposerContext {
  tracks: Array<{ id: string; title: string }>;
  teams: Array<{ id: string; name: string }>;
  tags: string[];
  templates: TemplateLite[];
  adminEmail: string;
}

export interface Segment {
  plan?: string | null;
  track?: string | null;
  progressMin?: number | null;
  progressMax?: number | null;
  inactiveDays?: number | null;
  tag?: string | null;
  lang?: string | null;
  team?: string | null;
}

export type ComposerAudience =
  | { type: "one"; studentId: string; label: string }
  | { type: "ids"; ids: string[]; label?: string }
  | { type: "segment"; segment: Segment }
  | { type: "all" };

interface Initial {
  audience?: ComposerAudience;
  templateId?: string;
}

interface Preview {
  count: number;
  willSkip: number;
  optedOut: number;
  locked: number;
  label: string;
  languages: Record<string, number>;
  sample: Array<{ id: string; name: string; email: string; locale: string }>;
}

const PLAN_OPTIONS: Array<[string, string]> = [
  ["", "Any plan"],
  ["paid", "Paying (subscription or track)"],
  ["monthly", "Monthly"],
  ["annual", "Annual (legacy)"],
  ["comped", "Comped"],
  ["team", "Team"],
  ["tracks", "Tracks bought"],
  ["none", "No plan"],
];

const FIELD_LABEL: Record<string, string> = { firstName: "First name", trackTitle: "Track", progress: "Progress", loginLink: "Sign-in link" };

function apiAudience(a: ComposerAudience) {
  if (a.type === "one") return { type: "one", studentId: a.studentId };
  if (a.type === "ids") return { type: "ids", ids: a.ids };
  if (a.type === "all") return { type: "all" };
  const s = a.segment;
  return {
    type: "segment",
    segment: {
      plan: s.plan || null,
      track: s.track || null,
      progressMin: s.progressMin ?? null,
      progressMax: s.progressMax ?? null,
      inactiveDays: s.inactiveDays ?? null,
      tag: s.tag || null,
      lang: s.lang || null,
      team: s.team || null,
    },
  };
}

function Section({ step, title, children, aside }: { step: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--a-border)] px-5 py-3">
        <h2 className="flex items-center gap-2.5 font-dm text-[14px] font-semibold text-[var(--a-ink)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--a-navy)] font-dm text-[11.5px] font-bold text-white" aria-hidden>
            {step}
          </span>
          {title}
        </h2>
        {aside}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Choice({ on, onClick, icon: Icon, title, body, testId }: { on: boolean; onClick: () => void; icon: React.ElementType; title: string; body: string; testId?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 items-start gap-3 rounded-[12px] border p-3 text-left transition-colors duration-150",
        on ? "border-[var(--a-blue)] bg-[var(--a-info-bg)] ring-1 ring-[var(--a-blue)]" : "border-[var(--a-border)] hover:border-[var(--a-border-strong)] hover:bg-[var(--a-surface-2)]",
      )}
    >
      <Icon size={18} aria-hidden className={on ? "mt-0.5 text-[var(--a-blue)]" : "mt-0.5 text-[var(--a-ink-3)]"} />
      <span className="min-w-0">
        <span className="block font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{title}</span>
        <span className="mt-0.5 block font-dm text-[12.5px] leading-snug text-[var(--a-ink-3)]">{body}</span>
      </span>
    </button>
  );
}

export function MessageComposer({
  context,
  initial,
  lockAudience,
  compact,
  onSent,
}: {
  context: ComposerContext;
  initial?: Initial;
  lockAudience?: boolean;
  compact?: boolean;
  onSent?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const tpl0 = context.templates.find((t) => t.id === initial?.templateId);

  const [audience, setAudience] = useState<ComposerAudience>(initial?.audience ?? { type: "segment", segment: {} });
  const [kind, setKind] = useState<"service" | "marketing">((tpl0?.kind as "service" | "marketing") ?? "service");
  const [viaEmail, setViaEmail] = useState(true);
  const [viaInbox, setViaInbox] = useState(true);
  // "message": a conversation in the learner's Inbox (they can reply).
  // "notification": a short notice with an optional link button, shown
  // under Notifications (for example "New track released").
  const [format, setFormat] = useState<"message" | "notification">("message");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkLabelFr, setLinkLabelFr] = useState("");
  const [allOk, setAllOk] = useState(false);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [subject, setSubject] = useState(tpl0?.subject ?? "");
  const [body, setBody] = useState(tpl0?.body ?? "");
  const [subjectFr, setSubjectFr] = useState(tpl0?.subjectFr ?? "");
  const [bodyFr, setBodyFr] = useState(tpl0?.bodyFr ?? "");
  const [templateId, setTemplateId] = useState(tpl0?.id ?? "");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [at, setAt] = useState(() => {
    const d = new Date(Date.now() + 24 * 3_600_000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "send" | "test" | "translate" | "save">(null);
  const [confirm, setConfirm] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"email" | "inbox">("email");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Recipient preview, debounced.
  const audienceKey = JSON.stringify(apiAudience(audience)) + kind;
  useEffect(() => {
    if (audience.type === "one" && !audience.studentId) {
      setPreview(null);
      return;
    }
    let live = true;
    setPreviewBusy(true);
    const h = window.setTimeout(() => {
      postJson<Preview>("/api/admin/communications/preview", { audience: apiAudience(audience), kind })
        .then((p) => {
          if (live) {
            setPreview(p);
            setPreviewErr(null);
          }
        })
        .catch((err) => live && setPreviewErr(err instanceof Error ? err.message : "Could not count recipients"))
        .finally(() => live && setPreviewBusy(false));
    }, 350);
    return () => {
      live = false;
      window.clearTimeout(h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey]);

  const sampleName = preview?.sample[0]?.name ?? (audience.type === "one" ? audience.label.split(" <")[0] : "Amina");
  const mergeValues = useMemo(
    () => ({ firstName: sampleName.split(" ")[0] || sampleName, trackTitle: "AI Foundations", progress: "40%", loginLink: "https://tiblogics.com/learn/login" }),
    [sampleName],
  );
  const shownSubject = lang === "fr" && subjectFr ? subjectFr : subject;
  const shownBody = lang === "fr" && bodyFr ? bodyFr : body;
  const html = useMemo(
    () => renderMarkdownLite(applyMerge(shownBody || "Your message appears here.", mergeValues)),
    [shownBody, mergeValues],
  );

  function insertField(f: string) {
    const el = bodyRef.current;
    const token = `{${f}}`;
    const set = lang === "fr" ? setBodyFr : setBody;
    const cur = lang === "fr" ? bodyFr : body;
    if (!el) return set(cur + token);
    const start = el.selectionStart ?? cur.length;
    const end = el.selectionEnd ?? cur.length;
    const next = cur.slice(0, start) + token + cur.slice(end);
    set(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = context.templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBody(t.body);
    setSubjectFr(t.subjectFr ?? "");
    setBodyFr(t.bodyFr ?? "");
    setKind(t.kind === "marketing" ? "marketing" : "service");
  }

  async function translate() {
    setBusy("translate");
    setError(null);
    try {
      const r = await postJson<{ subject: string; body: string }>("/api/admin/communications/translate", { subject, body });
      setSubjectFr(r.subject);
      setBodyFr(r.body);
      setLang("fr");
      toast.success("French draft ready", "Read it through before sending.");
    } catch (err) {
      toast.error("Translation failed", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function testSend() {
    setBusy("test");
    try {
      const r = await postJson<{ to: string }>("/api/admin/communications/test", {
        kind,
        subject: shownSubject,
        body: shownBody,
        locale: lang === "fr" && bodyFr ? "fr" : "en",
      });
      toast.success("Test sent", `Check ${r.to}`);
    } catch (err) {
      toast.error("Test not sent", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  async function saveTemplate() {
    setBusy("save");
    try {
      await postJson("/api/admin/communications/templates", { name: tplName, kind, subject, body, subjectFr: subjectFr || null, bodyFr: bodyFr || null });
      toast.success("Template saved");
      setSaveOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Template not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  const frStarted = !!(subjectFr.trim() || bodyFr.trim());
  const frIncomplete = frStarted && !(subjectFr.trim() && bodyFr.trim());
  const notif = format === "notification";
  const tooLong = notif && (subject.length > 140 || subjectFr.length > 140 || body.length > 1000 || bodyFr.length > 1000);
  const ready = !!subject.trim() && !!body.trim() && (viaEmail || viaInbox) && (preview?.count ?? 0) > 0 && !frIncomplete && !tooLong;

  async function send() {
    setBusy("send");
    setError(null);
    try {
      const r = await postJson<{ id: string; recipients: number; scheduled: boolean; report: { sent: number; failed: number; skipped: number } | null }>(
        "/api/admin/communications/campaigns",
        {
          audience: apiAudience(audience),
          kind,
          viaEmail,
          viaInbox,
          subject,
          body,
          subjectFr: subjectFr.trim() || null,
          bodyFr: bodyFr.trim() || null,
          scheduleAt: when === "later" ? new Date(at).toISOString() : null,
          templateId: templateId || null,
          format,
          linkUrl: format === "notification" ? linkUrl.trim() || null : null,
          linkLabel: format === "notification" ? linkLabel.trim() || null : null,
          linkLabelFr: format === "notification" ? linkLabelFr.trim() || null : null,
        },
      );
      setConfirm(false);
      if (r.scheduled) toast.success("Message scheduled", `${r.recipients} recipient${r.recipients === 1 ? "" : "s"}, ${new Date(at).toLocaleString("en-GB")}`);
      else
        toast.success(
          "Message sent",
          r.report ? `${r.report.sent} delivered${r.report.skipped ? `, ${r.report.skipped} skipped` : ""}${r.report.failed ? `, ${r.report.failed} failed` : ""}` : undefined,
        );
      if (onSent) {
        onSent();
        router.refresh();
      } else router.push(`/admin_pro/communications/${r.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Not sent");
      setConfirm(false);
    } finally {
      setBusy(null);
    }
  }

  const count = preview?.count ?? 0;
  const deliverable = Math.max(0, count - (preview?.willSkip ?? 0));
  const sendLabel = when === "later" ? `Schedule for ${count} learner${count === 1 ? "" : "s"}` : `Send to ${count} learner${count === 1 ? "" : "s"}`;

  return (
    <div className={cn("grid gap-5", !compact && "lg:grid-cols-[minmax(0,1fr)_400px]", compact && "p-5")}>
      <div className="min-w-0 space-y-5">
        {/* 1. Audience */}
        <Section
          step={1}
          title="Who receives it"
          aside={
            preview ? (
              <span data-testid="recipient-count" className="font-dm text-[12.5px] font-semibold tabular-nums text-[var(--a-ink-2)]">
                {previewBusy ? "Counting" : `${count} recipient${count === 1 ? "" : "s"}`}
              </span>
            ) : null
          }
        >
          {lockAudience && audience.type === "one" ? (
            <div className="flex items-center gap-2.5 rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface-2)] px-3 py-2.5">
              <UserRound size={16} className="text-[var(--a-ink-3)]" aria-hidden />
              <span className="min-w-0 truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{audience.label}</span>
            </div>
          ) : (
            <AudiencePicker audience={audience} setAudience={setAudience} context={context} />
          )}
          <RecipientSummary preview={preview} busy={previewBusy} error={previewErr} kind={kind} />
        </Section>

        {/* 2. Message */}
        <Section
          step={2}
          title="Message"
          aside={
            context.templates.length ? (
              <Select label="Start from a template" value={templateId} onChange={(e) => applyTemplate(e.target.value)} className="h-8 max-w-[220px] text-[13px]">
                <option value="">Start from a template</option>
                {context.templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            ) : null
          }
        >
          <div role="radiogroup" aria-label="Format" className="mb-3 flex flex-col gap-2 sm:flex-row">
            <Choice testId="format-message" on={format === "message"} onClick={() => setFormat("message")} icon={MessageSquareText} title="Message" body="A conversation in the learner's Inbox. They can reply." />
            <Choice testId="format-notification" on={format === "notification"} onClick={() => setFormat("notification")} icon={BellRing} title="Notification" body="A short notice with an optional button, e.g. “New track released”." />
          </div>
          <div role="radiogroup" aria-label="Message type" className="flex flex-col gap-2 sm:flex-row">
            <Choice testId="kind-service" on={kind === "service"} onClick={() => setKind("service")} icon={ShieldCheck} title="Service" body="Account or course notice. Always delivered." />
            <Choice testId="kind-marketing" on={kind === "marketing"} onClick={() => setKind("marketing")} icon={Megaphone} title="Marketing" body="News or offers. Adds an unsubscribe link; skips learners who opted out." />
          </div>

          <fieldset className="mt-4">
            <legend className="mb-1.5 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Channels</legend>
            <div className="flex flex-wrap gap-2">
              {[
                { on: viaEmail, set: setViaEmail, icon: Mail, label: "Email", hint: "From arfa_edu@tiblogics.com" },
                notif
                  ? { on: viaInbox, set: setViaInbox, icon: BellRing, label: "In-app notification", hint: "Inbox, Notifications tab" }
                  : { on: viaInbox, set: setViaInbox, icon: Inbox, label: "In-app Inbox", hint: "Learner can reply" },
              ].map((c) => (
                <label
                  key={c.label}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-[var(--a-radius-control)] border px-3 py-2 font-dm text-[13px] transition-colors",
                    c.on ? "border-[var(--a-blue)] bg-[var(--a-info-bg)]" : "border-[var(--a-border-strong)] hover:bg-[var(--a-surface-2)]",
                  )}
                >
                  <input type="checkbox" checked={c.on} onChange={(e) => c.set(e.target.checked)} className="h-4 w-4 accent-[var(--a-blue)]" />
                  <c.icon size={15} aria-hidden className="text-[var(--a-ink-3)]" />
                  <span className="font-semibold text-[var(--a-ink)]">{c.label}</span>
                  <span className="hidden text-[var(--a-ink-3)] sm:inline">{c.hint}</span>
                </label>
              ))}
            </div>
            {!viaEmail && !viaInbox ? <p className="mt-1.5 font-dm text-[12.5px] text-[var(--a-danger)]">Choose at least one channel.</p> : null}
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--a-border)]">
            <div className="-mb-px flex gap-1" role="tablist" aria-label="Language version">
              {(["en", "fr"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 border-b-2 px-3 font-dm text-[13px] font-semibold",
                    lang === l ? "border-[var(--a-orange)] text-[var(--a-ink)]" : "border-transparent text-[var(--a-ink-3)] hover:text-[var(--a-ink)]",
                  )}
                >
                  {l === "en" ? "English" : "French"}
                  {l === "fr" ? (
                    frStarted ? <Badge tone={frIncomplete ? "warn" : "success"}>{frIncomplete ? "Incomplete" : "Ready"}</Badge> : <span className="font-medium text-[var(--a-ink-3)]">optional</span>
                  ) : null}
                </button>
              ))}
            </div>
            {lang === "fr" ? (
              <Button size="sm" variant="ghost" icon={Sparkles} loading={busy === "translate"} disabled={!subject.trim() || !body.trim()} onClick={translate}>
                Translate with AI
              </Button>
            ) : null}
          </div>
          <p className="mt-2 font-dm text-[12px] text-[var(--a-ink-3)]">
            {lang === "en"
              ? "Write once in English. French-speaking learners get the French version when you add one; everyone else gets English."
              : "French-speaking learners receive this version. Leave both fields empty to send English to everyone."}
          </p>

          <div className="mt-3 space-y-3">
            <TextField
              label={notif ? "Title" : "Subject"}
              value={lang === "fr" ? subjectFr : subject}
              onChange={(e) => (lang === "fr" ? setSubjectFr : setSubject)(e.target.value)}
              maxLength={notif ? 140 : 200}
              data-testid="composer-subject"
              placeholder={lang === "fr" ? "Objet en français" : "For example: Your next lesson is waiting, {firstName}"}
            />
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="composer-body" className="font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Message</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-dm text-[11.5px] text-[var(--a-ink-3)]">Insert</span>
                  {MERGE_FIELDS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => insertField(f)}
                      className="rounded-md border border-[var(--a-border)] bg-[var(--a-surface-2)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--a-ink-2)] hover:border-[var(--a-border-strong)] hover:text-[var(--a-ink)]"
                      title={FIELD_LABEL[f]}
                    >
                      {`{${f}}`}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="composer-body"
                ref={bodyRef}
                value={lang === "fr" ? bodyFr : body}
                onChange={(e) => (lang === "fr" ? setBodyFr : setBody)(e.target.value)}
                maxLength={notif ? 1000 : 20000}
                rows={notif ? 4 : compact ? 8 : 11}
                placeholder={lang === "fr" ? "Message en français" : "Hi {firstName},\n\nWrite your message. **Bold**, *italic*, [links](https://...) and - lists work."}
                className={cn(inputCls, "resize-y py-2.5 leading-relaxed")}
              />
              <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">
                {notif
                  ? `Keep it short (${(lang === "fr" ? bodyFr : body).length}/1000). Light formatting works. Learners cannot reply to a notification.`
                  : "Light formatting: **bold**, *italic*, [text](https://link), lines starting with “- ”. Replies go to arfa_edu@tiblogics.com and the Inbox tab. Opens are not tracked."}
              </p>
            </div>
            {notif ? (
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                <TextField
                  label="Button link"
                  optional
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  maxLength={500}
                  placeholder="/learn/tracks or https://..."
                  hint="A page of the site (/learn/...) or an https:// address."
                  data-testid="composer-link"
                />
                <TextField
                  label={lang === "fr" ? "Button label (French)" : "Button label"}
                  optional
                  value={lang === "fr" ? linkLabelFr : linkLabel}
                  onChange={(e) => (lang === "fr" ? setLinkLabelFr : setLinkLabel)(e.target.value)}
                  maxLength={40}
                  placeholder={lang === "fr" ? "Voir le parcours" : "See the track"}
                />
              </div>
            ) : null}
            {tooLong ? <p className="font-dm text-[12.5px] text-[var(--a-danger)]">A notification title has at most 140 characters and the text at most 1,000.</p> : null}
          </div>
        </Section>

        {/* 3. Delivery */}
        <Section step={3} title="When">
          <div role="radiogroup" aria-label="When to send" className="flex flex-col gap-2 sm:flex-row">
            <Choice on={when === "now"} onClick={() => setWhen("now")} icon={Send} title="Send now" body="Starts right away. Large audiences continue in the background." />
            <Choice testId="when-later" on={when === "later"} onClick={() => setWhen("later")} icon={CalendarClock} title="Schedule" body="Sent by the comms job (every 15 minutes) at the time you pick." />
          </div>
          {when === "later" ? (
            <div className="mt-3 max-w-[260px]">
              <TextField label="Send at (your local time)" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} data-testid="schedule-at" />
            </div>
          ) : null}
          {error ? <p role="alert" className="mt-4 rounded-[var(--a-radius-control)] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[13px] font-medium text-[var(--a-danger)]">{error}</p> : null}
          {frIncomplete ? <p className="mt-4 font-dm text-[12.5px] text-[var(--a-warn)]">The French version needs both a subject and a message (or leave both empty).</p> : null}
          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[var(--a-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={TestTube2} loading={busy === "test"} disabled={!subject.trim() || !body.trim()} onClick={testSend}>
                Send test to me
              </Button>
              <Button variant="ghost" icon={Save} disabled={!subject.trim() || !body.trim()} onClick={() => { setTplName(subject.slice(0, 80)); setSaveOpen(true); }}>
                Save as template
              </Button>
            </div>
            <Button variant="primary" icon={when === "later" ? CalendarClock : Send} disabled={!ready || !!busy} onClick={() => setConfirm(true)} data-testid="composer-send">
              {sendLabel}
            </Button>
          </div>
        </Section>
      </div>

      {/* Preview */}
      <aside className={cn("min-w-0", !compact && "lg:sticky lg:top-0 lg:self-start")}>
        <div className="overflow-hidden rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] shadow-[var(--a-shadow-card)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--a-border)] px-4 py-2.5">
            <p className="flex items-center gap-2 font-dm text-[13px] font-semibold text-[var(--a-ink)]">
              <Eye size={15} className="text-[var(--a-ink-3)]" aria-hidden /> Preview
              <span className="font-medium text-[var(--a-ink-3)]">as {mergeValues.firstName}</span>
            </p>
            <Segmented
              size="sm"
              ariaLabel="Preview channel"
              value={previewTab}
              onChange={(v) => setPreviewTab(v as "email" | "inbox")}
              options={[{ value: "email", label: "Email" }, { value: "inbox", label: "Inbox" }]}
            />
          </div>
          {previewTab === "email" ? (
            <div className="bg-[#F4F7FB] p-4">
              <div className="overflow-hidden rounded-[12px] border border-[#e6ebf1] bg-white">
                <div className="flex items-center gap-3 border-b-[3px] border-[#F47C20] px-4 py-3">
                  <span className="font-dm text-[22px] font-black leading-none tracking-tight text-[#1B2A5E]">AR<span className="text-[#F47C20]">FA</span></span>
                  <span className="border-l-2 border-[#1B2A5E] pl-3 font-dm text-[10px] font-bold uppercase leading-tight tracking-[.08em] text-[#F47C20]">AI Readiness<br />For All</span>
                </div>
                <div className="px-4 py-4">
                  <p className="font-dm text-[11px] text-[var(--a-ink-3)]">From ARFA · AI Readiness For All &lt;arfa_edu@tiblogics.com&gt;</p>
                  <p className="mt-2 font-dm text-[16px] font-bold leading-snug text-[#131A1B]">{applyMerge(shownSubject || "Subject", mergeValues)}</p>
                  <div
                    className="mt-3 font-dm text-[13.5px] leading-relaxed text-[#3b4a52] [&_a]:font-semibold [&_a]:text-[#C2560E] [&_p+p]:mt-2.5 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                  {notif && linkUrl.trim() ? (
                    <div className="mt-4 text-center">
                      <span className="inline-block rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-5 py-2 font-dm text-[12.5px] font-extrabold text-[#131A1B]">{((lang === "fr" ? linkLabelFr || linkLabel : linkLabel) || "Open")} →</span>
                    </div>
                  ) : viaInbox ? (
                    <div className="mt-4 text-center">
                      <span className="inline-block rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-5 py-2 font-dm text-[12.5px] font-extrabold text-[#131A1B]">{notif ? "Open my notifications" : "Open my Inbox"} →</span>
                    </div>
                  ) : null}
                  {kind === "marketing" ? (
                    <p className="mt-4 border-t border-[#eef1f4] pt-3 font-dm text-[11px] text-[#8A9BA0]">
                      You receive ARFA news because you have an ARFA account. <u>Unsubscribe</u>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F3F5F8] p-4">
              <div className="rounded-2xl border border-[var(--a-border)] bg-white p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-dm text-[13px] font-bold text-[var(--a-ink)]">ARFA team</p>
                  <p className="font-dm text-[11px] text-[var(--a-ink-3)]">now</p>
                </div>
                <p className="mt-1 font-dm text-[14px] font-bold text-[var(--a-ink)]">{applyMerge(shownSubject || "Subject", mergeValues)}</p>
                <div
                  className="mt-2 font-dm text-[13.5px] leading-relaxed text-[var(--a-ink-2)] [&_a]:font-semibold [&_a]:text-[var(--a-blue)] [&_a]:underline [&_p+p]:mt-2.5 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                {notif ? (
                  linkUrl.trim() ? (
                    <span className="mt-3 inline-block rounded-full bg-[var(--a-navy)] px-4 py-1.5 font-dm text-[12.5px] font-bold text-white">
                      {(lang === "fr" ? linkLabelFr || linkLabel : linkLabel) || "Open"}
                    </span>
                  ) : null
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-[var(--a-border-strong)] px-3 py-2 font-dm text-[12px] text-[var(--a-ink-3)]">Reply box</div>
                )}
              </div>
              {!viaInbox ? <p className="mt-2 font-dm text-[12px] text-[var(--a-ink-3)]">In-app Inbox is off for this message.</p> : null}
            </div>
          )}
        </div>
      </aside>

      <Dialog
        open={confirm}
        onClose={() => {
          setConfirm(false);
          setAllOk(false);
        }}
        title={when === "later" ? "Schedule this message?" : count === 1 ? "Send this message?" : `Send to ${count} learners?`}
        icon={when === "later" ? CalendarClock : Send}
        description={
          <>
            <strong>{preview?.label}</strong>. {kind === "marketing" ? "Marketing" : "Service"} {notif ? "notification" : "message"} by{" "}
            {[viaEmail && "email", viaInbox && (notif ? "in-app notification" : "in-app Inbox")].filter(Boolean).join(" and ")}
            {when === "later" ? `, on ${new Date(at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}.
          </>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)} disabled={busy === "send"}>Cancel</Button>
            <Button variant="primary" loading={busy === "send"} disabled={audience.type === "all" && !allOk} onClick={send} data-testid="composer-confirm">
              {when === "later" ? "Schedule" : "Send now"}
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-2 gap-3 font-dm text-[13px]">
          <div className="rounded-[10px] bg-[var(--a-surface-2)] p-3">
            <dt className="a-micro">Will receive</dt>
            <dd className="mt-1 text-[20px] font-bold tabular-nums text-[var(--a-ink)]">{deliverable}</dd>
          </div>
          <div className="rounded-[10px] bg-[var(--a-surface-2)] p-3">
            <dt className="a-micro">Skipped</dt>
            <dd className="mt-1 text-[20px] font-bold tabular-nums text-[var(--a-ink)]">{preview?.willSkip ?? 0}</dd>
          </div>
        </dl>
        {frStarted ? null : <p className="mt-3 font-dm text-[12.5px] text-[var(--a-ink-3)]">No French version: French-speaking learners get the English text.</p>}
        {audience.type === "all" ? (
          <label className="mt-3 flex items-start gap-2 rounded-[10px] border border-[var(--a-warn)] bg-[var(--a-warn-bg,#FFF7E6)] p-3 font-dm text-[13px] text-[var(--a-ink)]">
            <input type="checkbox" checked={allOk} onChange={(e) => setAllOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--a-blue)]" data-testid="confirm-all" />
            <span>
              I confirm this {notif ? "notification" : "message"} goes to <strong>all {count} learners</strong>
              {viaEmail ? `, by email${viaInbox ? " and in-app" : ""}` : " in-app"}.
            </span>
          </label>
        ) : null}
      </Dialog>

      <Dialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save as template"
        icon={Save}
        description="Saves the subject, message, French version and type. Merge fields stay as fields."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={busy === "save"} disabled={!tplName.trim()} onClick={saveTemplate}>Save template</Button>
          </>
        }
      >
        <TextField label="Template name" value={tplName} onChange={(e) => setTplName(e.target.value)} maxLength={120} />
      </Dialog>
    </div>
  );
}

function RecipientSummary({ preview, busy, error, kind }: { preview: Preview | null; busy: boolean; error: string | null; kind: string }) {
  if (error) return <p className="mt-3 font-dm text-[12.5px] text-[var(--a-danger)]">{error}</p>;
  if (!preview) return null;
  return (
    <div className={cn("mt-4 rounded-[12px] border border-[var(--a-border)] p-3 transition-opacity", busy && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-dm text-[12.5px] text-[var(--a-ink-2)]">
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-[var(--a-ink-3)]" aria-hidden />
          <strong className="tabular-nums text-[var(--a-ink)]">{preview.count}</strong> matching
        </span>
        {Object.entries(preview.languages).map(([l, n]) => (
          <span key={l} className="tabular-nums">
            <span className="font-semibold uppercase">{l}</span> {n}
          </span>
        ))}
        {preview.willSkip > 0 ? (
          <span className="text-[var(--a-warn)]">
            {preview.willSkip} will be skipped ({[preview.locked && `${preview.locked} blocked`, preview.optedOut && `${preview.optedOut} ${kind === "marketing" ? "unsubscribed or suspended" : ""}`].filter(Boolean).join(", ")})
          </span>
        ) : null}
      </div>
      {preview.sample.length ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {preview.sample.map((s) => (
            <li key={s.id} className="rounded-full bg-[var(--a-surface-2)] px-2.5 py-1 font-dm text-[12px] text-[var(--a-ink-2)]" title={s.email}>
              {s.name}
            </li>
          ))}
          {preview.count > preview.sample.length ? (
            <li className="px-1 py-1 font-dm text-[12px] text-[var(--a-ink-3)]">and {preview.count - preview.sample.length} more</li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-2 font-dm text-[12.5px] text-[var(--a-ink-3)]">No learner matches yet. Widen the filters.</p>
      )}
    </div>
  );
}

function AudiencePicker({ audience, setAudience, context }: { audience: ComposerAudience; setAudience: (a: ComposerAudience) => void; context: ComposerContext }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const mode = audience.type;

  useEffect(() => {
    if (mode !== "one" || q.trim().length < 2) {
      setResults([]);
      return;
    }
    let live = true;
    const h = window.setTimeout(() => {
      fetch(`/api/admin/learn/learners/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((d) => live && setResults(d.results ?? []))
        .catch(() => {});
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(h);
    };
  }, [q, mode]);

  const seg = audience.type === "segment" ? audience.segment : {};
  const setSeg = (patch: Partial<Segment>) => setAudience({ type: "segment", segment: { ...seg, ...patch } });
  const num = (v: string) => (v === "" ? null : Math.max(0, Math.min(100, Number(v))));

  return (
    <div>
      <Segmented
        ariaLabel="Audience"
        value={mode}
        onChange={(v) => {
          if (v === "segment") setAudience({ type: "segment", segment: {} });
          else if (v === "all") setAudience({ type: "all" });
          else if (v === "one") setAudience({ type: "one", studentId: "", label: "" });
          else if (audience.type !== "ids") setAudience({ type: "ids", ids: [] });
        }}
        options={[
          { value: "one", label: "One learner" },
          ...(audience.type === "ids" ? [{ value: "ids", label: `Selection (${audience.ids.length})` }] : []),
          { value: "segment", label: "Segment" },
          { value: "all", label: "All learners" },
        ]}
      />

      {audience.type === "all" ? (
        <p className="mt-3 flex items-center gap-2 font-dm text-[13px] text-[var(--a-ink-2)]" data-testid="audience-all">
          <Users size={15} className="text-[var(--a-ink-3)]" aria-hidden />
          Every learner account. Blocked and deleted accounts are never included; marketing skips learners who unsubscribed. You confirm the count before sending.
        </p>
      ) : null}

      {audience.type === "one" ? (
        <div className="relative mt-3">
          {audience.studentId ? (
            <div className="flex items-center gap-2.5 rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface-2)] px-3 py-2.5">
              <UserRound size={16} className="text-[var(--a-ink-3)]" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{audience.label}</span>
              <button type="button" aria-label="Choose another learner" onClick={() => setAudience({ type: "one", studentId: "", label: "" })} className="rounded-md p-1 text-[var(--a-ink-3)] hover:bg-[var(--a-surface)] hover:text-[var(--a-ink)]">
                <X size={15} aria-hidden />
              </button>
            </div>
          ) : (
            <>
              <label className="relative block">
                <span className="sr-only">Find a learner</span>
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--a-ink-3)]" aria-hidden />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" className={cn(inputCls, "h-9 pl-9")} autoComplete="off" />
              </label>
              {results.length ? (
                <ul className="a-anim-pop absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[12px] border border-[var(--a-border)] bg-[var(--a-surface)] py-1 shadow-[var(--a-shadow-pop)]">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setAudience({ type: "one", studentId: r.id, label: `${r.name} <${r.email}>` });
                          setQ("");
                        }}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-[var(--a-surface-2)]"
                      >
                        <span className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">{r.name}</span>
                        <span className="font-dm text-[12px] text-[var(--a-ink-3)]">{r.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {audience.type === "ids" ? (
        <p className="mt-3 font-dm text-[13px] text-[var(--a-ink-2)]">
          {audience.ids.length} learner{audience.ids.length === 1 ? "" : "s"} selected on the Learners page.
        </p>
      ) : null}

      {audience.type === "segment" ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SegSelect label="Plan" value={seg.plan ?? ""} onChange={(v) => setSeg({ plan: v || null })} options={PLAN_OPTIONS} />
          <SegSelect label="Track enrolled" value={seg.track ?? ""} onChange={(v) => setSeg({ track: v || null })} options={[["", "Any track"], ...context.tracks.map((t) => [t.id, t.title] as [string, string])]} />
          <SegSelect
            label="Inactive for"
            value={seg.inactiveDays ? String(seg.inactiveDays) : ""}
            onChange={(v) => setSeg({ inactiveDays: v ? Number(v) : null })}
            options={[["", "Any activity"], ["7", "7+ days"], ["14", "14+ days"], ["30", "30+ days"], ["60", "60+ days"], ["90", "90+ days"]]}
          />
          <div>
            <p className="mb-1.5 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">Progress</p>
            <div className="flex items-center gap-2">
              <input aria-label="Progress from (%)" type="number" min={0} max={100} placeholder="0" value={seg.progressMin ?? ""} onChange={(e) => setSeg({ progressMin: num(e.target.value) })} className={cn(inputCls, "h-9 w-20 tabular-nums")} />
              <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">to</span>
              <input aria-label="Progress to (%)" type="number" min={0} max={100} placeholder="100" value={seg.progressMax ?? ""} onChange={(e) => setSeg({ progressMax: num(e.target.value) })} className={cn(inputCls, "h-9 w-20 tabular-nums")} />
              <span className="font-dm text-[12.5px] text-[var(--a-ink-3)]">%</span>
            </div>
          </div>
          <SegSelect label="Tag" value={seg.tag ?? ""} onChange={(v) => setSeg({ tag: v || null })} options={[["", "Any tag"], ...context.tags.map((t) => [t, t] as [string, string])]} />
          <SegSelect label="Language" value={seg.lang ?? ""} onChange={(v) => setSeg({ lang: v || null })} options={[["", "Any language"], ["en", "English"], ["fr", "French"]]} />
          {context.teams.length ? (
            <SegSelect label="Team" value={seg.team ?? ""} onChange={(v) => setSeg({ team: v || null })} options={[["", "Any team"], ...context.teams.map((t) => [t.id, t.name] as [string, string])]} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SegSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </Select>
    </label>
  );
}
