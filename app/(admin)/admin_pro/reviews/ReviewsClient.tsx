"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, EyeOff, Mail, Plus, Star, StarOff } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader, useToast } from "@/components/admin/ui";
import Stars from "@/components/reviews/Stars";
import { postJson } from "../learn/learners/_components/fields";
import { QUOTE_MAX, QUOTE_MIN, REVIEW_SOURCES, SOURCE_LABELS, type AdminReview, type ReviewSource, type ReviewStatus } from "@/lib/reviews/types";

// Reviews admin. Staff approve, hide or feature; nobody edits a reviewer's
// words (there is no edit control and no edit API). Invitations go once per
// person and source; "Copy invite link" hands staff the link to share
// another way. "Add a review received elsewhere" needs a note and the
// reviewer's agreement.

const LANGS = [
  { v: "en", l: "English" },
  { v: "fr", l: "French" },
  { v: "sw", l: "Swahili" },
] as const;

const field =
  "mt-1 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 py-2 font-dm text-[14px] text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none";
const lbl = "block font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]";

export default function ReviewsClient({
  status,
  reviews,
  counts,
  canManage,
}: {
  status: ReviewStatus;
  reviews: AdminReview[];
  counts: Record<ReviewStatus, number>;
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "hide" | "feature" | "unfeature") {
    setBusy(`${id}:${action}`);
    try {
      await postJson(`/api/admin/reviews/${id}`, { action });
      toast.success(
        action === "approve" ? "Approved and published" : action === "hide" ? "Hidden from the website" : action === "feature" ? "Featured on the website" : "No longer featured",
      );
      router.refresh();
    } catch (err) {
      toast.error("Could not update", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Real reviews from clients and ARFA learners. Nothing is published until you approve it, and only with the reviewer's consent. Reviewers' words are never edited."
        breadcrumb={[{ label: "Sales & Growth" }, { label: "Reviews" }]}
        tabs={[
          { label: "Pending", count: counts.pending, href: "/admin_pro/reviews?status=pending" },
          { label: "Approved", count: counts.approved, href: "/admin_pro/reviews?status=approved" },
          { label: "Hidden", count: counts.hidden, href: "/admin_pro/reviews?status=hidden" },
        ]}
        activeTab={`/admin_pro/reviews?status=${status}`}
      />

      {canManage && (
        <div className="grid gap-5 lg:grid-cols-2">
          <InviteCard />
          <AddReviewCard onAdded={() => router.push("/admin_pro/reviews?status=pending")} />
        </div>
      )}

      <section aria-label={`${status} reviews`} data-testid={`reviews-list-${status}`}>
        {reviews.length === 0 ? (
          <EmptyState
            title={status === "pending" ? "No reviews waiting" : status === "approved" ? "No approved reviews yet" : "No hidden reviews"}
            body={status === "pending" ? "Invite a client or learner above. Their review appears here for approval." : "Reviews move here when you approve or hide them."}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} data-testid="review-row" data-id={r.id} data-email={r.email}>
                <Card className="h-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={r.rating} label={`Rated ${r.rating} out of 5`} size={16} />
                    <Badge tone="info">{SOURCE_LABELS[r.source]}</Badge>
                    <Badge tone="neutral">{r.locale.toUpperCase()}</Badge>
                    {r.featured && <Badge tone="orange">Featured</Badge>}
                    {r.addedByStaff && <Badge tone="warn" title={r.staffNote ?? undefined}>Added by staff</Badge>}
                    {r.consentPublish ? <Badge tone="success">Consent to publish</Badge> : <Badge tone="danger">Private: no consent</Badge>}
                  </div>
                  <blockquote lang={r.locale} className="mt-3 whitespace-pre-line font-dm text-[14.5px] leading-relaxed text-[var(--a-ink)]" data-testid="review-quote">
                    “{r.quote}”
                  </blockquote>
                  <p className="mt-3 font-dm text-[13.5px] text-[var(--a-ink)]">
                    <span className="font-semibold">{r.name}</span>, {r.role}
                    {r.company ? `, ${r.company}` : ""}
                  </p>
                  <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">
                    {r.email} · received {r.createdAt.slice(0, 10)}
                    {r.approvedAt ? ` · approved ${r.approvedAt.slice(0, 10)}${r.approvedBy ? ` by ${r.approvedBy}` : ""}` : ""}
                  </p>
                  {r.staffNote && <p className="mt-1 font-dm text-[12px] italic text-[var(--a-ink-3)]">Source note: {r.staffNote}</p>}
                  {canManage && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={Check}
                          disabled={!r.consentPublish || !!busy}
                          loading={busy === `${r.id}:approve`}
                          title={r.consentPublish ? undefined : "The reviewer did not agree to publication"}
                          onClick={() => act(r.id, "approve")}
                          data-testid="review-approve"
                        >
                          Approve
                        </Button>
                      )}
                      {r.status === "approved" && (
                        <Button
                          size="sm"
                          icon={r.featured ? StarOff : Star}
                          disabled={!!busy}
                          loading={busy === `${r.id}:${r.featured ? "unfeature" : "feature"}`}
                          onClick={() => act(r.id, r.featured ? "unfeature" : "feature")}
                          data-testid="review-feature"
                        >
                          {r.featured ? "Unfeature" : "Feature"}
                        </Button>
                      )}
                      {r.status !== "hidden" && (
                        <Button size="sm" variant="ghost" icon={EyeOff} disabled={!!busy} loading={busy === `${r.id}:hide`} onClick={() => act(r.id, "hide")} data-testid="review-hide">
                          Hide
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SourceSelect({ value, onChange, testId }: { value: ReviewSource; onChange: (v: ReviewSource) => void; testId: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as ReviewSource)} className={field} data-testid={testId}>
      {REVIEW_SOURCES.map((s) => (
        <option key={s} value={s}>
          {SOURCE_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

function LangSelect({ value, onChange, testId }: { value: string; onChange: (v: "en" | "fr" | "sw") => void; testId: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as "en" | "fr" | "sw")} className={field} data-testid={testId}>
      {LANGS.map((l) => (
        <option key={l.v} value={l.v}>
          {l.l}
        </option>
      ))}
    </select>
  );
}

function InviteCard() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<ReviewSource>("consultation");
  const [locale, setLocale] = useState<"en" | "fr" | "sw">("en");
  const [busy, setBusy] = useState<"send" | "copy" | null>(null);
  const [link, setLink] = useState("");

  async function go(send: boolean) {
    setBusy(send ? "send" : "copy");
    setLink("");
    try {
      const r = await postJson<{ link: string; sent: boolean }>("/api/admin/reviews/invite", { name, email, source, locale, send });
      setLink(r.link);
      if (send) {
        toast.success("Invitation sent", `${name} will receive the link by email.`);
        setName("");
        setEmail("");
      } else {
        try {
          await navigator.clipboard.writeText(r.link);
          toast.success("Invite link copied", "Share it with this person only. It works for 60 days.");
        } catch {
          toast.info("Invite link ready", "Copy it from the box below.");
        }
      }
    } catch (err) {
      toast.error(send ? "Not sent" : "No link", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title="Invite to review" subtitle="A warm email with a personal link (60 days). Each person is invited once per source." icon={Mail}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} data-testid="invite-name" />
        </label>
        <label className={lbl}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} data-testid="invite-email" />
        </label>
        <label className={lbl}>
          What they are reviewing
          <SourceSelect value={source} onChange={setSource} testId="invite-source" />
        </label>
        <label className={lbl}>
          Language
          <LangSelect value={locale} onChange={setLocale} testId="invite-locale" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" icon={Mail} loading={busy === "send"} disabled={!!busy || !name.trim() || !email.trim()} onClick={() => go(true)} data-testid="invite-send">
          Send invite
        </Button>
        <Button icon={Copy} loading={busy === "copy"} disabled={!!busy || !name.trim() || !email.trim()} onClick={() => go(false)} data-testid="invite-copy">
          Copy invite link
        </Button>
      </div>
      {link && (
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className={`${field} mt-3 font-mono text-[12px]`} aria-label="Invite link" data-testid="invite-link" />
      )}
    </Card>
  );
}

function AddReviewCard({ onAdded }: { onAdded: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", role: "", company: "", quote: "", email: "", staffNote: "" });
  const [rating, setRating] = useState(5);
  const [source, setSource] = useState<ReviewSource>("project");
  const [locale, setLocale] = useState<"en" | "fr" | "sw">("en");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    try {
      await postJson("/api/admin/reviews", { ...f, company: f.company || null, rating, source, locale, consent });
      toast.success("Review added", "It is waiting in Pending for approval.");
      setF({ name: "", role: "", company: "", quote: "", email: "", staffNote: "" });
      setConsent(false);
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error("Not added", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Add a review received elsewhere"
      subtitle="A real review someone sent by email or posted on LinkedIn. Paste their exact words; say where it came from."
      icon={Plus}
      action={
        <Button size="sm" onClick={() => setOpen((o) => !o)} data-testid="add-toggle">
          {open ? "Close" : "Add review"}
        </Button>
      }
    >
      {open ? (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>
              Reviewer&apos;s name
              <input value={f.name} onChange={set("name")} className={field} data-testid="add-name" />
            </label>
            <label className={lbl}>
              Reviewer&apos;s email (kept private)
              <input type="email" value={f.email} onChange={set("email")} className={field} data-testid="add-email" />
            </label>
            <label className={lbl}>
              Role
              <input value={f.role} onChange={set("role")} className={field} data-testid="add-role" />
            </label>
            <label className={lbl}>
              Company (optional)
              <input value={f.company} onChange={set("company")} className={field} data-testid="add-company" />
            </label>
            <label className={lbl}>
              Source
              <SourceSelect value={source} onChange={setSource} testId="add-source" />
            </label>
            <label className={lbl}>
              Language of the review
              <LangSelect value={locale} onChange={setLocale} testId="add-locale" />
            </label>
            <label className={lbl}>
              Rating
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={field} data-testid="add-rating">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={lbl}>
            Their exact words ({QUOTE_MIN} to {QUOTE_MAX} characters)
            <textarea value={f.quote} onChange={set("quote")} rows={4} className={field} data-testid="add-quote" />
          </label>
          <label className={lbl}>
            Where it came from (required)
            <input value={f.staffNote} onChange={set("staffNote")} placeholder="e.g. Email to info@ on 3 Oct 2026, or LinkedIn recommendation" className={field} data-testid="add-staffnote" />
          </label>
          <label className="flex items-start gap-2 font-dm text-[13px] text-[var(--a-ink)]">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" data-testid="add-consent" />
            The reviewer agreed that TIBLOGICS may publish their first name, role, company and words on its website.
          </label>
          <div>
            <Button variant="primary" loading={busy} disabled={busy || !consent || f.staffNote.trim().length < 5} onClick={save} data-testid="add-submit">
              Add to Pending
            </Button>
          </div>
        </div>
      ) : (
        <p className="font-dm text-[13px] text-[var(--a-ink-3)]">Never write a review yourself. Only add words a real person sent you, with their permission.</p>
      )}
    </Card>
  );
}
