import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/require-admin";
import { sendStudentWelcomeEmail } from "@/lib/learn/emails";

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`learn-signup:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const parsed = SignupSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.student.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Try signing in." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const student = await prisma.student.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });

    sendStudentWelcomeEmail({ email: student.email, name: student.name })
      .catch((err) => console.error("[learn/signup] welcome email", err));

    return NextResponse.json({ ok: true, student });
  } catch (err) {
    console.error("[POST /api/learn/auth/signup]", err);
    return NextResponse.json({ error: "Could not create account. Please try again." }, { status: 500 });
  }
}
