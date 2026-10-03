"use client";

import Link from "next/link";
import { Mail, Clock, MessageSquare, Handshake, Building2, User, Phone, Globe, MapPin, FileText } from "lucide-react";
import { useState } from "react";
import OpenTiboButton from "@/components/public/OpenTiboButton";
import { useT } from "@/lib/i18n/client";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PartnershipModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [form, setForm] = useState({
    businessName: "", contactName: "", email: "", phone: "",
    website: "", address: "", description: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  }

  // Our own messages rather than the browser's built-in bubbles, which come
  // in the browser's language rather than the one the visitor chose here.
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.businessName.trim()) e.businessName = t("pages.contact.partner.err.businessName");
    if (!form.contactName.trim()) e.contactName = t("pages.contact.partner.err.contactName");
    if (!EMAIL_RE.test(form.email.trim())) e.email = t("pages.contact.partner.err.email");
    if (!form.phone.trim()) e.phone = t("pages.contact.partner.err.phone");
    if (!form.description.trim()) e.description = t("pages.contact.partner.err.description");
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(typeof data?.error === "string" ? data.error : "");
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const labelCls = "font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5";
  const inputCls = (err?: string) =>
    `w-full px-4 py-3 border ${err ? "border-red-400" : "border-[#D2DCE8]"} rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]`;
  const fieldError = (k: string) =>
    fieldErrors[k] ? <p id={`pf-${k}-err`} className="text-xs text-red-500 font-dm mt-1">{fieldErrors[k]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {status === "done" ? (
          <div className="flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <Handshake size={28} className="text-green-600" />
            </div>
            <h3 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mb-3">{t("pages.contact.partner.done.title")}</h3>
            <p
              className="font-dm text-[#3A4A5C] leading-relaxed max-w-sm"
              dangerouslySetInnerHTML={{ __html: t("pages.contact.partner.done.body", { name: escapeHtml(form.businessName) }) }}
            />
            <p className="font-dm text-sm text-[#7A8FA6] mt-3">{t("pages.contact.partner.done.note")}</p>
            <button onClick={onClose} className="mt-8 btn-primary px-8 py-3">{t("pages.contact.partner.close")}</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-[#1B3A6B] rounded-t-3xl px-6 sm:px-8 py-7">
              <button onClick={onClose} aria-label={t("pages.contact.partner.close")} className="absolute top-5 right-6 text-white/50 hover:text-white text-2xl leading-none transition-colors">✕</button>
              <div className="flex items-center gap-3 mb-1 pr-8">
                <div className="w-10 h-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center">
                  <Handshake size={18} className="text-white" />
                </div>
                <h2 className="font-syne font-extrabold text-xl sm:text-2xl text-white">{t("pages.contact.partner.title")}</h2>
              </div>
              <p className="font-dm text-white/60 text-sm mt-1">
                {t("pages.contact.partner.intro")}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={submit} noValidate className="px-6 sm:px-8 py-7 space-y-5">
              {/* Business name + Contact name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pf-businessName" className={labelCls}>
                    <Building2 size={11} className="inline mr-1" />{t("pages.contact.partner.businessName")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="pf-businessName"
                    required
                    aria-invalid={!!fieldErrors.businessName}
                    aria-describedby={fieldErrors.businessName ? "pf-businessName-err" : undefined}
                    value={form.businessName}
                    onChange={e => set("businessName", e.target.value)}
                    placeholder={t("pages.contact.partner.businessNamePh")}
                    className={inputCls(fieldErrors.businessName)}
                  />
                  {fieldError("businessName")}
                </div>
                <div>
                  <label htmlFor="pf-contactName" className={labelCls}>
                    <User size={11} className="inline mr-1" />{t("pages.contact.partner.contactName")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="pf-contactName"
                    required
                    aria-invalid={!!fieldErrors.contactName}
                    aria-describedby={fieldErrors.contactName ? "pf-contactName-err" : undefined}
                    value={form.contactName}
                    onChange={e => set("contactName", e.target.value)}
                    placeholder={t("pages.contact.partner.contactNamePh")}
                    className={inputCls(fieldErrors.contactName)}
                  />
                  {fieldError("contactName")}
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pf-email" className={labelCls}>
                    <Mail size={11} className="inline mr-1" />{t("pages.contact.partner.email")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="pf-email"
                    required type="email"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? "pf-email-err" : undefined}
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                    placeholder={t("pages.contact.partner.emailPh")}
                    className={inputCls(fieldErrors.email)}
                  />
                  {fieldError("email")}
                </div>
                <div>
                  <label htmlFor="pf-phone" className={labelCls}>
                    <Phone size={11} className="inline mr-1" />{t("pages.contact.partner.phone")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="pf-phone"
                    required type="tel"
                    aria-invalid={!!fieldErrors.phone}
                    aria-describedby={fieldErrors.phone ? "pf-phone-err" : undefined}
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                    placeholder={t("pages.contact.partner.phonePh")}
                    className={inputCls(fieldErrors.phone)}
                  />
                  {fieldError("phone")}
                </div>
              </div>

              {/* Website + Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pf-website" className={labelCls}>
                    <Globe size={11} className="inline mr-1" />{t("pages.contact.partner.website")}
                    <span className="ml-1 text-[#7A8FA6] font-normal normal-case">{t("pages.contact.partner.optional")}</span>
                  </label>
                  <input
                    id="pf-website"
                    value={form.website}
                    onChange={e => set("website", e.target.value)}
                    placeholder="https://acmecorp.com"
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label htmlFor="pf-address" className={labelCls}>
                    <MapPin size={11} className="inline mr-1" />{t("pages.contact.partner.address")}
                    <span className="ml-1 text-[#7A8FA6] font-normal normal-case">{t("pages.contact.partner.optional")}</span>
                  </label>
                  <input
                    id="pf-address"
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                    placeholder={t("pages.contact.partner.addressPh")}
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="pf-description" className={labelCls}>
                  <FileText size={11} className="inline mr-1" />{t("pages.contact.partner.description")} <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="pf-description"
                  required
                  rows={5}
                  aria-invalid={!!fieldErrors.description}
                  aria-describedby={fieldErrors.description ? "pf-description-err" : undefined}
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder={t("pages.contact.partner.descriptionPh")}
                  className={`${inputCls(fieldErrors.description)} resize-none`}
                />
                {fieldError("description")}
              </div>

              {status === "error" && (
                <p role="alert" className="text-red-500 text-sm font-dm">{errorMsg || t("pages.contact.partner.error")}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="font-dm text-xs text-[#7A8FA6]"><span className="text-red-400">*</span> {t("pages.contact.partner.required")}</p>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-primary px-8 py-3 text-sm disabled:opacity-60"
                >
                  {status === "loading" ? t("pages.contact.partner.submitting") : t("pages.contact.partner.submit")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const t = useT();
  const [showPartnership, setShowPartnership] = useState(false);

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      {showPartnership && <PartnershipModal onClose={() => setShowPartnership(false)} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">{t("pages.contact.tag")}</span>
          <h1 className="font-syne font-extrabold text-4xl text-[#0D1B2A] mt-2">{t("pages.contact.title")}</h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3">{t("pages.contact.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-5">
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center shrink-0">
                <Mail size={18} className="text-[#2251A3]" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("pages.contact.email.title")}</p>
                <a href="mailto:ai@tiblogics.com" className="font-dm text-[#F47C20] text-sm hover:underline">ai@tiblogics.com</a>
                <p className="font-dm text-xs text-[#7A8FA6] mt-1">{t("pages.contact.email.note")}</p>
              </div>
            </div>

            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center shrink-0">
                <Clock size={18} className="text-[#2251A3]" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("pages.contact.response.title")}</p>
                <p className="font-dm text-[#3A4A5C] text-sm">{t("pages.contact.response.value")}</p>
                <p className="font-dm text-xs text-[#7A8FA6] mt-1">{t("pages.contact.response.hours")}</p>
              </div>
            </div>

            <div className="bg-[#1B3A6B] rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-white" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-white">{t("pages.contact.echelon.title")}</p>
                <p className="font-dm text-white/60 text-xs mt-1 mb-3">{t("pages.contact.echelon.body")}</p>
                <OpenTiboButton className="bg-[#F47C20] hover:bg-[#E05F00] text-white text-xs font-dm font-semibold px-3 py-1.5 rounded-lg inline-block transition-colors">
                  {t("pages.contact.echelon.button")}
                </OpenTiboButton>
              </div>
            </div>
          </div>

          {/* Quick contact options */}
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
            <h2 className="font-syne font-bold text-base text-[#0D1B2A] mb-5">{t("pages.contact.quick.title")}</h2>
            <div className="space-y-3">
              <Link href="/book" className="flex items-center justify-between gap-3 p-4 border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all group">
                <div>
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("pages.contact.quick.discovery")}</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">{t("pages.contact.quick.discoveryNote")}</p>
                </div>
                <span className="text-[#F47C20] shrink-0 font-syne font-bold text-sm">{t("pages.contact.quick.free")}</span>
              </Link>
              <Link href="/book" className="flex items-center justify-between gap-3 p-4 border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all">
                <div>
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("pages.contact.quick.strategy")}</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">{t("pages.contact.quick.strategyNote")}</p>
                </div>
                <span className="text-[#2251A3] shrink-0 font-syne font-bold text-sm">{t("pages.contact.quick.book")}</span>
              </Link>
              <Link href="/tools/scanner" className="flex items-center justify-between gap-3 p-4 border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all">
                <div>
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("pages.contact.quick.scan")}</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">{t("pages.contact.quick.scanNote")}</p>
                </div>
                <span className="text-green-600 shrink-0 font-syne font-bold text-sm">{t("pages.contact.quick.free")}</span>
              </Link>

              {/* Partnership bucket */}
              <button
                onClick={() => setShowPartnership(true)}
                className="w-full flex items-center justify-between gap-3 p-4 border-2 border-[#1B3A6B]/20 bg-[#EBF0FA]/50 rounded-xl hover:border-[#1B3A6B] hover:bg-[#EBF0FA] transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1B3A6B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#1B3A6B]/20 transition-colors">
                    <Handshake size={15} className="text-[#1B3A6B]" />
                  </div>
                  <div>
                    <p className="font-syne font-bold text-sm text-[#0D1B2A]">{t("pages.contact.quick.partnership")}</p>
                    <p className="font-dm text-xs text-[#7A8FA6]">{t("pages.contact.quick.partnershipNote")}</p>
                  </div>
                </div>
                <span className="text-[#1B3A6B] shrink-0 font-syne font-bold text-sm">{t("pages.contact.quick.apply")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
