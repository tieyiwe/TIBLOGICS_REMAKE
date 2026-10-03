import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getToolkitAccess, runsUsed } from "@/lib/toolkit/access";
import { toolkitPlans, type ToolkitPlan } from "@/lib/toolkit/config";
import { LIBRARY_VERTICALS } from "@/lib/toolkit/library";
import { VERTICAL_LABELS } from "@/lib/toolkit/guard/rules";
import { industryKey } from "@/lib/toolkit/labels";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizedLibrary } from "@/lib/i18n/sources/toolkit";
import ToolkitWorkspace, { type IndexEntry, type HistoryItem } from "./ToolkitWorkspace";
import ToolkitSubscribe from "./ToolkitSubscribe";

export const metadata: Metadata = {
  title: "Toolkit Live",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ToolkitPage({ searchParams }: { searchParams: Promise<{ plan?: string; welcome?: string }> }) {
  const sp = await searchParams;
  const planParam = sp.plan === "guard" || sp.plan === "toolkit" ? (sp.plan as ToolkitPlan) : undefined;

  const access = await getToolkitAccess();
  if (!access) {
    redirect(`/learn/login?next=${encodeURIComponent(`/toolkit${planParam ? `?plan=${planParam}` : ""}`)}`);
  }

  const plans = toolkitPlans();

  if (!access.plan) {
    return (
      <ToolkitSubscribe
        email={access.student.email}
        preselect={planParam ?? "toolkit"}
        pastStatus={access.status}
        hasBilling={access.hasBilling}
        welcome={!!sp.welcome}
        plans={(["toolkit", "guard"] as const).map((id) => ({
          id, name: plans[id].name, blurb: plans[id].blurb, amount: plans[id].amount, monthlyRuns: plans[id].monthlyRuns,
        }))}
      />
    );
  }

  const locale = await getLocale();
  const t = translatorFor(locale);

  const [profile, used, runs, library] = await Promise.all([
    prisma.toolkitProfile.findUnique({ where: { studentId: access.student.id } }),
    runsUsed(access.student.id),
    prisma.toolkitRun.findMany({
      where: { studentId: access.student.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, createdAt: true, kind: true, promptId: true, title: true, input: true, output: true, findings: true },
    }),
    // Prompt titles in the visitor's language; categories not translated yet stay English.
    access.plan.generate ? localizedLibrary(locale) : null,
  ]);

  // Titles, categories and field names only. A prompt's full text is fetched
  // from the subscriber API when it is opened.
  const index: IndexEntry[] = access.plan.generate && library
    ? library.prompts.map((p) => ({ id: p.id, vertical: p.vertical, category: p.category, title: p.title, useWhen: p.useWhen }))
    : [];

  // History is stored in English: "Deep check · Real estate" for checks, the
  // prompt title for drafts. Show it in the visitor's language.
  const verticalByLabel = new Map(Object.entries(VERTICAL_LABELS).map(([id, label]) => [label, id]));
  const historyTitle = (r: (typeof runs)[number]): string => {
    if (r.kind === "generate") return (r.promptId && library?.byId.get(r.promptId)?.title) || r.title;
    const label = r.title.split(" · ")[1];
    const id = label ? verticalByLabel.get(label) : undefined;
    if (!id) return r.title;
    return t(r.kind === "deep-check" ? "toolkit.history.deepCheck" : "toolkit.history.check", { industry: t(industryKey(id)) });
  };

  const history: HistoryItem[] = runs.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    kind: r.kind,
    title: historyTitle(r),
    text: r.kind === "generate" ? r.output : r.input,
    findings: Array.isArray(r.findings) ? (r.findings as unknown as HistoryItem["findings"]) : [],
  }));

  return (
    <ToolkitWorkspace
      email={access.student.email}
      plan={{ id: access.plan.id, name: access.plan.name, generate: access.plan.generate, monthlyRuns: access.plan.monthlyRuns }}
      status={access.status!}
      cancelAtPeriodEnd={access.cancelAtPeriodEnd}
      currentPeriodEnd={access.currentPeriodEnd?.toISOString() ?? null}
      hasBilling={access.hasBilling}
      runsUsed={used}
      welcome={!!sp.welcome}
      verticals={LIBRARY_VERTICALS}
      index={index}
      indexPending={!!library?.pending && access.plan.generate}
      history={history}
      profile={{
        businessName: profile?.businessName ?? "",
        vertical: profile?.vertical ?? "general",
        location: profile?.location ?? "",
        audience: profile?.audience ?? "",
        offer: profile?.offer ?? "",
        voice: profile?.voice ?? "",
        differentiators: profile?.differentiators ?? "",
        compliance: profile?.compliance ?? "",
      }}
    />
  );
}
