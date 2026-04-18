import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import EchelonFloat from "@/components/public/EchelonFloat";
import SmartRecommendations from "@/components/public/SmartRecommendations";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";

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
