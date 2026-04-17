import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import TIBSFloat from "@/components/public/TIBSFloat";
import SmartRecommendations from "@/components/public/SmartRecommendations";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <TIBSFloat />
      <SmartRecommendations currentPage="site" />
    </>
  );
}
