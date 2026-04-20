import dynamic from "next/dynamic";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import MobileBottomNav from "@/components/public/MobileBottomNav";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";

const EchelonFloat = dynamic(() => import("@/components/public/EchelonFloat"), {
  ssr: false,
  loading: () => null,
});

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
      <EchelonFloat />
    </>
  );
}
