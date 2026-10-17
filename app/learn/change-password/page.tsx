import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import { getStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("changePassword.metaTitle"), robots: { index: false } };
}

// After an admin set a temporary password (lib/learn/account-status/actions.ts),
// the member area sends the learner here until they choose their own.
export default async function ChangePasswordPage() {
  const student = await getStudent();
  if (!student) redirect("/learn/login?next=/learn/change-password");
  if (!student.mustChangePassword) redirect("/learn");
  const t = await getT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <ArfaWordmark size="md" academyLabel={t("learn.brand.academy")} />
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--s2)] text-[var(--ink)]" aria-hidden>
            <KeyRound size={22} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-[var(--ink)]">{t("changePassword.title")}</h1>
          <p className="mt-1 text-sm text-[var(--ink2)]">{t("changePassword.intro")}</p>
          <ChangePasswordForm email={student.email} />
        </div>
      </div>
    </div>
  );
}
