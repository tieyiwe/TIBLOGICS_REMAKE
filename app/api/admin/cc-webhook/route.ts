import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { checkRateLimit, secretEquals } from "@/lib/require-admin";

async function getWebhookToken(): Promise<string | null> {
  const setting = await prisma.adminSettings.findUnique({ where: { key: "cc_webhook_token" } });
  return setting?.value ?? null;
}

function fuzzyMatchTask(tasks: { id: string; text: string; done: boolean }[], target: string): string | null {
  const t = target.toLowerCase();
  const match = tasks.find((task) => task.text.toLowerCase().includes(t) || t.includes(task.text.toLowerCase().slice(0, 10)));
  return match?.id ?? null;
}

export async function POST(req: NextRequest) {
  // The token is the only credential on this endpoint and it creates and edits
  // projects, so bound guessing and compare in constant time.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`cc-webhook:${ip}`, 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  const storedToken = await getWebhookToken();
  if (!secretEquals(token, storedToken ?? undefined)) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates = body.action === "batch" ? body.updates : [body];

    const results = [];

    for (const update of updates) {
      const project = await prisma.project.findFirst({
        where: { name: { contains: update.project, mode: "insensitive" } },
        // Only these three task columns are read (fuzzy match + task count), so
        // don't drag every task row's full body back for a webhook ping.
        include: { tasks: { select: { id: true, text: true, done: true } } },
      });

      if (update.action === "create" || (!project && update.action !== "create")) {
        if (update.action === "create") {
          const newProject = await prisma.project.create({
            data: {
              name: update.project,
              description: update.description,
              category: update.category ?? "INTERNAL",
              status: update.status ?? "ACTIVE",
              priority: update.priority ?? "MEDIUM",
              progress: update.progress ?? 0,
              revenueEarned: update.revenueEarned ?? 0,
              revenuePotential: update.revenuePotential ?? 0,
              monthlyRecurring: update.monthlyRecurring ?? 0,
              deadline: update.deadline ? new Date(update.deadline) : undefined,
              color: update.color ?? "#2251A3",
            },
          });
          // Both writes only need newProject.id, so neither waits on the other.
          await Promise.all([
            update.addTasks?.length
              ? prisma.projectTask.createMany({
                  data: update.addTasks.map((t: string, i: number) => ({
                    projectId: newProject.id, text: t, order: i,
                  })),
                })
              : Promise.resolve(),
            prisma.commandCenterSync.create({
              data: {
                projectId: newProject.id, projectName: update.project,
                action: "create", source: "webhook",
                changesDiff: { created: true },
                chatSummary: update.chatSummary,
              },
            }),
          ]);
          results.push({ project: update.project, action: "created" });
          continue;
        }
        results.push({ project: update.project, error: "Project not found" });
        continue;
      }

      if (!project) continue;

      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      const updateData: Record<string, unknown> = {};

      const fields = ["status","priority","progress","revenueEarned","revenuePotential","monthlyRecurring","deadline","color","description"];
      for (const f of fields) {
        if (update[f] !== undefined) {
          before[f] = (project as any)[f];
          after[f] = f === "deadline" ? new Date(update[f]) : update[f];
          updateData[f] = f === "deadline" ? new Date(update[f]) : update[f];
        }
      }

      if (update.action === "complete") { updateData.status = "COMPLETED"; updateData.completedAt = new Date(); }
      if (update.action === "archive") { updateData.archived = true; }

      // Append notes. Folded into the same row update below: the appended text
      // is built from the already-fetched project.notes, so issuing a second
      // UPDATE against the same row bought nothing. `notes` is not in `fields`,
      // so it can never clash with a caller-supplied value.
      if (update.notes) {
        const timestamp = new Date().toISOString().split("T")[0];
        const existingNotes = project.notes ?? "";
        updateData.notes = existingNotes
          ? `${existingNotes}\n\n[${timestamp}] ${update.notes}`
          : `[${timestamp}] ${update.notes}`;
      }

      // Nothing below reads anything the others write, so they go out together.
      const writes: Promise<unknown>[] = [];

      if (Object.keys(updateData).length) {
        writes.push(prisma.project.update({ where: { id: project.id }, data: updateData }));
      }

      // Add tasks. The project's tasks came back with it above, so the order
      // offset is already known — no COUNT round trip needed for it.
      if (update.addTasks?.length) {
        const count = project.tasks.length;
        writes.push(
          prisma.projectTask.createMany({
            data: update.addTasks.map((t: string, i: number) => ({
              projectId: project.id, text: t, order: count + i,
            })),
          }),
        );
        after.tasksAdded = update.addTasks.length;
      }

      // Complete tasks (fuzzy match). Every match gets the same `done: true`,
      // so one updateMany replaces one UPDATE per requested target.
      if (update.completeTasks?.length) {
        const taskIds = (update.completeTasks as string[])
          .map((target) => fuzzyMatchTask(project.tasks, target))
          .filter((id): id is string => id !== null);
        if (taskIds.length) {
          writes.push(
            prisma.projectTask.updateMany({ where: { id: { in: taskIds } }, data: { done: true } }),
          );
        }
      }

      await Promise.all(writes);

      await prisma.commandCenterSync.create({
        data: {
          projectId: project.id, projectName: project.name,
          action: update.action ?? "update", source: "webhook",
          changesDiff: { before, after } as Prisma.InputJsonValue,
          chatSummary: update.chatSummary,
        },
      });

      results.push({ project: project.name, changes: { before, after } });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("CC webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
