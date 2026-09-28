"use client";

import { useState } from "react";
import WhereToStart from "@/components/learn/WhereToStart";
import CertificationLadder, { type LadderTrack } from "@/components/learn/CertificationLadder";
import type { CatalogTrack } from "@/lib/learn/catalog";

/**
 * The "find my level" questions and the ladder they point at, together. The
 * recommendation highlights a level on the ladder rather than reordering a
 * list, so the path still reads Basic → Intermediate → Expert.
 */
export default function LevelPicker({
  catalog,
  ladder,
}: {
  catalog: CatalogTrack[];
  ladder: LadderTrack[];
}) {
  const [recommended, setRecommended] = useState<string | null>(null);
  return (
    <div className="space-y-8">
      <WhereToStart tracks={catalog} onRecommend={setRecommended} />
      <CertificationLadder mode="public" tracks={ladder} highlight={recommended} />
    </div>
  );
}
