import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TIBLOGICS — AI-First Agency | Washington D.C.",
  description:
    "TIBLOGICS is an AI implementation and digital solutions agency founded by Tieyiwe Bassole, based in Wheaton, Maryland / Washington D.C. We build AI systems that make businesses unstoppable.",
  keywords: [
    "AI agency",
    "AI implementation",
    "digital transformation",
    "Washington DC",
    "Francophone Africa",
    "AI consulting",
  ],
  authors: [{ name: "Tieyiwe Bassole", url: "https://tiblogics.com" }],
  openGraph: {
    title: "TIBLOGICS — AI-First Agency",
    description: "We build AI systems that make businesses unstoppable.",
    url: "https://tiblogics.com",
    siteName: "TIBLOGICS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-dm antialiased">{children}</body>
    </html>
  );
}
