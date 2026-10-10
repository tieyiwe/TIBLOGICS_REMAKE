import { z } from "zod";
import { BODY_MAX, SUBJECT_MAX } from "@/lib/learn/inbox/campaigns";

export const TemplateSchema = z.object({
  name: z.string().trim().min(1, "Name the template").max(120),
  kind: z.enum(["marketing", "service"]),
  subject: z.string().trim().min(1, "Write a subject").max(SUBJECT_MAX),
  body: z.string().trim().min(1, "Write a message").max(BODY_MAX),
  subjectFr: z.string().trim().max(SUBJECT_MAX).optional().nullable(),
  bodyFr: z.string().trim().max(BODY_MAX).optional().nullable(),
});
