"use client";

import { useEffect, useState } from "react";
import { ListChecks } from "lucide-react";
import { Button, Card, useToast } from "@/components/admin/ui";

// Lesson recaps (key takeaways and recall cards, lib/learn/recap): how many
// lessons have one, and a button that writes the missing ones now.
export default function RecapsCard() {
  const toast = useToast();
  const [s, setS] = useState<{ lessons: number; ready: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/learn/recaps", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setS(d))
      .catch(() => {});
  }, []);

  async function fill() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/learn/recaps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "fill" }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Something went wrong");
      setS({ lessons: d.lessons, ready: d.ready });
      toast.success(`${d.written} recaps written${d.remaining ? `, ${d.remaining} still to write (press again)` : ""}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const missing = s ? s.lessons - s.ready : 0;
  return (
    <Card
      title="Lesson recaps"
      icon={ListChecks}
      subtitle="Key takeaways at the end of each lesson and recall cards before each module quiz, written by AI from the lesson itself."
      action={
        <Button size="sm" variant={missing ? "primary" : "secondary"} loading={busy} disabled={!s || !missing} onClick={fill} data-testid="recaps-fill">
          {missing ? `Write ${Math.min(missing, 150)} missing` : "All written"}
        </Button>
      }
    >
      <p className="font-dm text-[13px] text-[var(--a-ink-2)]" data-testid="recaps-status">
        {s ? (
          <>
            <b>{s.ready}</b> of {s.lessons} lessons have a recap.{" "}
            {missing ? "About $0.003 each. The daily “recaps” job also fills them in." : "New and edited lessons are picked up by the daily “recaps” job."}
          </>
        ) : (
          "Loading…"
        )}
      </p>
    </Card>
  );
}
