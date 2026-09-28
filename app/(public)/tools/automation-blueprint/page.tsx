import type { Metadata } from "next";
import { ClipboardList, Workflow, CalendarRange, BadgeDollarSign } from "lucide-react";
import { blueprintPrice, creditDays, formatMoney } from "@/lib/blueprint/config";
import BlueprintForm from "./BlueprintForm";

export const metadata: Metadata = {
  title: "Automation Blueprint: a written plan for automating your busywork",
  description:
    "Tell us about up to three repetitive processes. Get a written automation plan: what to automate first, with which tools, a week-by-week roadmap and the hours it frees up.",
  alternates: { canonical: "https://tiblogics.com/tools/automation-blueprint" },
};

export const dynamic = "force-dynamic";

const WHAT = [
  { icon: ClipboardList, title: "Where the time goes", body: "Each process mapped as it runs today, with the hours it takes calculated from your own numbers." },
  { icon: Workflow, title: "What to automate, and how", body: "Specific opportunities ranked by effort, built on the software you already pay for wherever possible." },
  { icon: CalendarRange, title: "A week-by-week roadmap", body: "Quick wins for this week, then a phased plan, the risks to watch and the numbers to track." },
  { icon: BadgeDollarSign, title: "Credited if we build it", body: "Hire TIBLOGICS to build any part of the plan and what you paid comes off the project." },
];

export default async function AutomationBlueprintPage({ searchParams }: { searchParams: Promise<{ paid?: string; canceled?: string }> }) {
  const sp = await searchParams;
  const price = blueprintPrice();

  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {sp.paid && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5 font-dm text-sm text-green-800">
            <strong>Payment received.</strong> We&apos;re writing your blueprint now. Your private link and credit code are
            on their way by email, and you&apos;ll get a second email when it&apos;s ready, usually within a few minutes.
          </div>
        )}
        {sp.canceled && (
          <div className="mb-8 rounded-2xl border border-[#D2DCE8] bg-white p-5 font-dm text-sm text-[#3A4A5C]">
            Checkout was canceled and you have not been charged.
          </div>
        )}

        <div className="max-w-3xl">
          <span className="section-tag">Automation Blueprint</span>
          <h1 className="font-syne font-extrabold text-4xl md:text-5xl text-[#0D1B2A] mt-2 leading-tight">
            A written plan for getting your team out of the busywork.
          </h1>
          <p className="font-dm text-[#3A4A5C] text-lg mt-4">
            Describe the repetitive work that eats your week. You get back a clear, specific plan for automating it:
            {price ? ` ${formatMoney(price)}, one time,` : ""} and credited against the build if you hire us to do it.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {WHAT.map((w) => (
            <div key={w.title} className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
              <w.icon size={20} className="text-[#B8500A]" />
              <h2 className="font-syne font-bold text-base text-[#0D1B2A] mt-3">{w.title}</h2>
              <p className="font-dm text-sm text-[#7A8FA6] mt-1 leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <BlueprintForm price={price ? formatMoney(price) : null} creditDays={creditDays()} />
        </div>
      </div>
    </div>
  );
}
