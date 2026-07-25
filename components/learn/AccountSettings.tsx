"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Accessibility mode (Part B rule 7) is a stored preference, not a cosmetic
// toggle — the exam engine reads it server-side to grant 1.5x time.
export default function AccountSettings({
  accessibilityMode,
  leaderboardOptIn,
}: {
  accessibilityMode: boolean;
  leaderboardOptIn: boolean;
}) {
  const router = useRouter();
  const [a11y, setA11y] = useState(accessibilityMode);
  const [board, setBoard] = useState(leaderboardOptIn);
  const [saved, setSaved] = useState("");

  async function save(patch: { accessibilityMode?: boolean; leaderboardOptIn?: boolean }) {
    setSaved("");
    const res = await fetch("/api/learn/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setSaved("Saved");
      router.refresh();
      setTimeout(() => setSaved(""), 2000);
    }
  }

  const Toggle = ({
    id,
    checked,
    onChange,
    title,
    description,
  }: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    title: string;
    description: string;
  }) => (
    <div className="flex items-start justify-between gap-5 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-[var(--ink)]">
          {title}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ink2)]">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--orange)]" : "bg-[var(--s3)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--ink)]">Preferences</h2>
        {saved && (
          <span role="status" className="text-xs font-semibold text-green-700">
            ✓ {saved}
          </span>
        )}
      </div>

      <div className="mt-2 divide-y divide-[var(--border)]">
        <Toggle
          id="a11y"
          checked={a11y}
          onChange={(v) => {
            setA11y(v);
            save({ accessibilityMode: v });
          }}
          title="Accessibility mode"
          description="Larger text, higher contrast, bigger tap targets, reduced motion — and 1.5× time on every timed exam. You can turn this on or off whenever you like; it applies to exams you start afterwards."
        />
        <Toggle
          id="board"
          checked={board}
          onChange={(v) => {
            setBoard(v);
            save({ leaderboardOptIn: v });
          }}
          title="Show me on the leaderboard"
          description="Off by default. Learning at your own pace shouldn't mean being ranked against strangers unless you want to be."
        />
      </div>
    </section>
  );
}
