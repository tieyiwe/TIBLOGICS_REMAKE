import Link from "next/link";
import { Mail, MapPin, Clock, MessageSquare } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="section-tag">Contact</span>
          <h1 className="font-syne font-extrabold text-4xl text-[#0D1B2A] mt-2">Let's talk.</h1>
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
                <MapPin size={18} className="text-[#2251A3]" />
              </div>
              <div>
                <p className="font-syne font-bold text-sm text-[#0D1B2A]">Location</p>
                <p className="font-dm text-[#3A4A5C] text-sm">Wheaton, Maryland</p>
                <p className="font-dm text-xs text-[#7A8FA6] mt-1">Washington D.C. Metro Area · Remote-first</p>
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
                <p className="font-syne font-bold text-sm text-white">Talk to TIBS Now</p>
                <p className="font-dm text-white/60 text-xs mt-1 mb-3">Chat with our AI advisor instantly — no wait time.</p>
                <Link href="/tools/advisor" className="bg-[#F47C20] hover:bg-[#E05F00] text-white text-xs font-dm font-semibold px-3 py-1.5 rounded-lg inline-block transition-colors">
                  Open TIBS →
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
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">Book a Free Discovery Call</p>
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
              <a href="mailto:ai@tiblogics.com?subject=Partnership%20Inquiry" className="flex items-center justify-between p-4 border border-[#D2DCE8] rounded-xl hover:border-[#2251A3] hover:bg-[#EBF0FA] transition-all">
                <div>
                  <p className="font-syne font-bold text-sm text-[#0D1B2A]">Partnership Inquiry</p>
                  <p className="font-dm text-xs text-[#7A8FA6]">B2B, referrals, Africa partnerships</p>
                </div>
                <span className="text-[#7A8FA6] font-syne font-bold text-sm">Email →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
