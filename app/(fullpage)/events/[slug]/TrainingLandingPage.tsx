"use client";

import { useState, useEffect } from "react";
import { applyPrice, type TrainingContent } from "@/lib/training-content";

interface Props {
  eventSlug: string;
  eventTitle: string;
  eventDescription: string;
  startDate: string;
  spots: number;
  price: number;       // in cents, e.g. 64900 = $649
  currency: string;
  location: string;
  timeSlot: string;
  stripeLink: string | null;
  registrationOpen: boolean;
  content: TrainingContent;  // merged editable copy (defaults ⊕ admin overrides)
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{overflow-x:hidden}
@keyframes slideDown{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeUp{from{transform:translateY(32px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.08)}66%{transform:translate(-30px,20px) scale(0.94)}}
@keyframes nodePulse{0%,100%{opacity:.5;r:5}50%{opacity:1;r:8}}
@keyframes lineGlow{0%,100%{opacity:.08}50%{opacity:.55}}
@keyframes particleFloat{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:.8}90%{opacity:.3}100%{transform:translateY(-140px) translateX(var(--drift,0px));opacity:0}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(244,124,76,.4)}70%{box-shadow:0 0 0 10px rgba(244,124,76,0)}}
@keyframes countFlip{from{transform:translateY(-10px);opacity:0}to{transform:translateY(0);opacity:1}}
.reveal{opacity:0;transform:translateY(28px);transition:opacity .65s ease,transform .65s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.stagger-child{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}
.stagger-child.visible{opacity:1;transform:translateY(0)}
.hero-1{animation:fadeUp .8s ease .1s both}
.hero-2{animation:fadeUp .8s ease .3s both}
.hero-3{animation:fadeUp .8s ease .5s both}
.hero-4{animation:fadeUp .8s ease .7s both}
.hero-5{animation:fadeUp .8s ease .9s both}
.landing-nav{animation:slideDown .6s ease 0s both}
.cta-primary{transition:transform .2s ease,box-shadow .2s ease;background:linear-gradient(135deg,#F47C4C,#F9A738);color:#131A1B;font-weight:700;border:none;cursor:pointer}
.cta-primary:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(244,124,76,.45)}
.cta-outline{transition:all .2s ease;background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.25);cursor:pointer}
.cta-outline:hover{border-color:rgba(244,124,76,.6);color:#F47C4C}
.outcome-card{transition:transform .3s ease,border-color .3s ease;border:1px solid rgba(255,255,255,.07)}
.outcome-card:hover{transform:translateY(-5px);border-color:rgba(244,124,76,.35)!important}
.outcome-card:hover .card-icon{transform:scale(1.12)}
.card-icon{transition:transform .3s ease;display:inline-block}
.session-card{transition:transform .3s ease,box-shadow .3s ease}
.session-card:hover{transform:translateY(-5px);box-shadow:0 24px 48px rgba(0,0,0,.35)!important}
.include-card{transition:transform .3s ease,box-shadow .3s ease}
.include-card:hover{transform:translateY(-3px)}
.payment-opt{transition:all .2s ease;cursor:pointer}
.payment-opt:hover{background:rgba(244,124,76,.07)!important;border-color:rgba(244,124,76,.4)!important}
.payment-opt.selected{background:rgba(244,124,76,.12)!important;border-color:#F47C4C!important}
.faq-item{border-bottom:1px solid rgba(255,255,255,.07)}
.faq-q{cursor:pointer;display:flex;justify-content:space-between;align-items:flex-start;padding:20px 0;user-select:none;gap:16px}
.faq-a{max-height:0;overflow:hidden;transition:max-height .4s ease}
.faq-item.open .faq-a{max-height:600px}
.faq-chevron{transition:transform .3s ease;flex-shrink:0;margin-top:3px}
.faq-item.open .faq-chevron{transform:rotate(180deg)}
.gradient-text{background:linear-gradient(135deg,#F47C4C,#F9A738);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pulsing-dot{width:9px;height:9px;border-radius:50%;background:#F47C4C;animation:pulse 2s ease infinite;display:inline-block;flex-shrink:0}
.orb{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}
.count-num{animation:countFlip .3s ease both}
input,select,textarea{font-family:'DM Sans',sans-serif}
input:focus,select:focus,textarea:focus{outline:none}
@media(max-width:900px){
  .hero-grid{grid-template-columns:1fr!important}
  .hero-visual{display:none!important}
  .sessions-grid{grid-template-columns:repeat(2,1fr)!important}
  .outcomes-grid{grid-template-columns:repeat(2,1fr)!important}
  .includes-grid{grid-template-columns:repeat(2,1fr)!important}
  .callout-grid{grid-template-columns:1fr!important}
}
@media(max-width:600px){
  .hero-headline{font-size:clamp(2rem,7vw,2.8rem)!important;line-height:1.15!important}
  .hero-grid{grid-template-columns:1fr!important;gap:0!important}
  .hero-visual{display:none!important}
  .hero-cta-wrap{flex-direction:column!important;width:100%!important}
  .hero-cta-wrap a{width:100%!important;text-align:center!important;box-sizing:border-box!important}
  .hero-section{padding:100px 18px 60px!important}
  .pricing-amount{font-size:3.2rem!important}
  .pricing-inner{padding:28px 20px!important}
  .form-inner{padding:24px 18px!important}
  .form-row{flex-direction:column!important}
  .pay-grid{grid-template-columns:1fr!important}
  .stat-wrap{flex-wrap:wrap;gap:12px!important}
  .stat-item{border-right:none!important;padding:8px 16px!important}
  .nav-sub{display:none}
  .hero-pills{flex-wrap:wrap!important}
  .countdown-wrap{gap:8px!important}
  .countdown-unit{min-width:52px!important}
  .countdown-num{font-size:1.7rem!important}
  .countdown-sep{font-size:1.7rem!important;margin-bottom:24px!important}
  .callout-grid{grid-template-columns:1fr!important}
  .weekly-grid{grid-template-columns:1fr!important}
  .sessions-grid{grid-template-columns:1fr!important}
  .section-inner{padding:56px 18px!important}
  .req-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
  .footer-inner{flex-direction:column!important;align-items:flex-start!important;gap:16px!important}
  .footer-links{flex-direction:column!important;gap:12px!important}
}
`;

const S = {
  darker: "#131A1B",
  dark: "#1C2526",
  orange: "#F47C4C",
  amber: "#F9A738",
  muted: "#8A9BA0",
  border: "rgba(255,255,255,0.07)",
  card: "rgba(255,255,255,0.04)",
};

const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

function pad(n: number) { return String(n).padStart(2, "0"); }
function gradText(text: string) {
  return <span className="gradient-text">{text}</span>;
}

// ─── Neural Network SVG ────────────────────────────────────────────────────────
function NeuralNet() {
  return (
    <svg viewBox="0 0 480 380" style={{ width: "100%", maxWidth: "540px", overflow: "visible" }} aria-hidden>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Connections */}
      {[
        [80,190, 180,90],[80,190, 180,190],[80,190, 180,290],
        [180,90, 300,140],[180,90, 300,240],[180,190, 300,140],
        [180,190, 300,240],[180,290, 300,240],[180,290, 300,340],
        [300,140, 400,190],[300,240, 400,190],[300,340, 400,290],
        [400,190, 400,290],
      ].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="url(#lineGrad)" strokeWidth="1.5"
          style={{ animation: `lineGlow ${2+i*.3}s ease-in-out ${i*.2}s infinite` }}
        />
      ))}
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F47C4C" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#F9A738" stopOpacity="0.3"/>
        </linearGradient>
        <radialGradient id="nodeGrad">
          <stop offset="0%" stopColor="#F9A738"/>
          <stop offset="100%" stopColor="#F47C4C"/>
        </radialGradient>
      </defs>
      {/* Input nodes */}
      {[90,190,290].map((y,i)=>(
        <g key={i} filter="url(#glow)">
          <circle cx="80" cy={y} r="10" fill="url(#nodeGrad)" opacity="0.85"
            style={{ animation: `nodePulse ${2.5+i*.4}s ease-in-out ${i*.5}s infinite` }}
          />
          <circle cx="80" cy={y} r="5" fill="#fff" opacity="0.9"/>
        </g>
      ))}
      {/* Hidden layer */}
      {[90,190,290].map((y,i)=>(
        <g key={i} filter="url(#glow)">
          <circle cx="180" cy={y} r="12" fill="url(#nodeGrad)" opacity="0.8"
            style={{ animation: `nodePulse ${2+i*.35}s ease-in-out ${.3+i*.4}s infinite` }}
          />
          <circle cx="180" cy={y} r="6" fill="#fff" opacity="0.9"/>
        </g>
      ))}
      {/* Middle layer */}
      {[140,240,340].map((y,i)=>(
        <g key={i} filter="url(#glow)">
          <circle cx="300" cy={y} r="14" fill="url(#nodeGrad)" opacity="0.9"
            style={{ animation: `nodePulse ${1.8+i*.3}s ease-in-out ${.6+i*.3}s infinite` }}
          />
          <circle cx="300" cy={y} r="7" fill="#fff"/>
        </g>
      ))}
      {/* Output nodes */}
      {[190,290].map((y,i)=>(
        <g key={i} filter="url(#glow)">
          <circle cx="400" cy={y} r="11" fill="url(#nodeGrad)" opacity="0.85"
            style={{ animation: `nodePulse ${2.2+i*.4}s ease-in-out ${.9+i*.5}s infinite` }}
          />
          <circle cx="400" cy={y} r="5.5" fill="#fff" opacity="0.9"/>
        </g>
      ))}
      {/* Floating particles */}
      {[
        {cx:120,cy:180,r:2.5,dur:4,drift:"-15px",delay:0},
        {cx:240,cy:120,r:2,dur:5,drift:"10px",delay:1},
        {cx:350,cy:260,r:3,dur:3.5,drift:"-20px",delay:.5},
        {cx:160,cy:300,r:2,dur:4.5,drift:"12px",delay:1.5},
        {cx:280,cy:70,r:2.5,dur:3.8,drift:"-8px",delay:.8},
        {cx:420,cy:150,r:2,dur:4.2,drift:"18px",delay:1.2},
      ].map((p,i)=>(
        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="#F9A738"
          style={{ animation: `particleFloat ${p.dur}s ease-in-out ${p.delay}s infinite`, "--drift": p.drift } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="countdown-unit" style={{ textAlign: "center", minWidth: "70px", flex: "0 0 auto" }}>
      <div style={{
        background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`,
        borderRadius: "14px", padding: "16px 20px", marginBottom: "8px"
      }}>
        <span className="count-num countdown-num" key={value} style={{
          display: "block", fontFamily: syne, fontWeight: 800,
          fontSize: "2.4rem", lineHeight: 1, color: "#fff"
        }}>{value}</span>
      </div>
      <span style={{ fontFamily: dm, fontSize: ".7rem", color: S.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>{label}</span>
    </div>
  );
}

// Isolated so its 1-second setInterval re-render doesn't bubble up to the parent
function CountdownTimer({ startDate }: { startDate: string }) {
  const TARGET = new Date(startDate);
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = TARGET.getTime() - Date.now();
      if (diff <= 0) { setCd({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setCd({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  return (
    <div className="countdown-wrap" style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
      <CountdownUnit value={pad(cd.d)} label="Days" />
      <span className="countdown-sep" style={{ fontFamily: syne, fontWeight: 800, fontSize: "2.4rem", alignSelf: "center", color: "rgba(255,255,255,.2)", marginBottom: "28px" }}>:</span>
      <CountdownUnit value={pad(cd.h)} label="Hours" />
      <span className="countdown-sep" style={{ fontFamily: syne, fontWeight: 800, fontSize: "2.4rem", alignSelf: "center", color: "rgba(255,255,255,.2)", marginBottom: "28px" }}>:</span>
      <CountdownUnit value={pad(cd.m)} label="Minutes" />
      <span className="countdown-sep" style={{ fontFamily: syne, fontWeight: 800, fontSize: "2.4rem", alignSelf: "center", color: "rgba(255,255,255,.2)", marginBottom: "28px" }}>:</span>
      <CountdownUnit value={pad(cd.s)} label="Seconds" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrainingLandingPage({
  eventSlug, eventTitle, eventDescription, startDate, spots,
  price, currency, location, timeSlot,
  stripeLink, registrationOpen, content,
}: Props) {
  const C = content;
  const priceDisplay = price === 0 ? "Free" : `$${(price / 100).toFixed(0)} ${currency}`;
  const isFree = price === 0;
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [activePayment, setActivePayment] = useState("paypal");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", whatsapp: "",
    role: "", goal: "", referral: "",
  });
  const [formStatus, setFormStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [toastMsg, setToastMsg] = useState("");

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          (e.target as Element).querySelectorAll(".stagger-child").forEach((c, i) => {
            setTimeout(() => c.classList.add("visible"), i * 85);
          });
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const field = (k: keyof typeof formData, v: string) =>
    setFormData(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormStatus("loading");
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          paymentMethod: activePayment,
          event: eventTitle,
          eventSlug,
          price: price / 100,   // prop is cents; API expects dollars then multiplies ×100
          currency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe Checkout for card/paypal
        if (activePayment === "paypal" || activePayment === "card") {
          const checkoutRes = await fetch("/api/events/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registrationId: data.id }),
          });
          if (checkoutRes.ok) {
            const { checkoutUrl } = await checkoutRes.json();
            if (checkoutUrl) {
              window.location.href = checkoutUrl;
              return;
            }
          }
        }
        setFormStatus("success");
        setToastMsg("🎉 Registration received! Check your email within 24hrs.");
        setTimeout(() => setToastMsg(""), 5000);
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  }

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: dm, background: S.darker, color: "#fff", overflowX: "hidden", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          background: "linear-gradient(135deg,#F47C4C,#F9A738)",
          color: "#131A1B", fontWeight: 700, fontFamily: syne,
          padding: "14px 22px", borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(244,124,76,.4)",
          animation: "fadeUp .4s ease", maxWidth: "340px"
        }}>
          {toastMsg}
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="landing-nav" style={{
        position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1000,
        background: "rgba(19,26,27,0.88)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${S.border}`, padding: "12px 18px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <circle cx="8" cy="19" r="4.5" fill="#F47C4C"/>
              <circle cx="19" cy="7" r="3.5" fill="#F9A738"/>
              <circle cx="30" cy="19" r="4.5" fill="#F47C4C"/>
              <circle cx="19" cy="31" r="3.5" fill="#F9A738"/>
              <circle cx="19" cy="19" r="6" fill="white"/>
              <line x1="12.5" y1="19" x2="13" y2="19" stroke="rgba(244,124,76,0.5)" strokeWidth="1.5"/>
              <line x1="25" y1="19" x2="25.5" y2="19" stroke="rgba(244,124,76,0.5)" strokeWidth="1.5"/>
              <line x1="19" y1="10.5" x2="19" y2="13" stroke="rgba(244,124,76,0.5)" strokeWidth="1.5"/>
              <line x1="19" y1="25" x2="19" y2="27.5" stroke="rgba(244,124,76,0.5)" strokeWidth="1.5"/>
            </svg>
            <div>
              <div style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.1rem", letterSpacing: ".06em" }}>{C.nav.brand}</div>
              <div className="nav-sub" style={{ fontSize: ".65rem", color: S.muted, letterSpacing: ".1em" }}>{C.nav.tagline}</div>
            </div>
          </div>
          <a href="#register" className="cta-primary" style={{
            padding: "9px 16px", borderRadius: "30px", fontFamily: syne,
            fontSize: ".8rem", textDecoration: "none", letterSpacing: ".02em", whiteSpace: "nowrap"
          }}>{C.nav.cta}</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "120px 24px 80px", position: "relative", overflow: "hidden"
      }}>
        {/* Background orbs */}
        <div className="orb" style={{ width:600, height:600, background:"rgba(244,124,76,.12)", top:"-100px", left:"-150px", "--duration":"14s" } as React.CSSProperties} />
        <div className="orb" style={{ width:500, height:500, background:"rgba(249,167,56,.08)", bottom:"-80px", right:"-120px", "--duration":"18s" } as React.CSSProperties} />
        <div className="orb" style={{ width:300, height:300, background:"rgba(34,81,163,.12)", top:"40%", left:"40%", "--duration":"11s" } as React.CSSProperties} />

        <div className="hero-grid" style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
          <div>
            {/* Eyebrow */}
            <div className="hero-1" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(244,124,76,.1)", border: "1px solid rgba(244,124,76,.25)", borderRadius: "30px", padding: "8px 16px", marginBottom: "28px" }}>
              <span className="pulsing-dot"/>
              <span style={{ fontFamily: dm, fontSize: ".82rem", color: "#F9A738", fontWeight: 500 }}>{C.hero.eyebrow || `${location} · ${timeSlot}`}</span>
            </div>

            {/* Headline */}
            <h1 className="hero-headline hero-2" style={{
              fontFamily: syne, fontWeight: 800, lineHeight: 1.12,
              fontSize: "clamp(2.6rem,4.2vw,4.2rem)", marginBottom: "24px", color: "#fff"
            }}>
              {C.hero.headlineLine1}<br />{C.hero.headlineLine2}<br />
              <span className="gradient-text">{C.hero.headlineHighlight}</span>
            </h1>

            {/* Sub */}
            <p className="hero-3" style={{ fontSize: "1.05rem", color: "#B0C4CC", lineHeight: 1.7, marginBottom: "32px", maxWidth: "520px" }}>
              {C.hero.subtitle}
            </p>

            {/* Pills */}
            <div className="hero-pills hero-4" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "36px" }}>
              {C.hero.pills.map((p,i) => (
                <span key={i} style={{ background: "rgba(255,255,255,.06)", border: `1px solid ${S.border}`, borderRadius: "20px", padding: "6px 14px", fontSize: ".78rem", color: "#C8D8E0", fontWeight: 500 }}>{p}</span>
              ))}
            </div>

            {/* CTAs */}
            <div className="hero-5 hero-cta-wrap" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <a href="#register" className="cta-primary" style={{ padding: "15px 30px", borderRadius: "50px", fontFamily: syne, fontSize: "1rem", textDecoration: "none", letterSpacing: ".02em" }}>
                {isFree ? applyPrice(C.hero.ctaPrimaryFree, priceDisplay) : applyPrice(C.hero.ctaPrimaryPaid, priceDisplay)}
              </a>
              <a href="#curriculum" className="cta-outline" style={{ padding: "15px 26px", borderRadius: "50px", fontFamily: dm, fontSize: ".95rem", textDecoration: "none" }}>
                {C.hero.ctaSecondary}
              </a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="hero-visual" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "28px" }}>
            {/* ARFA — AI Readiness For All banner */}
            <img
              src="/arfa-banner.png"
              alt="ARFA — AI Readiness For All · A TIBLOGICS Educational Branch"
              className="hero-1"
              style={{
                width: "100%", maxWidth: "440px", height: "auto",
                borderRadius: "18px", border: `1px solid ${S.border}`,
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              }}
            />
            <NeuralNet />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="reveal" style={{ background: "rgba(255,255,255,.025)", borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`, padding: "28px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }} className="stat-wrap">
          {C.stats.map((s, i) => (
            <div key={i} className="stagger-child stat-item" style={{
              textAlign: "center", padding: "0 20px",
              borderRight: i < C.stats.length - 1 ? `1px solid ${S.border}` : "none"
            }}>
              <div className="gradient-text" style={{ fontFamily: syne, fontWeight: 800, fontSize: "2rem" }}>{s.value}</div>
              <div style={{ fontSize: ".75rem", color: S.muted, marginTop: "4px", letterSpacing: ".04em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COUNTDOWN ── */}
      <section style={{ padding: "80px 24px", background: `linear-gradient(180deg, ${S.darker} 0%, ${S.dark} 100%)` }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }} className="reveal">
          <div style={{ fontFamily: dm, fontSize: ".8rem", color: S.muted, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: "12px" }}>{C.countdown.label}</div>
          <CountdownTimer startDate={startDate} />
        </div>
      </section>

      {/* ── OUTCOMES ── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontFamily: dm, fontSize: ".75rem", color: S.orange, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: "12px" }}>{C.outcomes.eyebrow}</div>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: "clamp(1.8rem,3vw,2.6rem)", marginBottom: "14px" }}>{C.outcomes.heading}</h2>
            <p style={{ color: S.muted, fontSize: ".95rem", maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>{C.outcomes.subtitle}</p>
          </div>
          <div className="outcomes-grid reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "18px" }}>
            {C.outcomes.items.map((o, i) => (
              <div key={i} className="outcome-card stagger-child" style={{
                background: S.card, borderRadius: "20px", padding: "28px 24px",
              }}>
                <div className="card-icon" style={{ fontSize: "2rem", marginBottom: "14px" }}>{o.icon}</div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: "1rem", marginBottom: "8px" }}>{o.title}</div>
                <div style={{ color: S.muted, fontSize: ".88rem", lineHeight: 1.65 }}>{o.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURRICULUM ── */}
      <section id="curriculum" style={{ padding: "80px 24px", background: S.dark }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{ fontFamily: dm, fontSize: ".75rem", color: S.orange, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: "12px" }}>{C.curriculum.eyebrow}</div>
            <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: "clamp(1.8rem,3vw,2.6rem)", marginBottom: "14px" }}>{C.curriculum.heading}</h2>
            <p style={{ color: S.muted, fontSize: ".95rem", maxWidth: "520px", margin: "0 auto" }}>{C.curriculum.subtitle}</p>
          </div>

          <div className="sessions-grid reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "18px", marginBottom: "56px" }}>
            {C.curriculum.sessions.map((s, i) => (
              <div key={i} className="session-card stagger-child" style={{
                background: S.card, border: `1px solid ${S.border}`, borderRadius: "20px",
                padding: "28px 22px", position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: "14px", right: "16px", fontFamily: syne, fontWeight: 800, fontSize: "3.5rem", color: "rgba(255,255,255,.04)", lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: ".75rem", color: s.color, fontWeight: 600, marginBottom: "10px", letterSpacing: ".06em" }}>{s.date}</div>
                <div style={{ fontFamily: syne, fontWeight: 700, fontSize: "1rem", marginBottom: "10px", lineHeight: 1.3, paddingRight: "20px" }}>{s.title}</div>
                <div style={{ color: S.muted, fontSize: ".83rem", lineHeight: 1.65, marginBottom: "16px" }}>{s.desc}</div>
                <span style={{ display: "inline-block", background: `${s.color}22`, color: s.color, borderRadius: "20px", padding: "4px 12px", fontSize: ".73rem", fontWeight: 600 }}>{s.badge}</span>
              </div>
            ))}
          </div>

          {/* Schedule table */}
          <div className="reveal" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".88rem" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                  {["Session","Date","Topic","Key Labs"].map(h=>(
                    <th key={h} style={{ textAlign:"left", padding:"12px 16px", color: S.muted, fontWeight:600, fontFamily: dm, fontSize:".75rem", letterSpacing:".08em", textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {C.curriculum.scheduleRows.map((row,i)=>(
                  <tr key={i} style={{ borderBottom:`1px solid ${S.border}` }}>
                    {[row.session, row.date, row.topic, row.labs].map((cell,j)=>(
                      <td key={j} style={{ padding:"14px 16px", color: j===2 ? "#C8D8E0" : j===3 ? S.muted : "#fff", lineHeight:1.55 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Schedule pills */}
          <div className="reveal" style={{ marginTop: "28px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {C.curriculum.schedulePills.map((p,i)=>(
              <span key={i} style={{ background:"rgba(255,255,255,.05)", border:`1px solid ${S.border}`, borderRadius:"20px", padding:"6px 14px", fontSize:".78rem", color:S.muted }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto" }} className="reveal">
          {/* Card */}
          <div className="pricing-inner" style={{ background: S.dark, border: `1px solid ${S.border}`, borderRadius: "24px", padding: "40px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div className="orb" style={{ width:300, height:300, background:"rgba(244,124,76,.08)", top:"-50px", right:"-80px" }} />
            <div style={{ fontFamily: dm, fontSize: ".78rem", color: S.muted, letterSpacing: ".1em", marginBottom: "20px" }}>{C.pricing.eyebrow}</div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontFamily: syne, fontWeight: 700, fontSize: "1.4rem", color: S.muted, textDecoration: "line-through", marginRight: "12px" }}>{C.pricing.originalPrice}</span>
              <span style={{ background: "#16a34a22", color: "#4ade80", border: "1px solid #16a34a44", borderRadius: "20px", padding: "4px 14px", fontSize: ".78rem", fontWeight: 600 }}>{C.pricing.badge}</span>
            </div>
            <div className="pricing-amount" style={{ fontFamily: syne, fontWeight: 800, fontSize: "5rem", lineHeight: 1, marginBottom: "8px" }}>{priceDisplay}</div>
            <div style={{ color: S.orange, fontSize: ".88rem", fontWeight: 600, marginBottom: "6px" }}>{C.pricing.saveText}</div>
            <div style={{ color: S.muted, fontSize: ".85rem", marginBottom: "20px" }}>{C.pricing.accessText}</div>

            {/* Weekly cost breakdown */}
            <div className="weekly-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
              <div style={{ background: "rgba(255,255,255,.04)", border: `1px solid ${S.border}`, borderRadius: "14px", padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: dm, fontSize: ".7rem", color: S.muted, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "6px" }}>{C.pricing.standardLabel}</div>
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.5rem", color: S.muted, textDecoration: "line-through", marginBottom: "2px" }}>{C.pricing.standardAmount}</div>
                <div style={{ fontSize: ".75rem", color: S.muted }}>{C.pricing.standardSub}</div>
              </div>
              <div style={{ background: "rgba(244,124,76,.08)", border: "1px solid rgba(244,124,76,.3)", borderRadius: "14px", padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: dm, fontSize: ".7rem", color: S.orange, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "6px" }}>{C.pricing.cohortLabel}</div>
                <div style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.5rem", color: "#fff", marginBottom: "2px" }}>{C.pricing.cohortAmount}</div>
                <div style={{ fontSize: ".75rem", color: S.muted }}>{C.pricing.cohortSub}</div>
              </div>
            </div>

            {/* Includes list */}
            <div style={{ textAlign: "left", marginBottom: "32px" }}>
              {C.pricing.includes.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 0", borderBottom: i < C.pricing.includes.length - 1 ? `1px solid ${S.border}` : "none" }}>
                  <span className="include-check">✦</span>
                  <span style={{ fontSize: ".88rem", color: "#C8D8E0", lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a href="#register" className="cta-primary" style={{
              display: "block", padding: "17px 32px", borderRadius: "50px",
              fontFamily: syne, fontSize: "1rem", textDecoration: "none",
              marginBottom: "16px", letterSpacing: ".02em"
            }}>{C.pricing.cta}</a>

            {/* Pulse warning */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span className="pulsing-dot" />
              <span style={{ fontSize: ".8rem", color: S.orange, fontWeight: 600 }}>{C.pricing.warning}</span>
            </div>
          </div>

          {/* Requirements */}
          <div style={{ marginTop: "28px" }}>
            <div style={{ fontFamily: dm, fontSize: ".78rem", color: S.muted, letterSpacing: ".1em", textTransform: "uppercase", textAlign: "center", marginBottom: "16px" }}>{C.pricing.requirementsHeading}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {C.pricing.requirements.map((r,i)=>(
                <div key={i} style={{ background: S.card, border:`1px solid ${S.border}`, borderRadius:"14px", padding:"14px" }}>
                  <div style={{ fontSize:"1.3rem", marginBottom:"6px" }}>{r.icon}</div>
                  <div style={{ fontSize:".83rem", fontWeight:600, marginBottom:"3px" }}>{r.title}</div>
                  <div style={{ fontSize:".75rem", color:S.muted }}>{r.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section style={{ padding: "80px 24px", background: S.dark }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign:"center", marginBottom:"56px" }}>
            <div style={{ fontFamily:dm, fontSize:".75rem", color:S.orange, letterSpacing:".18em", textTransform:"uppercase", marginBottom:"12px" }}>{C.whatsIncluded.eyebrow}</div>
            <h2 style={{ fontFamily:syne, fontWeight:800, fontSize:"clamp(1.8rem,3vw,2.6rem)", marginBottom:"14px" }}>{C.whatsIncluded.heading}</h2>
          </div>

          <div className="includes-grid reveal" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"18px", marginBottom:"40px" }}>
            {C.whatsIncluded.cards.map((c,i)=>(
              <div key={i} className="include-card stagger-child" style={{ background:S.card, borderRadius:"20px", padding:"28px 24px", borderLeft:`3px solid ${c.color}` }}>
                <div style={{ fontFamily:syne, fontWeight:700, fontSize:"1rem", marginBottom:"6px" }}>{c.title}</div>
                <div style={{ color:c.color, fontSize:".8rem", fontWeight:600, marginBottom:"10px" }}>{c.subtitle}</div>
                <div style={{ color:S.muted, fontSize:".85rem", lineHeight:1.65 }}>{c.desc}</div>
              </div>
            ))}
          </div>

          {/* Tools grid */}
          <div className="reveal" style={{ marginBottom:"32px" }}>
            <div style={{ fontFamily:dm, fontSize:".75rem", color:S.muted, letterSpacing:".12em", textTransform:"uppercase", textAlign:"center", marginBottom:"16px" }}>{C.whatsIncluded.toolsHeading}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"10px", justifyContent:"center" }}>
              {C.whatsIncluded.tools.map((t,i)=>(
                <span key={i} style={{ background:"rgba(255,255,255,.06)", border:`1px solid ${S.border}`, borderRadius:"30px", padding:"7px 16px", fontSize:".8rem", color:"#C8D8E0" }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Live Fix callout */}
          <div className="reveal callout-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px" }}>
            {C.whatsIncluded.callouts.map((c,i)=>(
              <div key={i} style={{ background:`${c.color}14`, border:`1px solid ${c.color}40`, borderRadius:"20px", padding:"24px" }}>
                <div style={{ fontFamily:syne, fontWeight:700, fontSize:"1rem", color:c.color, marginBottom:"8px" }}>{c.title}</div>
                <div style={{ color:S.muted, fontSize:".88rem", lineHeight:1.65 }}>{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGISTRATION FORM ── */}
      <section id="register" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "660px", margin: "0 auto" }} className="reveal">
          <div style={{ textAlign:"center", marginBottom:"40px" }}>
            <div style={{ fontFamily:dm, fontSize:".75rem", color:S.orange, letterSpacing:".18em", textTransform:"uppercase", marginBottom:"12px" }}>{C.registration.eyebrow}</div>
            <h2 style={{ fontFamily:syne, fontWeight:800, fontSize:"clamp(1.8rem,3vw,2.4rem)", marginBottom:"14px" }}>{C.registration.heading}</h2>
            <p style={{ color:S.muted, fontSize:".9rem", lineHeight:1.7, maxWidth:"480px", margin:"0 auto" }}>{C.registration.subtitle}</p>
          </div>

          {formStatus === "success" ? (
            <div style={{ background:"rgba(74,222,128,.08)", border:"1px solid rgba(74,222,128,.25)", borderRadius:"20px", padding:"48px 32px", textAlign:"center" }}>
              <div style={{ fontSize:"3rem", marginBottom:"16px" }}>🎉</div>
              <div style={{ fontFamily:syne, fontWeight:800, fontSize:"1.5rem", marginBottom:"12px" }}>{C.registration.successHeading}</div>
              <div style={{ color:S.muted, fontSize:".92rem", lineHeight:1.7, marginBottom:"20px" }}>{C.registration.successBody}</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-inner" style={{ background:S.dark, border:`1px solid ${S.border}`, borderRadius:"24px", padding:"36px 32px" }}>
                {/* Name row */}
                <div className="form-row" style={{ display:"flex", gap:"14px", marginBottom:"16px" }}>
                  {(["firstName","lastName"] as const).map((k,i)=>(
                    <input key={k} type="text" placeholder={i===0?"First Name":"Last Name"} value={formData[k]} onChange={e=>field(k,e.target.value)} required
                      style={{ flex:1, background:"rgba(255,255,255,.05)", border:`1px solid ${S.border}`, borderRadius:"12px", padding:"13px 16px", color:"#fff", fontSize:".9rem" }}
                    />
                  ))}
                </div>

                {/* Email */}
                <input type="email" placeholder="Email Address" value={formData.email} onChange={e=>field("email",e.target.value)} required
                  style={{ width:"100%", background:"rgba(255,255,255,.05)", border:`1px solid ${S.border}`, borderRadius:"12px", padding:"13px 16px", color:"#fff", fontSize:".9rem", marginBottom:"16px" }}
                />

                {/* WhatsApp */}
                <input type="tel" placeholder="WhatsApp Number (with country code)" value={formData.whatsapp} onChange={e=>field("whatsapp",e.target.value)}
                  style={{ width:"100%", background:"rgba(255,255,255,.05)", border:`1px solid ${S.border}`, borderRadius:"12px", padding:"13px 16px", color:"#fff", fontSize:".9rem", marginBottom:"16px" }}
                />

                {/* Role */}
                <input type="text" placeholder="What do you do? (e.g. freelancer, business owner, student)" value={formData.role} onChange={e=>field("role",e.target.value)}
                  style={{ width:"100%", background:"rgba(255,255,255,.05)", border:`1px solid ${S.border}`, borderRadius:"12px", padding:"13px 16px", color:"#fff", fontSize:".9rem", marginBottom:"16px" }}
                />

                {/* Goal */}
                <select value={formData.goal} onChange={e=>field("goal",e.target.value)}
                  style={{ width:"100%", background:S.dark, border:`1px solid ${S.border}`, borderRadius:"12px", padding:"13px 16px", color: formData.goal ? "#fff" : S.muted, fontSize:".9rem", marginBottom:"16px" }}
                >
                  <option value="" disabled>{C.registration.goalPlaceholder}</option>
                  {C.registration.goalOptions.map((g,i)=>(<option key={i}>{g}</option>))}
                </select>

                {/* Referral */}
                <input type="text" placeholder="How did you hear about this training?" value={formData.referral} onChange={e=>field("referral",e.target.value)}
                  style={{ width:"100%", background:"rgba(255,255,255,.05)", border:`1px solid ${S.border}`, borderRadius:"12px", padding:"13px 16px", color:"#fff", fontSize:".9rem", marginBottom:"28px" }}
                />

                {/* Payment selector */}
                <div style={{ marginBottom:"28px" }}>
                  <div style={{ fontFamily:dm, fontSize:".8rem", color:S.muted, marginBottom:"12px", letterSpacing:".06em" }}>SELECT PAYMENT METHOD</div>
                  <div className="pay-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                    {[
                      { id:"paypal", icon:"🅿️", label:"PayPal", sub:"Instant · Secure" },
                      { id:"card", icon:"💳", label:"Credit / Debit", sub:"Visa · Mastercard" },
                    ].map(p=>(
                      <div key={p.id} className={`payment-opt${activePayment===p.id?" selected":""}`}
                        onClick={()=>setActivePayment(p.id)}
                        style={{ background:"rgba(255,255,255,.04)", border:`1.5px solid ${activePayment===p.id?S.orange:S.border}`, borderRadius:"12px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"10px" }}
                      >
                        <span style={{ fontSize:"1.4rem" }}>{p.icon}</span>
                        <div>
                          <div style={{ fontWeight:600, fontSize:".88rem" }}>{p.label}</div>
                          <div style={{ fontSize:".72rem", color:S.muted }}>{p.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Submit */}
                <button type="submit" disabled={formStatus==="loading"} className="cta-primary" style={{
                  width:"100%", padding:"17px 32px", borderRadius:"50px",
                  fontFamily:syne, fontSize:"1.05rem", letterSpacing:".02em",
                  opacity: formStatus==="loading" ? .7 : 1
                }}>
                  {formStatus==="loading" ? (
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                      <span style={{ width:"18px", height:"18px", border:"2.5px solid rgba(0,0,0,.3)", borderTopColor:"#131A1B", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }}/>
                      Processing…
                    </span>
                  ) : applyPrice(isFree ? C.registration.submitFree : C.registration.submitPaid, priceDisplay)}
                </button>

                {formStatus==="error" && (
                  <p style={{ color:"#F87171", fontSize:".83rem", textAlign:"center", marginTop:"12px" }}>Something went wrong. Please try again or email arfa_edu@tiblogics.com</p>
                )}

                <div style={{ textAlign:"center", marginTop:"18px", color:S.muted, fontSize:".78rem" }}>
                  {C.registration.secureNote}
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "80px 24px", background: S.dark }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign:"center", marginBottom:"48px" }}>
            <div style={{ fontFamily:dm, fontSize:".75rem", color:S.orange, letterSpacing:".18em", textTransform:"uppercase", marginBottom:"12px" }}>{C.faq.eyebrow}</div>
            <h2 style={{ fontFamily:syne, fontWeight:800, fontSize:"clamp(1.6rem,3vw,2.2rem)" }}>{C.faq.heading}</h2>
          </div>
          <div className="reveal">
            {C.faq.items.map((f,i)=>(
              <div key={i} className={`faq-item${faqOpen===i?" open":""}`} onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
                <div className="faq-q">
                  <span style={{ fontFamily:syne, fontWeight:600, fontSize:".95rem", color:"#E8F0F4", lineHeight:1.5 }}>{f.q}</span>
                  <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div className="faq-a">
                  <div style={{ color:S.muted, fontSize:".88rem", lineHeight:1.75, paddingBottom:"20px" }}>{f.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding:"48px 24px 32px", background:S.darker, borderTop:`1px solid ${S.border}` }}>
        <div style={{ maxWidth:"1000px", margin:"0 auto" }}>
          <div className="footer-inner" style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"24px", marginBottom:"32px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ fontFamily:syne, fontWeight:800, fontSize:"1.2rem", letterSpacing:".06em" }}>{C.footer.brand}</div>
              <div style={{ fontSize:".75rem", color:S.muted }}>{C.footer.tagline}</div>
            </div>
            <div className="footer-links" style={{ display:"flex", flexWrap:"wrap", gap:"24px" }}>
              <a href={`mailto:${C.footer.email}`} style={{ color:S.muted, fontSize:".85rem", textDecoration:"none" }}>{C.footer.email}</a>
              <a href={`https://www.${C.footer.website.replace(/^https?:\/\/(www\.)?/, "")}`} target="_blank" rel="noopener noreferrer" style={{ color:S.muted, fontSize:".85rem", textDecoration:"none" }}>{C.footer.website}</a>
              <a href="#register" style={{ color:S.orange, fontSize:".85rem", textDecoration:"none", fontWeight:600 }}>Register</a>
              <a href="#curriculum" style={{ color:S.muted, fontSize:".85rem", textDecoration:"none" }}>Curriculum</a>
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${S.border}`, paddingTop:"24px", textAlign:"center", color:S.muted, fontSize:".78rem" }}>
            {C.footer.copyright}
          </div>
        </div>
      </footer>

      {/* Spin keyframe for loading button */}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
