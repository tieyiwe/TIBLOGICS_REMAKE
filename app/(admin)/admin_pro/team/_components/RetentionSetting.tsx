"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button, Card, Select, useToast } from "@/components/admin/ui";

const OPTIONS = [3, 6, 12, 18, 24, 36, 60];

/** How long staff activity and audit entries are kept. Owner only to change. */
export default function RetentionSetting({ months, canEdit }: { months: number; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(String(months));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/team/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionMonths: Number(value) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Not saved");
      toast.success("Retention saved");
      router.refresh();
    } catch (err) {
      toast.error("Not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Log retention" icon={Archive}>
      <p className="font-dm text-[13px] text-[var(--a-ink-3)]">
        Staff activity and audit entries older than this are deleted once a day. Nobody else can edit or delete them.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canEdit ? (
          <>
            <Select value={value} onChange={(e) => setValue(e.target.value)} label="Keep logs for">
              {[...new Set([...OPTIONS, months])].sort((a, b) => a - b).map((m) => (
                <option key={m} value={m}>
                  {m} months
                </option>
              ))}
            </Select>
            <Button variant="secondary" loading={busy} disabled={Number(value) === months} onClick={save}>
              Save
            </Button>
          </>
        ) : (
          <span className="font-dm text-[13.5px] font-semibold text-[var(--a-ink)]">Kept for {months} months (the owner sets this)</span>
        )}
      </div>
    </Card>
  );
}
