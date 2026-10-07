import Nav from "@/components/public/Nav";
import SkipLink from "@/components/a11y/SkipLink";
import Footer from "@/components/public/Footer";
import MobileBottomNav from "@/components/public/MobileBottomNav";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";
import UtmCapture from "@/components/public/UtmCapture";
import EchelonFloatClient from "@/components/public/EchelonFloatClient";

// Google Analytics 4, only when GA_MEASUREMENT_ID is set (see next.config.js,
// which also opens the CSP for it). Advertising storage stays off.
const GA_ID = /^G-[A-Z0-9]{4,20}$/.test(process.env.GA_MEASUREMENT_ID ?? "") ? process.env.GA_MEASUREMENT_ID! : null;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsTracker />
      <UtmCapture />
      <SkipLink />
      <Nav />
      {GA_ID && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <script
            // Static string built from a validated id (G- plus letters and digits).
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`,
            }}
          />
        </>
      )}
      <main id="main-content" tabIndex={-1} className="min-h-screen pb-[76px] pt-[var(--promo-bar,0px)] focus:outline-none sm:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <EchelonFloatClient />
    </>
  );
}
