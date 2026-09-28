"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";

export default function ToolkitWaitlist() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  async function join(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, product: "toolkit-live" }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setMsg(res?.ok ? t("tools.common.waitlistDone") : d.error ?? t("tools.common.error"));
  }
  return (
    <div className="mt-5 bg-white border border-[#D2DCE8] rounded-2xl p-5">
      <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{t("tools.tk.waitlist.title")}</p>
      {msg ? (
        <p className="font-dm text-sm text-[#3A4A5C] mt-2">{msg}</p>
      ) : (
        <form onSubmit={join} className="mt-2 flex flex-col sm:flex-row gap-2">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("tools.common.waitlistPlaceholder")} aria-label={t("tools.common.yourEmail")}
            className="flex-1 min-w-0 px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20" />
          <button type="submit" className="btn-primary justify-center">{t("tools.common.joinWaitlist")}</button>
        </form>
      )}
    </div>
  );
}
