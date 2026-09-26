import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Training | TIBLOGICS",
  description:
    "Join live AI training cohorts, workshops, and industry events hosted by TIBLOGICS — hands-on learning for builders, businesses, and professionals in North America and Africa.",
  openGraph: {
    title: "Events & Training | TIBLOGICS",
    description:
      "Live AI training, workshops, and events. Join the next TIBLOGICS cohort and go from curious to capable.",
    type: "website",
    url: "https://tiblogics.com/events",
    images: [{ url: "https://tiblogics.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events & Training | TIBLOGICS",
    description: "Live AI training, workshops, and events from TIBLOGICS.",
  },
  alternates: { canonical: "https://tiblogics.com/events" },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
