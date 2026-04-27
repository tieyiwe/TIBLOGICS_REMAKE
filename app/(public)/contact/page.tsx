"use client";

import Link from "next/link";
import { Mail, Clock, MessageSquare, Handshake, Building2, User, Phone, Globe, MapPin, FileText } from "lucide-react";
import { useState } from "react";

function PartnershipModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    businessName: "", contactName: "", email: "", phone: "",
    website: "", address: "", description: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/partnerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {status === "done" ? (
          <div className="flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
              <Handshake size={28} className="text-green-600" />
            </div>
            <h3 className="font-syne font-extrabold text-2xl text-[#0D1B2A] mb-3">Thank you for reaching out!</h3>
            <p className="font-dm text-[#3A4A5C] leading-relaxed max-w-sm">
              We've received your partnership interest and are excited to learn more about{" "}
              <strong>{form.businessName}</strong>. Our team will review your submission and reach out to you shortly.
            </p>
            <p className="font-dm text-sm text-[#7A8FA6] mt-3">We typically respond within 2–3 business days.</p>
            <button onClick={onClose} className="mt-8 btn-primary px-8 py-3">Close</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-[#1B3A6B] rounded-t-3xl px-8 py-7">
              <button onClick={onClose} className="absolute top-5 right-6 text-white/50 hover:text-white text-2xl leading-none transition-colors">✕</button>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Handshake size={18} className="text-white" />
                </div>
                <h2 className="font-syne font-extrabold text-2xl text-white">Business Partnership</h2>
              </div>
              <p className="font-dm text-white/60 text-sm mt-1">
                Tell us about your business and what kind of partnership you have in mind.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="px-8 py-7 space-y-5">
              {/* Business name + Contact name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5">
                    <Building2 size={11} className="inline mr-1" />Business Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.businessName}
                    onChange={e => set("businessName", e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-4 py-3 border border-[#D2DCE8] rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
                  />
                </div>
                <div>
                  <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5">
                    <User size={11} className="inline mr-1" />Your Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.contactName}
                    onChange={e => set("contactName", e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 border border-[#D2DCE8] rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5">
                    <Mail size={11} className="inline mr-1" />Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    required type="email"
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                    placeholder="jane@acmecorp.com"
                    className="w-full px-4 py-3 border border-[#D2DCE8] rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
                  />
                </div>
                <div>
                  <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5">
                    <Phone size={11} className="inline mr-1" />Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 border border-[#D2DCE8] rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
                  />
                </div>
              </div>

              {/* Website + Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5">
                    <Globe size={11} className="inline mr-1" />Website
                    <span className="ml-1 text-[#7A8FA6] font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    value={form.website}
                    onChange={e => set("website", e.target.value)}
                    placeholder="https://acmecorp.com"
                    className="w-full px-4 py-3 border border-[#D2DCE8] rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
                  />
                </div>
                <div>
                  <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5">
                    <MapPin size={11} className="inline mr-1" />Physical Address
                    <span className="ml-1 text-[#7A8FA6] font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                    placeholder="123 Main St, City, Country"
                    className="w-full px-4 py-3 border border-[#D2DCE8] rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide block mb-1.5">
                  <FileText size={11} className="inline mr-1" />About your business &amp; partnership interest <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Tell us what your business does, the problem you solve, and the type of partnership you're looking for (e.g. referral, white-label, co-development, distribution, etc.)"
                  className="w-full px-4 py-3 border border-[#D2DCE8] rounded-xl font-dm text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-red-500 text-sm font-dm">Something went wrong. Please try again.</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="font-dm text-xs text-[#7A8FA6]"><span className="text-red-400">*</span> Required fields</p>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-primary px-8 py-3 text-sm disabled:opacity-60"
                >
                  {status === "loading" ? "Submitting…" : "Submit Partnership Request →"}
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
  const [showPartnership, setShowPartnership] = useState(false);

  return (
    <div className="pt-24 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      {showPartnership && <PartnershipModal onClose={() => setShowPartnership(false)} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Contact</span>
          <h1 className="font-syne font-extrabold text-4xl text-[#0D1B2A] mt-2">Let&apos;s talk.</h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-3">Ready to start your AI project? Have a question? We respond within 24 hours.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-5">
            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center shrink-0">
                <Mail size={18} className="text-[#2251A3]" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-[#0D1B2A]">Email Us</p>
                <a href="mailto:ai@tiblogics.com" className="font-dm text-[#F47C20] text-sm hover:underline">ai@tiblogics.com</a>
                <p className="font-dm text-xs text-[#7A8FA6] mt-1">Best for project inquiries and partnerships</p>
              </div>
            </div>

            <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 bg-[#EBF0FA] rounded-xl flex items-center justify-center shrink-0">
                <Clock size={18} className="text-[#2251A3]" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-[#0D1B2A]">Response Time</p>
                <p className="font-dm text-[#3A4A5C] text-sm">Within 24 hours</p>
                <p className="font-dm text-xs text-[#7A8FA6] mt-1">Monday–Friday, 9 AM–6 PM ET</p>
              </div>
            </div>

            <div className="bg-[#1B3A6B] rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-white" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-white">Talk to Echelon Now</p>
                <p className="font-dm text-white/60 text-xs mt-1 mb-3">Chat with our AI specialist instantly — no wait time.</p>
                <Link href="/tools/advisor" className="bg-[#F47C20] hover:bg-[#E05F00] text-white text-xs font-dm font-semibold px-3 py-1.5 rounded-lg inline-block transition-colors">
                  Open Echelon →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick contact options */}
          <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6">
            <h2 className="font-syne font-bold text-base text-[#0D1B2A] mb-5">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/book" className="flex items-center justify-between p-4 border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all group">
                <div>
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">Book a Free Discovery Meeting</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">30 min · No commitment</p>
                </div>
                <span className="text-[#F47C20] font-syne font-bold text-sm">Free →</span>
              </Link>
              <Link href="/book" className="flex items-center justify-between p-4 border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all">
                <div>
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">AI Strategy Session</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">60 min · Personalized roadmap</p>
                </div>
                <span className="text-[#2251A3] font-syne font-bold text-sm">Book →</span>
              </Link>
              <Link href="/tools/scanner" className="flex items-center justify-between p-4 border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all">
                <div>
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">Scan Your Website</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">Free AI readiness report</p>
                </div>
                <span className="text-green-600 font-syne font-bold text-sm">Free →</span>
              </Link>

              {/* Partnership bucket */}
              <button
                onClick={() => setShowPartnership(true)}
                className="w-full flex items-center justify-between p-4 border-2 border-[#1B3A6B]/20 bg-[#EBF0FA]/50 rounded-xl hover:border-[#1B3A6B] hover:bg-[#EBF0FA] transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1B3A6B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#1B3A6B]/20 transition-colors">
                    <Handshake size={15} className="text-[#1B3A6B]" />
                  </div>
                  <div>
                    <p className="font-syne font-bold text-sm text-[#0D1B2A]">Business Partnership</p>
                    <p className="font-dm text-xs text-[#7A8FA6]">B2B, referrals, white-label, co-development</p>
                  </div>
                </div>
                <span className="text-[#1B3A6B] font-syne font-bold text-sm">Apply →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
