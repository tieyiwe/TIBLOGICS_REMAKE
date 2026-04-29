import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Free AI Discovery Meeting",
  description:
    "Schedule a free 30-minute discovery meeting with TIBLOGICS. We'll assess your business needs and show you exactly how AI and automation can eliminate your biggest inefficiencies.",
  keywords: [
    "book AI consultation", "free AI discovery meeting", "AI strategy session",
    "TIBLOGICS booking", "AI implementation consultation", "book AI expert",
  ],
  alternates: { canonical: "https://tiblogics.com/book" },
  openGraph: {
    title: "Book a Free AI Discovery Meeting — TIBLOGICS",
    description: "30 minutes. No pitch. We listen to your challenges and tell you exactly what we'd recommend.",
    url: "https://tiblogics.com/book",
    type: "website",
    images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630, alt: "Book TIBLOGICS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Free AI Discovery Meeting — TIBLOGICS",
    description: "30 minutes. No pitch. We listen to your challenges and tell you exactly what we'd recommend.",
    creator: "@tiblogics",
    images: ["https://tiblogics.com/og-image.png"],
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <div className="pt-16 min-h-screen bg-[#F4F7FB]">{children}</div>;
}
