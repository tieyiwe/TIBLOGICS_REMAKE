import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import TIBSFloat from "@/components/public/TIBSFloat";

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
    </>
  );
}
