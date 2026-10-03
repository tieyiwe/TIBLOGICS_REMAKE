"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { api, ghostBtn, primaryBtn } from "./client-utils";

/** Join (or leave) a cohort, then refresh the page's server data. */
export default function JoinCohortButton({
  cohortId,
  member,
  disabled,
  goTo,
}: {
  cohortId: string;
  member: boolean;
  disabled?: boolean;
  /** Where to go after joining (the cohort page); stays put if omitted. */
  goTo?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "join" | "leave") {
    if (action === "leave" && !confirm(t("community.cohort.leaveConfirm"))) return;
    setBusy(true);
    setError(null);
    const r = await api(`/api/learn/community/cohorts/${cohortId}`, "POST", { action });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (action === "join" && goTo) router.push(goTo);
    else router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      {member ? (
        <button type="button" onClick={() => act("leave")} disabled={busy} className={ghostBtn}>
          {t("community.cohort.leave")}
        </button>
      ) : (
        <button type="button" onClick={() => act("join")} disabled={busy || disabled} className={primaryBtn}>
          {t("community.cohort.join")}
        </button>
      )}
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
