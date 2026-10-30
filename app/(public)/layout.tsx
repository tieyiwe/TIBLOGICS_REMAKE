import Nav from "@/components/public/Nav";
import SkipLink from "@/components/a11y/SkipLink";
import Footer from "@/components/public/Footer";
import MobileBottomNav from "@/components/public/MobileBottomNav";
import UtmCapture from "@/components/public/UtmCapture";
import EchelonFloatClient from "@/components/public/EchelonFloatClient";

// Google Analytics 4 on the public website only (never in ARFA's member area,
// where young learners are). TIBLOGICS' property by default; the Secret
// GA_MEASUREMENT_ID overrides it, "off" disables it (see next.config.js, which
// also opens the CSP for it). Advertising storage stays off.
const GA_RAW = process.env.GA_MEASUREMENT_ID ?? "G-WTKHY2037L";
const GA_ID = /^G-[A-Z0-9]{4,20}$/.test(GA_RAW) ? GA_RAW : null;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
