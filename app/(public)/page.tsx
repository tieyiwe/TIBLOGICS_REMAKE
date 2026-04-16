import Hero from "@/components/public/Hero";
import StatsBar from "@/components/public/StatsBar";
import AIBanner from "@/components/public/AIBanner";
import ServicesGrid from "@/components/public/ServicesGrid";
import ProductsGrid from "@/components/public/ProductsGrid";
import BookingSection from "@/components/public/BookingSection";
import AfricaSection from "@/components/public/AfricaSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AIBanner />
        </div>
      </section>
      <ServicesGrid />
      <ProductsGrid />
      <BookingSection />
      <AfricaSection />
    </>
  );
}
