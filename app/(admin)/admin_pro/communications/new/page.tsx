import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/admin/ui";
import { requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { composerContext } from "../_components/context";
import { MessageComposer, type ComposerAudience } from "../_components/MessageComposer";

export const dynamic = "force-dynamic";

// The composer. Prefilled from the URL: ?to=<learner id> (one learner),
// ?ids=a,b,c (a selection from the Learners list), ?template=<id>.
export default async function NewMessagePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireLearnerPage("manage", "communications");
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const ctx = await composerContext(session.user.email);

  let audience: ComposerAudience | undefined;
  const to = one("to");
  const ids = one("ids").split(",").filter((x) => /^[\w-]{1,64}$/.test(x)).slice(0, 5000);
  if (/^[\w-]{1,64}$/.test(to)) {
    const s = await prisma.student.findUnique({ where: { id: to }, select: { id: true, name: true, email: true } });
    if (s) audience = { type: "one", studentId: s.id, label: `${s.name} <${s.email}>` };
  } else if (ids.length) {
    audience = { type: "ids", ids };
  }
  const template = one("template");

  return (
    <div>
      <PageHeader
        title="New message"
        subtitle="Write once. ARFA sends it in each learner's language when you add a French version, from arfa_edu@tiblogics.com."
        breadcrumb={[{ label: "Communications", href: "/admin_pro/communications" }, { label: "New message" }]}
      />
      <MessageComposer context={ctx} initial={{ audience, templateId: ctx.templates.some((t) => t.id === template) ? template : undefined }} />
    </div>
  );
}
