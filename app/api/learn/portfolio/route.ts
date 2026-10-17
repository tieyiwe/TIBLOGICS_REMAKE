import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireEntitledStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { ensureMethodTables } from "@/lib/learn/method/db";
import { PORTFOLIO_SECTIONS, getPortfolioSettings, newSlug } from "@/lib/learn/method/portfolio";
import { getT } from "@/lib/i18n/server";
import { isMinorStudent } from "@/lib/learn/youth-account";

// Sharing settings for the signed-in learner's portfolio. Always keyed on the
// session's student id: nobody can change another learner's settings.
const Body = z.object({
  isPublic: z.boolean(),
  includeWork: z.boolean(),
  hidden: z.array(z.enum(PORTFOLIO_SECTIONS)).max(PORTFOLIO_SECTIONS.length),
  /** Issue a new link; the old one stops working. */
  newLink: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`portfolio:${student.id}`, 40, 3_600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const { includeWork, hidden, newLink } = parsed.data;
  // Learners under 18: the portfolio stays private (AI-Empowered Youth).
  const minor = await isMinorStudent(student.id);
  if (minor && parsed.data.isPublic) {
    return NextResponse.json({ error: t("learn.youth.portfolioPrivate"), code: "minor" }, { status: 403 });
  }
  const isPublic = parsed.data.isPublic && !minor;

  try {
    await ensureMethodTables();
    const current = await getPortfolioSettings(student.id);
    const data = { isPublic, includeWork, hidden: [...new Set(hidden)] };
    // A slug collision is practically impossible (72 random bits); retry once anyway.
    for (let i = 0; i < 2; i++) {
      try {
        const slug = !current.slug || newLink ? newSlug() : current.slug;
        const row = await prisma.portfolioSettings.upsert({
          where: { studentId: student.id },
          create: { studentId: student.id, slug, ...data },
          update: { slug, ...data },
        });
        return NextResponse.json({
          ok: true,
          settings: { isPublic: row.isPublic, slug: row.slug, includeWork: row.includeWork, hidden: row.hidden },
        });
      } catch (err) {
        if (i === 1) throw err;
      }
    }
    return NextResponse.json({ error: t("learn.api.saveFailed") }, { status: 500 });
  } catch (err) {
    console.error("[PUT /api/learn/portfolio]", err);
    return NextResponse.json({ error: t("learn.api.saveFailed") }, { status: 500 });
  }
}
