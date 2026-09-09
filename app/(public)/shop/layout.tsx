import { CartProvider } from "@/components/shop/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";

export const metadata = {
  title: "Shop | TIBLOGICS",
  description: "Premium tools, templates, and resources from TIBLOGICS. Instant access, built to move you forward.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');",
        }}
      />
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
