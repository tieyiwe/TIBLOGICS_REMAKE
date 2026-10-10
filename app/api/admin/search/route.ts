import { NextResponse, type NextRequest } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canSee } from "@/components/admin/shell/nav";
import { searchPm } from "@/lib/admin/command-center/pm";

// Global admin search for the command palette (Cmd/Ctrl+K).
//
// Returns the top matches across learners, leads, prospects, contacts
// (bookings and service requests), store orders and products, and blog posts.
// Each group is only queried when the viewer can see the page it links to,
// using the same permission map as the sidebar, so a collaborator never gets
// records from an area they cannot open. Every query is a bounded, indexed-ish
// ILIKE with LIMIT, run in parallel; a failing or missing table returns an
// empty group rather than an error.

export const dynamic = "force-dynamic";

const PER_GROUP = 5;

export type SearchHit = {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
};

async function safe<T>(label: string, p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    console.error(`[admin/search] ${label}`, err);
    return fallback;
  }
}

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export async function GET(req: NextRequest) {
  let session: Session | null = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.studentId || !(user.isOwner || user.isAdmin || user.collaboratorId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ q, hits: [] });

  const viewer = { isAdmin: !!user.isAdmin, permissions: (user.permissions as string[] | undefined) ?? [] };
  const see = (href: string) => canSee(href, viewer);
  const ci = { contains: q, mode: "insensitive" as const };
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const enc = encodeURIComponent(q);

  const jobs: Array<Promise<SearchHit[]>> = [];

  if (see("/admin_pro/learn/learners")) {
    jobs.push(
      safe(
        "learners",
        prisma.student
          .findMany({
            where: { OR: [{ name: ci }, { email: ci }] },
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `learner-${r.id}`,
              group: "Learners",
              title: r.name || r.email,
              subtitle: r.email,
              href: `/admin_pro/learn/learners/${r.id}`,
            })),
          ),
        [],
      ),
    );
  }

  if (see("/admin_pro/growth/leads")) {
    jobs.push(
      safe(
        "growth leads",
        (async () => {
          const [{ ok }] = await prisma.$queryRaw<Array<{ ok: boolean }>>`SELECT to_regclass('"GrowthLead"') IS NOT NULL AS ok`;
          if (!ok) return [];
          const rows = await prisma.$queryRaw<
            Array<{ id: string; companyName: string; contactName: string | null; email: string | null; stage: string }>
          >(Prisma.sql`
            SELECT "id", "companyName", "contactName", "email", "stage" FROM "GrowthLead"
            WHERE "companyName" ILIKE ${like} OR "contactName" ILIKE ${like} OR "email" ILIKE ${like} OR "domain" ILIKE ${like}
            ORDER BY "createdAt" DESC LIMIT ${PER_GROUP}`);
          return rows.map((r) => ({
            id: `glead-${r.id}`,
            group: "Leads",
            title: r.companyName,
            subtitle: [r.contactName, r.email].filter(Boolean).join(" · ") || "Growth lead",
            href: `/admin_pro/growth/leads?q=${enc}`,
            badge: r.stage,
          }));
        })(),
        [],
      ),
    );
  }

  if (see("/admin_pro/agents")) {
    jobs.push(
      safe(
        "agent leads",
        prisma.agentLead
          .findMany({
            where: { OR: [{ companyName: ci }, { contactName: ci }, { email: ci }] },
            select: { id: true, companyName: true, contactName: true, email: true, status: true },
            orderBy: { createdAt: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `alead-${r.id}`,
              group: "Leads",
              title: r.companyName,
              subtitle: [r.contactName, r.email].filter(Boolean).join(" · ") || "Agent lead",
              href: "/admin_pro/agents/rex",
              badge: String(r.status).toLowerCase(),
            })),
          ),
        [],
      ),
    );
  }

  if (see("/admin_pro/prospects")) {
    jobs.push(
      safe(
        "prospects",
        prisma.prospect
          .findMany({
            where: { OR: [{ name: ci }, { business: ci }, { email: ci }] },
            select: { id: true, name: true, business: true, email: true, status: true },
            orderBy: { createdAt: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `prospect-${r.id}`,
              group: "Prospects",
              title: r.business || r.name,
              subtitle: [r.name, r.email].filter(Boolean).join(" · "),
              href: `/admin_pro/prospects?q=${enc}`,
              badge: String(r.status).toLowerCase(),
            })),
          ),
        [],
      ),
    );
  }

  if (see("/admin_pro/appointments")) {
    jobs.push(
      safe(
        "appointments",
        prisma.appointment
          .findMany({
            where: { OR: [{ firstName: ci }, { lastName: ci }, { email: ci }, { company: ci }] },
            select: { id: true, firstName: true, lastName: true, email: true, date: true, timeSlot: true, status: true },
            orderBy: { date: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `appt-${r.id}`,
              group: "Contacts",
              title: `${r.firstName} ${r.lastName}`.trim(),
              subtitle: `Booking ${r.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} ${r.timeSlot} · ${r.email}`,
              href: "/admin_pro/appointments",
              badge: String(r.status).toLowerCase(),
            })),
          ),
        [],
      ),
    );
  }

  if (see("/admin_pro/service-requests")) {
    jobs.push(
      safe(
        "service requests",
        prisma.serviceRequest
          .findMany({
            where: { OR: [{ firstName: ci }, { lastName: ci }, { email: ci }, { company: ci }] },
            select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true },
            orderBy: { createdAt: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `sr-${r.id}`,
              group: "Contacts",
              title: `${r.firstName} ${r.lastName}`.trim(),
              subtitle: `Service request · ${[r.company, r.email].filter(Boolean).join(" · ")}`,
              href: "/admin_pro/service-requests",
              badge: String(r.status).toLowerCase(),
            })),
          ),
        [],
      ),
    );
  }

  if (see("/admin_pro/shop")) {
    jobs.push(
      safe(
        "orders",
        prisma.order
          .findMany({
            where: { OR: [{ orderNumber: ci }, { email: ci }] },
            select: { id: true, orderNumber: true, email: true, total: true, status: true },
            orderBy: { createdAt: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `order-${r.id}`,
              group: "Orders",
              title: `Order ${r.orderNumber}`,
              subtitle: `${r.email} · ${money(r.total)}`,
              href: "/admin_pro/shop",
              badge: r.status,
            })),
          ),
        [],
      ),
      safe(
        "products",
        prisma.product
          .findMany({
            where: { OR: [{ name: ci }, { slug: ci }] },
            select: { id: true, name: true, slug: true, published: true },
            orderBy: { createdAt: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `product-${r.id}`,
              group: "Products",
              title: r.name,
              subtitle: `/${r.slug}`,
              href: "/admin_pro/shop",
              badge: r.published ? "published" : "draft",
            })),
          ),
        [],
      ),
    );
  }

  if (see("/admin_pro/blog")) {
    jobs.push(
      safe(
        "blog",
        prisma.blogPost
          .findMany({
            where: { OR: [{ title: ci }, { slug: ci }] },
            select: { id: true, title: true, slug: true, published: true },
            orderBy: { createdAt: "desc" },
            take: PER_GROUP,
          })
          .then((rows) =>
            rows.map((r) => ({
              id: `post-${r.id}`,
              group: "Blog posts",
              title: r.title,
              subtitle: `/ai-times/${r.slug}`,
              href: "/admin_pro/blog",
              badge: r.published ? "published" : "draft",
            })),
          ),
        [],
      ),
    );
  }

  if (see("/admin_pro/command-center")) {
    jobs.push(
      safe(
        "command center",
        searchPm(q, PER_GROUP).then((rows) =>
          rows.map((r) => ({
            id: `pm-${r.kind}-${r.id}`,
            group: r.kind === "project" ? "Projects" : r.kind === "task" ? "Tasks" : "Notes",
            title: r.title,
            subtitle: r.subtitle,
            href: r.href,
          })),
        ),
        [],
      ),
    );
  }

  const hits = (await Promise.all(jobs)).flat();
  return NextResponse.json({ q, hits }, { headers: { "Cache-Control": "no-store" } });
}
