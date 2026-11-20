"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** While the blueprint is being written: refresh until it's ready; offer a retry if it failed. */
export default function BlueprintStatus({ token, status, canRetry }: { token: string; status: string; canRetry: boolean }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === "failed") return;
    const t = setInterval(() => router.refresh(), 6000);
    return () => clearInterval(t);
  }, [status, router]);

  async function retry() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/blueprint/${token}/retry`, { method: "POST" }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (res?.ok || res?.status === 202) router.refresh();
    else setMsg(d.error ?? t("tools.bpv.retryFailed"));
  }

  if (status === "failed") {
    return (
      <div className="bg-white border border-amber-200 rounded-2xl p-6 font-dm text-sm text-[#3A4A5C]">
        <p className="font-semibold text-[#0D1B2A]">{t("tools.bpv.failedTitle")}</p>
        <p className="mt-1">
          {canRetry ? t("tools.bpv.retryHint") : t("tools.bpv.notified")}
        </p>
        {canRetry && (
          <button onClick={retry} disabled={busy} className="btn-primary mt-4 disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} {busy ? t("tools.bpv.writing") : t("tools.bpv.tryAgain")}
          </button>
        )}
        {msg && <p role="alert" className="mt-3 text-red-600">{msg}</p>}
      </div>
    );
  }
  return (
    <div className="bg-white border border-[#D2DCE8] rounded-2xl p-8 text-center font-dm text-sm text-[#3A4A5C]">
      <Loader2 size={22} className="animate-spin inline text-[#B8500A]" aria-hidden />
      <p className="mt-3 font-semibold text-[#0D1B2A]">{t("tools.bpv.writingTitle")}</p>
      <p className="mt-1">{t("tools.bpv.writingBody")}</p>
    </div>
  );
}
