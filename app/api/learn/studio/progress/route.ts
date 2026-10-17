import { NextResponse } from "next/server";
import { requireEntitledStudent } from "@/lib/learn/session";
import { studioProgress } from "@/lib/learn/studio/progress";

// The learner's Studio progress, for tools embedded in lessons.
export async function GET() {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  return NextResponse.json({ progress: await studioProgress(student.id) });
}
