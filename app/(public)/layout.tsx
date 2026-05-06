import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import MobileBottomNav from "@/components/public/MobileBottomNav";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import EchelonFloatClient from "@/components/public/EchelonFloatClient";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsTracker />
      <Nav />
      <main className="min-h-screen pb-[76px] sm:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <EchelonFloatClient />
    </>
  );
}
