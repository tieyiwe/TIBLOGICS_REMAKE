"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

/** The AI Times newsletter signup in the footer (/api/newsletter/subscribe). */
export default function FooterNewsletter() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  if (state === "done") return <p className="mt-5 text-sm font-dm text-[#F9A738]" role="status">{t("site.newsSignup.done")}</p>;
  return (
    <form
      id="newsletter-signup"
      className="mt-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        setMsg("");
        try {
          const res = await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), source: "footer" }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : t("site.newsSignup.error"));
          setState("done");
        } catch (err) {
          setMsg(err instanceof Error ? err.message : t("site.newsSignup.error"));
          setState("error");
        }
      }}
    >
      <label htmlFor="footer-newsletter-email" className="block text-xs font-dm font-semibold uppercase tracking-wider text-[#E8EFF8]">
        {t("site.newsSignup.title")}
      </label>
      <div className="mt-2 flex max-w-sm gap-2">
        <input
          id="footer-newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("site.newsSignup.placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-dm text-white placeholder:text-white/50 focus:border-[#F9A738] focus:outline-none"
        />
        <button type="submit" disabled={state === "busy"} className="rounded-lg bg-[#F47C20] px-3 py-2 text-sm font-dm font-semibold text-white hover:bg-[#F9A738] disabled:opacity-60">
          {t("site.newsSignup.cta")}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs font-dm text-red-200" role="alert">{msg}</p>}
    </form>
  );
}
