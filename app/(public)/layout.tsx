import Nav from "@/components/public/Nav";
import SkipLink from "@/components/a11y/SkipLink";
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
      <SkipLink />
      <Nav />
      <main id="main-content" tabIndex={-1} className="min-h-screen pb-[76px] focus:outline-none sm:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <EchelonFloatClient />
    </>
  );
}
