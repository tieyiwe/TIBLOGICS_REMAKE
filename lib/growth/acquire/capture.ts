import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getCatalogItem } from "../catalog";
import { siteUrl } from "../links";
import { ensureOutreachTables } from "../outreach/db";
import { addEvent, leadDataFromInput } from "../outreach/leads";
import { clean, dedupeDomain, normEmail, normPhone } from "../outreach/normalize";
import { isSuppressed } from "../outreach/suppression";
import { ensureAcquireTables } from "./db";
import { recordCaptureAttribution, type RefType } from "./events";
import { localizeContent } from "./i18n";
import { sendMagnetEmail, trackedProductUrl } from "./email";
import { accessToken } from "./security";
import { campaignFor, getPublishedMagnet, getPublishedPage, publicPath } from "./store";
import { normalizeMagnet, scoreQuiz, type QuizResult } from "./types";

// One opt-in from a magnet or landing page form:
//   1. NewsletterSubscriber (source "magnet:<slug>" / "lp:<slug>"); an
//      unsubscribed one stays unsubscribed (the form cannot prove who typed
//      the address);
//   2. a lead in the Growth pipeline with consent basis "express", the exact
//      consent text and its timestamp in the note (or an event on the lead
//      that already has this email, upgrading a weaker consent basis);
//   3. AcquireCapture with the consent, the quiz result and the campaign;
//   4. ConversionAttribution (UTM cookie, else the page's own campaign);
//   5. for magnets, the email that delivers the asset.

export class CaptureError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface CaptureInput {
  refType: RefType;
  slug: string;
  email: string;
  name?: string | null;
  business?: string | null;
  whatsapp?: string | null;
  locale: Locale;
  answers?: number[] | null;
  cookieHeader: string | null;
}

export interface CaptureOutcome {
  accessUrl: string | null;
  result: QuizResult | null;
  emailed: boolean;
}

/** The consent sentence shown next to the checkbox, in the language it was shown in. */
export function consentText(locale: Locale): string {
  return translatorFor(locale)("acquire.form.consent");
}

const WEAK_CONSENT = new Set(["unset", "implied_published", "implied_relationship", "us_only_canspam"]);

async function upsertSubscriber(email: string, name: string | null, whatsapp: string | null, source: string): Promise<string | null> {
  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      // The form does not prove who typed the address, so it never undoes an
      // unsubscribe: anyone could otherwise re-subscribe someone who opted out.
      if (!existing.active) return existing.id;
      const row = await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          firstName: existing.firstName ?? name,
          whatsapp: existing.whatsapp ?? whatsapp,
        },
      });
      return row.id;
    }
    const row = await prisma.newsletterSubscriber.create({ data: { email, firstName: name, whatsapp, source: source.slice(0, 80), active: true } });
    return row.id;
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return (await prisma.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } }))?.id ?? null;
    }
    console.error("[acquire] subscriber", err);
    return null;
  }
}

async function upsertLead(opts: {
  email: string;
  name: string | null;
  business: string | null;
  whatsapp: string | null;
  source: "magnet" | "landing";
  captureId: string;
  tag: string;
  consentNote: string;
  detail: string;
}): Promise<string | null> {
  try {
    await ensureOutreachTables();
    const domain = dedupeDomain(null, opts.email);
    const phoneNorm = normPhone(opts.whatsapp);
    const or: Prisma.GrowthLeadWhereInput[] = [{ email: opts.email }];
    if (domain) or.push({ domain });
    if (phoneNorm) or.push({ phoneNorm });
    const existing = await prisma.growthLead.findFirst({ where: { OR: or }, orderBy: { createdAt: "asc" } });
    if (existing) {
      const tags = Array.isArray(existing.tags) ? (existing.tags as unknown[]).filter((x): x is string => typeof x === "string") : [];
      const data: Prisma.GrowthLeadUpdateInput = { tags: [...new Set([...tags, opts.tag])].slice(0, 30) };
      // The lead may have been matched on its company domain or phone only.
      // Consent from x@acme.com is not consent from the lead's own contact
      // (ceo@acme.com): upgrade only when the form's address IS the lead's.
      const sameContact = !existing.email || existing.email.toLowerCase() === opts.email;
      if (sameContact && !existing.doNotContact && WEAK_CONSENT.has(existing.consentBasis)) {
        data.consentBasis = "express";
        data.consentNote = opts.consentNote.slice(0, 1000);
      }
      if (!existing.email) data.email = opts.email;
      if (!existing.contactName && opts.name) data.contactName = opts.name;
      await prisma.growthLead.update({ where: { id: existing.id }, data });
      await addEvent(existing.id, "opt_in", opts.detail, { captureId: opts.captureId });
      return existing.id;
    }
    const d = leadDataFromInput({
      companyName: opts.business ?? undefined,
      contactName: opts.name ?? undefined,
      email: opts.email,
      phone: opts.whatsapp ?? undefined,
    });
    const companyName = opts.business || (domain ? d.companyName : null) || opts.name || opts.email.split("@")[0];
    const lead = await prisma.growthLead.create({
      data: {
        ...d,
        companyName: companyName.slice(0, 200),
        source: opts.source,
        sourceId: opts.captureId,
        consentBasis: "express",
        consentNote: opts.consentNote.slice(0, 1000),
        tags: [opts.tag],
      },
    });
    await addEvent(lead.id, "imported", opts.detail, { captureId: opts.captureId });
    return lead.id;
  } catch (err) {
    console.error("[acquire] lead", err);
    return null;
  }
}

export async function handleCapture(input: CaptureInput): Promise<CaptureOutcome> {
  await ensureAcquireTables();
  const email = normEmail(input.email);
  if (!email) throw new CaptureError("invalidEmail");
  const name = clean(input.name, 100);
  const business = clean(input.business, 160);
  const whatsapp = clean(input.whatsapp, 40);
  const locale = isLocale(input.locale) ? input.locale : "en";

  const magnet = input.refType === "magnet" ? await getPublishedMagnet(input.slug) : null;
  const page = input.refType === "page" ? await getPublishedPage(input.slug) : null;
  const row = magnet ?? page;
  if (!row) throw new CaptureError("notFound", 404);
  const path = publicPath(input.refType, row.slug);
  const campaign = campaignFor(input.refType, row.slug);

  let result: QuizResult | null = null;
  const content = magnet ? normalizeMagnet(magnet.content) : null;
  if (magnet && content && magnet.type === "quiz" && Array.isArray(input.answers)) {
    result = scoreQuiz(content, input.answers);
  }

  const now = new Date();
  const consent = consentText(locale);
  const consentNote = `Express consent (form) ${now.toISOString()} on ${siteUrl()}${path} (${locale}): "${consent}"`;

  // The capture first: its id is the lead's sourceId and the attribution refId.
  const existing = await prisma.acquireCapture.findUnique({ where: { refType_refId_email: { refType: input.refType, refId: row.id, email } } });
  const capture = existing
    ? await prisma.acquireCapture.update({
        where: { id: existing.id },
        data: {
          name: name ?? existing.name,
          business: business ?? existing.business,
          whatsapp: whatsapp ?? existing.whatsapp,
          locale,
          consentText: consent,
          consentAt: now,
          ...(result ? { result: JSON.parse(JSON.stringify({ ...result, answers: input.answers })) } : {}),
        },
      })
    : await prisma.acquireCapture.create({
        data: {
          refType: input.refType,
          refId: row.id,
          slug: row.slug,
          email,
          name,
          business,
          whatsapp,
          locale,
          consentText: consent,
          consentAt: now,
          result: result ? JSON.parse(JSON.stringify({ ...result, answers: input.answers })) : undefined,
        },
      });

  const source = `${input.refType === "magnet" ? "magnet" : "lp"}:${row.slug}`;
  const [subscriberId, leadId] = await Promise.all([
    upsertSubscriber(email, name, whatsapp, source),
    upsertLead({
      email,
      name,
      business,
      whatsapp,
      source: input.refType === "magnet" ? "magnet" : "landing",
      captureId: capture.id,
      tag: source,
      consentNote,
      detail: `${input.refType === "magnet" ? "Requested the lead magnet" : "Filled in the landing page form"} "${row.title}" (${path})${result ? `, quiz score ${result.score}/100` : ""}`,
    }),
  ]);

  // Analytics: first and last touch of the lead (lib/analytics/touch.ts). Never throws.
  if (!existing) await import("@/lib/analytics/touch").then((m) => m.recordTouch({ kind: "lead_magnet", refId: capture.id, cookieHeader: input.cookieHeader })).catch(() => {});
  const attr = existing
    ? null
    : await recordCaptureAttribution({
        refType: input.refType,
        captureId: capture.id,
        cookieHeader: input.cookieHeader,
        fallback: { utmSource: "acquire", utmMedium: input.refType === "magnet" ? "lead-magnet" : "landing", utmCampaign: campaign, utmContent: null, linkCode: row.linkCode ?? null },
      });
  await prisma.acquireCapture.update({
    where: { id: capture.id },
    data: {
      subscriberId: subscriberId ?? capture.subscriberId,
      leadId: leadId ?? capture.leadId,
      ...(attr ? { utmSource: attr.utmSource, utmMedium: attr.utmMedium, utmCampaign: attr.utmCampaign, linkCode: attr.linkCode } : {}),
    },
  });

  if (!magnet || !content) return { accessUrl: null, result: null, emailed: false };

  const accessUrl = `${siteUrl()}${path}/access?k=${accessToken(capture.id)}`;
  let emailed = false;
  // An address that unsubscribed, bounced or complained gets no email from a
  // form anyone can fill in with it. The asset link is still returned to the
  // browser, so a real visitor loses nothing.
  if (await isSuppressed(email).catch(() => null)) return { accessUrl, result, emailed };
  try {
    const loc = await localizeContent(`acquire:magnet:${magnet.id}`, magnet.language, content, locale, "queue");
    const localResult = result && loc.content.questions.length ? scoreQuiz(loc.content, input.answers ?? []) : result;
    const item = magnet.productKey ? await getCatalogItem(magnet.productKey) : null;
    const productUrl = item ? trackedProductUrl(item.url, campaign, "email") : null;
    await sendMagnetEmail({
      to: email,
      name,
      locale: loc.locale,
      title: magnet.title,
      content: loc.content,
      accessUrl,
      result: localResult,
      product: item && productUrl ? { title: item.title, url: productUrl } : null,
    });
    emailed = true;
    await prisma.acquireCapture.update({ where: { id: capture.id }, data: { emailSentAt: new Date() } });
  } catch (err) {
    console.error("[acquire] magnet email", err instanceof Error ? err.message : err);
  }
  return { accessUrl, result, emailed };
}
