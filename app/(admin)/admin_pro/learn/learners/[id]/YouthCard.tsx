"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Users } from "lucide-react";
import { Badge, Button, Card, useToast, type BadgeTone } from "@/components/admin/ui";
import { postJson } from "../_components/fields";
import { day } from "../_components/format";

// AI-Empowered Youth on the learner profile: age band, parent and consent,
// with "Resend parent email" (learners:manage, checked on the server).

const BAND: Record<string, string> = { explorer: "Explorer (10 to 13)", builder: "Builder (14 to 17)", adult: "Adult" };
const CONSENT: Record<string, { label: string; tone: BadgeTone }> = {
  granted: { label: "Parent confirmed", tone: "success" },
  pending: { label: "Waiting for parent", tone: "warn" },
  revoked: { label: "Parent revoked access", tone: "danger" },
  not_needed: { label: "Parent informed (13+)", tone: "info" },
  none: { label: "No parent yet", tone: "neutral" },
};

export function YouthCard({
  learnerId,
  canManage,
  info,
}: {
  learnerId: string;
  canManage: boolean;
  info: { band: string; consent: string; birthYear: number; parentEmail: string | null; parentEmailSentAt: string | null; deleteRequestedAt: string | null; boards: boolean };
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const c = CONSENT[info.consent] ?? { label: info.consent, tone: "neutral" as BadgeTone };

  async function resend() {
    setBusy(true);
    try {
      const r = await postJson<{ message: string }>(`/api/admin/learn/learners/${learnerId}/actions`, { action: "resendParentEmail" });
      toast.success(r.message);
      router.refresh();
    } catch (err) {
      toast.error("Could not send", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="AI-Empowered Youth" icon={Users}>
      <dl className="grid gap-4 font-dm text-[13.5px] sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="a-micro">Age band</dt>
          <dd className="mt-1">{BAND[info.band] ?? info.band} · born {info.birthYear}</dd>
        </div>
        <div>
          <dt className="a-micro">Parent consent</dt>
          <dd className="mt-1"><Badge tone={c.tone}>{c.label}</Badge></dd>
        </div>
        <div>
          <dt className="a-micro">Parent email</dt>
          <dd className="mt-1 break-all">{info.parentEmail ?? "None"}</dd>
        </div>
        <div>
          <dt className="a-micro">Last parent email</dt>
          <dd className="mt-1">{info.parentEmailSentAt ? day(info.parentEmailSentAt) : "Never"}</dd>
        </div>
        <div>
          <dt className="a-micro">Boards (parent)</dt>
          <dd className="mt-1">{info.boards ? "Allowed" : "Hidden"}</dd>
        </div>
        {info.deleteRequestedAt && (
          <div>
            <dt className="a-micro">Deletion</dt>
            <dd className="mt-1"><Badge tone="danger">Parent asked {day(info.deleteRequestedAt)}</Badge></dd>
          </div>
        )}
      </dl>
      {canManage && info.parentEmail && info.band !== "adult" && (
        <div className="mt-4">
          <Button variant="secondary" icon={Mail} onClick={resend} disabled={busy}>
            {busy ? "Sending…" : "Resend parent email"}
          </Button>
        </div>
      )}
    </Card>
  );
}
