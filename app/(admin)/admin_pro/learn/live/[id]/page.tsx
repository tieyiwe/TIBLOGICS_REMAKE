import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../../_lib/admin-page-auth";
import { liveTablesReady } from "@/lib/learn/live/db";
import { attendees, getSession, staffQuestions } from "@/lib/learn/live/sessions";
import { zonedParts } from "@/lib/learn/live/admin-input";
import SessionForm from "../SessionForm";
import LiveManage from "./LiveManage";

export const dynamic = "force-dynamic";

export default async function LiveSessionAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!(await liveTablesReady())) notFound();
  const s = await getSession(id);
  if (!s) notFound();
  const [tracks, people, questions] = await Promise.all([
    prisma.learnTrack.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, title: true } }),
    attendees(id),
    staffQuestions(id),
  ]);
  const { date, time } = zonedParts(s.startsAt, s.timezone);
  const attended = people.filter((p) => p.joinedAt).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-[var(--ink3)]">
          <Link href="/admin_pro/learn" className="underline">
            Learn
          </Link>{" "}
          /{" "}
          <Link href="/admin_pro/learn/live" className="underline">
            Live sessions
          </Link>
        </p>
        <h1 className="text-xl font-black text-[var(--ink)]">{s.title}</h1>
        <p className="text-sm text-[var(--ink3)]">
          {s.going} / {s.capacity} seats · {s.waitlist} waiting · {attended} attended · learner page{" "}
          <Link href={`/learn/live/${s.id}`} className="underline">
            /learn/live/{s.id}
          </Link>
        </p>
      </header>
      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-[var(--ink)]">Settings</h2>
        <SessionForm
          tracks={tracks}
          sessionId={s.id}
          initial={{
            title: s.title,
            expertName: s.expertName,
            expertBio: s.expertBio ?? "",
            expertPhotoUrl: s.expertPhotoUrl ?? "",
            topic: s.topic ?? "",
            trackIds: s.trackIds,
            date,
            time,
            timezone: s.timezone,
            durationMinutes: s.durationMinutes,
            meetingUrl: s.meetingUrl ?? "",
            capacity: s.capacity,
            status: s.status,
            recordingUrl: s.recordingUrl ?? "",
            resources: s.resources,
          }}
        />
      </section>
      <LiveManage
        sessionId={s.id}
        questions={questions.map((q) => ({ ...q, answeredAt: q.answeredAt?.toISOString() ?? null, createdAt: q.createdAt.toISOString() }))}
        people={people.map((p) => ({
          studentId: p.studentId,
          name: p.name,
          email: p.email,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          joinedAt: p.joinedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
