"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Zap,
  Brain,
  Globe,
  Shield,
  BarChart3,
  Smartphone,
  GraduationCap,
  Cpu,
  type LucideIcon,
} from "lucide-react";

interface Service {
  icon: LucideIcon;
  name: string;
  desc: string;
  iconBg: string;
  badge: string | null;
}

const services: Service[] = [
  // Group 1 — Core (iconBg: blue-light)
  {
    icon: Bot,
    name: "AI Implementation",
    desc: "Custom AI agents, LLM integration, and intelligent workflow systems built for your exact operations.",
    iconBg: "bg-[#EBF0FA]",
    badge: "Core",
  },
  {
    icon: Zap,
    name: "Workflow Automation",
    desc: "End-to-end process automation using n8n, Make, Zapier, and custom pipelines.",
    iconBg: "bg-[#EBF0FA]",
    badge: "Core",
  },
  {
    icon: Brain,
    name: "AI Strategy & Consulting",
    desc: "AI readiness audits, strategy sessions, and implementation roadmaps for forward-thinking leaders.",
    iconBg: "bg-[#EBF0FA]",
    badge: "Core",
  },
  // Group 2 (iconBg: orange-light)
  {
    icon: Globe,
    name: "Web & App Development",
    desc: "Next.js, React, and full-stack web applications with modern architecture.",
    iconBg: "bg-[#FEF0E3]",
    badge: null,
  },
  {
    icon: Shield,
    name: "Cybersecurity",
    desc: "Security audits, penetration testing, and hardened infrastructure for peace of mind.",
    iconBg: "bg-[#FEF0E3]",
    badge: null,
  },
  {
    icon: BarChart3,
    name: "Data Analytics",
    desc: "Business intelligence dashboards, data pipelines, and AI-powered insights.",
    iconBg: "bg-[#FEF0E3]",
    badge: null,
  },
  // Group 3 (iconBg: green-50)
  {
    icon: Smartphone,
    name: "Mobile Development",
    desc: "React Native cross-platform apps that deliver native-quality experiences.",
    iconBg: "bg-green-50",
    badge: null,
  },
  {
    icon: GraduationCap,
    name: "AI Training & Academy",
    desc: "90+ lessons, 3 courses, team workshops, and AI implementation training on Skool.",
    iconBg: "bg-green-50",
    badge: null,
  },
  {
    icon: Cpu,
    name: "System Design & IoT",
    desc: "Architecture design, IoT integrations, and complex multi-service systems.",
    iconBg: "bg-green-50",
    badge: null,
  },
];

export default function ServicesGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <span className="section-tag">Full-Spectrum Solutions</span>
          <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-[#0D1B2A] mt-2">
            AI-first. Tech-complete.
          </h2>
        </div>

        {/* 3×3 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.08 }}
                className="relative bg-white border border-[#D2DCE8] rounded-2xl p-6 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* "Core" badge — top-right */}
                {service.badge && (
                  <span className="absolute top-4 right-4 bg-[#FEF0E3] text-[#F47C20] text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full">
                    {service.badge}
                  </span>
                )}

                {/* Icon in 44px square */}
                <div
                  className={`w-11 h-11 rounded-xl ${service.iconBg} flex items-center justify-center mb-4`}
                >
                  <Icon size={22} className="text-[#1B3A6B]" />
                </div>

                {/* Title */}
                <h3 className="font-syne font-bold text-base text-[#0D1B2A]">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-1">
                  {service.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
