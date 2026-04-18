import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Services — Implementation, Automation & Consulting",
  description:
    "TIBLOGICS offers AI implementation, workflow automation, web development, cybersecurity, data analytics, mobile development, and AI training. Get started today.",
  keywords: [
    "AI implementation services", "workflow automation", "AI strategy consulting",
    "web development DC", "cybersecurity", "data analytics", "mobile development",
    "AI training", "AI academy", "IoT systems",
  ],
  alternates: { canonical: "https://tiblogics.com/services" },
  openGraph: {
    title: "AI Services — TIBLOGICS",
    description: "AI implementation, workflow automation, and full-stack digital services for ambitious businesses.",
    url: "https://tiblogics.com/services",
    type: "website",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
