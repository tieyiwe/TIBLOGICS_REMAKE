import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  const storedToken = await getWebhookToken();
  if (!storedToken || token !== storedToken) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates = body.action === "batch" ? body.updates : [body];

    const results = [];

    for (const update of updates) {
      const project = await prisma.project.findFirst({
        where: { name: { contains: update.project, mode: "insensitive" } },
        include: { tasks: true },
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
          if (update.addTasks?.length) {
            await prisma.projectTask.createMany({
              data: update.addTasks.map((t: string, i: number) => ({
                projectId: newProject.id, text: t, order: i,
              })),
            });
          }
          await prisma.commandCenterSync.create({
            data: {
              projectId: newProject.id, projectName: update.project,
              action: "create", source: "webhook",
              changesDiff: { created: true },
              chatSummary: update.chatSummary,
            },
          });
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

      if (Object.keys(updateData).length) {
        await prisma.project.update({ where: { id: project.id }, data: updateData });
      }

      // Add tasks
      if (update.addTasks?.length) {
        const count = await prisma.projectTask.count({ where: { projectId: project.id } });
        await prisma.projectTask.createMany({
          data: update.addTasks.map((t: string, i: number) => ({
            projectId: project.id, text: t, order: count + i,
          })),
        });
        after.tasksAdded = update.addTasks.length;
      }

      // Complete tasks (fuzzy match)
      if (update.completeTasks?.length) {
        for (const target of update.completeTasks) {
          const taskId = fuzzyMatchTask(project.tasks, target);
          if (taskId) await prisma.projectTask.update({ where: { id: taskId }, data: { done: true } });
        }
      }

      // Append notes
      if (update.notes) {
        const timestamp = new Date().toISOString().split("T")[0];
        const existingNotes = project.notes ?? "";
        await prisma.project.update({
          where: { id: project.id },
          data: { notes: existingNotes ? `${existingNotes}\n\n[${timestamp}] ${update.notes}` : `[${timestamp}] ${update.notes}` },
        });
      }

      await prisma.commandCenterSync.create({
        data: {
          projectId: project.id, projectName: project.name,
          action: update.action ?? "update", source: "webhook",
          changesDiff: { before, after },
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
