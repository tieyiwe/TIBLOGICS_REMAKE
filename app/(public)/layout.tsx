import dynamic from "next/dynamic";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";

const EchelonFloat = dynamic(() => import("@/components/public/EchelonFloat"), { ssr: false });
const SmartRecommendations = dynamic(() => import("@/components/public/SmartRecommendations"), { ssr: false });

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsTracker />
      <Nav />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <EchelonFloat />
      <SmartRecommendations currentPage="site" />
    </>
  );
}
