"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  eventSlug: string;
  eventTitle: string;
  eventDate: string | null;
  eventTimeSlot: string | null;
  eventLocation: string;
  eventPrice: number;
  eventCurrency: string;
  eventUrl: string;
  confirmationNumber: string | null;
  firstName: string | null;
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0F1617;overflow-x:hidden}
@keyframes fadeUp{from{transform:translateY(32px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes pop{0%{transform:scale(0.7);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
.fade1{animation:fadeUp .6s ease .1s both}
.fade2{animation:fadeUp .6s ease .3s both}
.fade3{animation:fadeUp .6s ease .5s both}
.fade4{animation:fadeUp .6s ease .7s both}
.fade5{animation:fadeUp .6s ease .9s both}
.badge-pop{animation:pop .5s ease .4s both}
.copy-btn{transition:all .2s ease}
.copy-btn:hover{transform:translateY(-2px)}
.share-btn{transition:all .18s ease;cursor:pointer}
.share-btn:hover{transform:translateY(-3px);filter:brightness(1.12)}
`;

const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";
const S = {
  darker: "#0F1617",
  dark: "#1A2324",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  orange: "#F47C4C",
  amber: "#F9A738",
  muted: "#8A9BA0",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// ─── Confetti canvas ──────────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#F47C4C","#F9A738","#4ade80","#60a5fa","#a78bfa","#f472b6","#ffffff"];
    const pieces: { x:number;y:number;w:number;h:number;color:string;vx:number;vy:number;angle:number;va:number }[] = [];

    for (let i = 0; i < 180; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: 8 + Math.random() * 8,
        h: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.2,
      });
    }

    let frame: number;
    let done = false;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.va;
        p.vy += 0.05;
        if (p.y < canvas.height + 20) alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0 && !done) frame = requestAnimationFrame(draw);
    }
    draw();
    const t = setTimeout(() => { done = true; }, 5000);
    return () => { cancelAnimationFrame(frame); clearTimeout(t); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 9999,
    }} />
  );
}

// ─── Share button ─────────────────────────────────────────────────────────────
function ShareBtn({ href, bg, label, icon }: { href: string; bg: string; label: string; icon: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="share-btn"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
        textDecoration: "none",
      }}>
      <div style={{
        width: "52px", height: "52px", borderRadius: "14px", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem",
      }}>{icon}</div>
      <span style={{ fontFamily: dm, fontSize: ".7rem", color: S.muted }}>{label}</span>
    </a>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ConfirmedPage({
  eventSlug, eventTitle, eventDate, eventTimeSlot, eventLocation,
  eventPrice, eventCurrency, eventUrl, confirmationNumber, firstName,
}: Props) {
  const [copied, setCopied] = useState(false);

  const priceStr = eventPrice > 0
    ? `$${(eventPrice / 100).toFixed(0)} ${eventCurrency}`
    : "Free";

  const shareText = encodeURIComponent(
    `I just registered for "${eventTitle}" — you should join too! 🚀`
  );
  const shareUrl = encodeURIComponent(eventUrl);

  function copyLink() {
    navigator.clipboard.writeText(eventUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div style={{ fontFamily: dm, background: S.darker, minHeight: "100vh", color: "#fff", padding: "0 16px 80px" }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <Confetti />

      {/* Brand bar */}
      <div className="fade1" style={{
        maxWidth: "640px", margin: "0 auto", paddingTop: "40px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "48px",
      }}>
        <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
          <circle cx="8" cy="19" r="4.5" fill="#F47C4C"/>
          <circle cx="19" cy="7" r="3.5" fill="#F9A738"/>
          <circle cx="30" cy="19" r="4.5" fill="#F47C4C"/>
          <circle cx="19" cy="31" r="3.5" fill="#F9A738"/>
          <circle cx="19" cy="19" r="6" fill="white"/>
        </svg>
        <span style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.1rem", letterSpacing: ".06em" }}>
          TIB<span style={{ color: S.orange }}>LOGICS</span>
        </span>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* ── Hero confirmation ── */}
        <div className="fade2" style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="badge-pop" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.3)",
            color: "#4ade80", borderRadius: "50px", padding: "8px 20px", marginBottom: "24px",
            fontFamily: dm, fontSize: ".82rem", fontWeight: 600, letterSpacing: ".04em",
          }}>
            <span style={{ fontSize: "1rem" }}>✅</span> Payment Confirmed
          </div>

          <h1 style={{
            fontFamily: syne, fontWeight: 800,
            fontSize: "clamp(2.2rem,6vw,3.2rem)", lineHeight: 1.1,
            marginBottom: "16px",
            background: "linear-gradient(135deg,#fff 40%,rgba(255,255,255,.55))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            {firstName ? `You're in, ${firstName}!` : "You're in!"}
            <br />
            <span style={{
              background: "linear-gradient(135deg,#F47C4C,#F9A738)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Let's build.</span>
          </h1>

          <p style={{ color: S.muted, fontSize: "1rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
            Your spot is secured. A welcome email with all session details is on its way to your inbox from{" "}
            <span style={{ color: "#fff" }}>arfa_edu@tiblogics.com</span>.
          </p>
        </div>

        {/* ── Confirmation number ── */}
        {confirmationNumber && (
          <div className="fade3" style={{
            background: "rgba(244,124,76,.07)", border: "1px solid rgba(244,124,76,.25)",
            borderRadius: "18px", padding: "20px 24px", textAlign: "center", marginBottom: "20px",
          }}>
            <div style={{ fontFamily: dm, fontSize: ".72rem", color: S.orange, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "6px" }}>
              Your Confirmation Number
            </div>
            <div style={{
              fontFamily: syne, fontWeight: 800, fontSize: "clamp(1.3rem,4vw,1.8rem)", letterSpacing: ".06em",
              background: "linear-gradient(135deg,#F47C4C,#F9A738)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              whiteSpace: "nowrap",
            }}>
              {confirmationNumber}
            </div>
          </div>
        )}

        {/* ── Event details ── */}
        <div className="fade3" style={{
          background: S.dark, border: `1px solid ${S.border}`,
          borderRadius: "18px", padding: "22px 24px", marginBottom: "28px",
        }}>
          <div style={{ fontFamily: dm, fontSize: ".7rem", color: S.muted, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "16px" }}>
            Event Details
          </div>
          <div style={{ fontFamily: syne, fontWeight: 700, fontSize: "1.05rem", marginBottom: "14px" }}>{eventTitle}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {eventDate && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "1rem", width: "22px", textAlign: "center" }}>📅</span>
                <span style={{ fontSize: ".88rem", color: "#C8D8E0" }}>{fmtDate(eventDate)}</span>
              </div>
            )}
            {eventTimeSlot && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "1rem", width: "22px", textAlign: "center" }}>⏰</span>
                <span style={{ fontSize: ".88rem", color: "#C8D8E0" }}>{eventTimeSlot}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "1rem", width: "22px", textAlign: "center" }}>📍</span>
              <span style={{ fontSize: ".88rem", color: "#C8D8E0" }}>{eventLocation}</span>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "1rem", width: "22px", textAlign: "center" }}>💳</span>
              <span style={{ fontSize: ".88rem", color: "#4ade80", fontWeight: 600 }}>{priceStr} — Paid ✓</span>
            </div>
          </div>
        </div>

        {/* ── Invite a friend ── */}
        <div className="fade4" style={{
          background: "linear-gradient(135deg,rgba(244,124,76,.08),rgba(249,167,56,.04))",
          border: "1px solid rgba(244,124,76,.2)", borderRadius: "18px", padding: "26px 24px", marginBottom: "28px",
        }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "10px", animation: "float 3s ease-in-out infinite" }}>🚀</div>
            <div style={{ fontFamily: syne, fontWeight: 800, fontSize: "1.15rem", marginBottom: "8px" }}>
              Know someone who should join?
            </div>
            <div style={{ color: S.muted, fontSize: ".85rem", lineHeight: 1.65, maxWidth: "380px", margin: "0 auto" }}>
              Seats are limited — share the event with a friend and let them grab their spot before it fills up.
            </div>
          </div>

          {/* Copy link */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            background: "rgba(255,255,255,.04)", border: `1px solid ${S.border}`,
            borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
          }}>
            <span style={{ fontSize: ".82rem", color: S.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {eventUrl}
            </span>
            <button onClick={copyLink} className="copy-btn" style={{
              background: copied ? "rgba(74,222,128,.15)" : "rgba(244,124,76,.12)",
              border: `1px solid ${copied ? "rgba(74,222,128,.3)" : "rgba(244,124,76,.3)"}`,
              color: copied ? "#4ade80" : S.orange,
              borderRadius: "8px", padding: "6px 14px", cursor: "pointer",
              fontFamily: dm, fontSize: ".78rem", fontWeight: 600, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>
          </div>

          {/* Social share */}
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
            <ShareBtn
              href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
              bg="rgba(37,211,102,.15)" icon="💬" label="WhatsApp"
            />
            <ShareBtn
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              bg="rgba(29,155,240,.15)" icon="𝕏" label="Twitter / X"
            />
            <ShareBtn
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
              bg="rgba(10,102,194,.15)" icon="in" label="LinkedIn"
            />
            <ShareBtn
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              bg="rgba(24,119,242,.15)" icon="f" label="Facebook"
            />
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="fade5" style={{ textAlign: "center" }}>
          <a href={eventUrl} style={{
            display: "inline-block", fontFamily: dm, fontSize: ".85rem",
            color: S.muted, textDecoration: "none", borderBottom: `1px solid ${S.border}`,
            paddingBottom: "2px",
          }}>
            ← Back to event page
          </a>
          <div style={{ marginTop: "32px", color: "rgba(255,255,255,.18)", fontSize: ".72rem" }}>
            © 2026 TIBLOGICS · arfa_edu@tiblogics.com
          </div>
        </div>

      </div>
    </div>
  );
}
