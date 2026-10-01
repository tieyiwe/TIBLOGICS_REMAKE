import { ImageResponse } from "next/og";
import { ogFonts, OG_SIZE } from "@/lib/og/brand-card";
import { loadVerifiedBadge } from "@/lib/learn/skill-badges/engine";
import { readCredential } from "@/lib/learn/skill-badges/credential";
import { BADGE_NAVY, BADGE_ORANGE, FAMILY_LABEL_EN, glyphFor } from "@/lib/learn/skill-badges/catalog";
import { badgeSvg } from "@/lib/learn/skill-badges/svg";

// Share preview for a skill badge: the badge image, its name and the
// earner's display name. Private, unknown or invalid badges get a plain card.
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "TIBLOGICS verified skill badge";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await loadVerifiedBadge(id);
  const show = !!b && b.award.isPublic && b.status !== "invalid";
  const v = show ? readCredential(b!.credential) : null;
  // A private badge gets the generic card: not even its name.
  const name = (show && (v?.achievementName || b?.award.name)) || "Verified skill badge";
  const svg = show
    ? badgeSvg({ glyph: glyphFor(b!.award.badgeKey), kicker: FAMILY_LABEL_EN[b!.award.family], name, footer: String(b!.award.issuedAt.getUTCFullYear()) })
    : null;
  const status = !show ? "" : b.status === "verified" ? "Verified" : b.status === "revoked" ? "Revoked" : b.status === "unsigned" ? "Unsigned" : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          display: "flex",
          alignItems: "center",
          background: `linear-gradient(135deg, #0D1B2A 0%, #132C52 50%, ${BADGE_NAVY} 100%)`,
          fontFamily: "Instrument Sans, sans-serif",
          padding: "0 72px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: 12, height: OG_SIZE.height, background: BADGE_ORANGE, display: "flex" }} />
        {svg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} width={420} height={420} alt="" />
        ) : (
          <div style={{ width: 420, height: 420, display: "flex" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 56, width: 620 }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "white" }}>
            TIB<span style={{ color: BADGE_ORANGE }}>LOGICS</span>
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 22, fontWeight: 700, letterSpacing: 3, color: BADGE_ORANGE }}>
            {show ? FAMILY_LABEL_EN[b!.award.family].toUpperCase() : "SKILL BADGE"}
          </div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 56, fontWeight: 700, lineHeight: 1.08, color: "white" }}>{name}</div>
          {v?.displayName && (
            <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "rgba(255,255,255,0.8)" }}>Earned by {v.displayName}</div>
          )}
          {status && (
            <div
              style={{
                display: "flex",
                marginTop: 28,
                alignSelf: "flex-start",
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 700,
                color: "white",
                background: status === "Verified" ? "#15803D" : status === "Revoked" ? "#B91C1C" : "#92400E",
              }}
            >
              {status === "Verified" ? "Verified Open Badge" : status}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
