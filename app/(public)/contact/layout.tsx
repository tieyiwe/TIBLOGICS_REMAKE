import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact TIBLOGICS — Get in Touch",
  description:
    "Reach out to TIBLOGICS for AI implementation, automation, web development, or any digital solution inquiry. We respond fast.",
  keywords: [
    "contact TIBLOGICS", "AI agency contact", "get AI quote", "AI implementation inquiry",
    "hire AI agency", "AI consulting contact",
  ],
  alternates: { canonical: "https://tiblogics.com/contact" },
  openGraph: {
    title: "Contact TIBLOGICS",
    description: "Questions, project inquiries, or partnership opportunities — we're responsive and direct.",
    url: "https://tiblogics.com/contact",
    type: "website",
    images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630, alt: "Contact TIBLOGICS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact TIBLOGICS",
    description: "Questions, project inquiries, or partnership opportunities — we're responsive and direct.",
    creator: "@tiblogics",
    images: ["https://tiblogics.com/og-image.png"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
