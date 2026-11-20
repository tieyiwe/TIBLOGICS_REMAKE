import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { AXIS_LABEL_KEY, AXIS_NAME_KEY, SKILL_AXES, type SkillProfile } from "@/lib/learn/skills/axes";
import ShareLinkButton from "./ShareLinkButton";

// The skills radar: six axes scored 0-100 from quizzes, labs and
// micro-checks (lib/learn/skills/radar.ts). Plain inline SVG; the chart is
// one image with a summary label, and the values are listed in text right
// under it (the list is what the image's aria-describedby points to).
//
// `sharePath` is the public portfolio link (/p/<slug>) when the learner's
// portfolio is public with this section shown; null otherwise.

const VB_W = 440;
const VB_H = 330;
const CX = VB_W / 2;
const CY = 168;
const R = 112;
const RINGS = [25, 50, 75, 100];

function point(i: number, value: number): [number, number] {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  const r = (R * Math.max(0, Math.min(100, value))) / 100;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

const pts = (values: number[]) => values.map((v, i) => point(i, v).map((n) => n.toFixed(1)).join(",")).join(" ");

export default async function SkillsRadarCard({
  profile,
  publicView,
  sharePath = null,
  idPrefix = "skills",
}: {
  profile: SkillProfile;
  publicView: boolean;
  sharePath?: string | null;
  idPrefix?: string;
}) {
  const t = await getT();
  const values = SKILL_AXES.map((a) => profile.axes.find((x) => x.axis === a)?.score ?? 0);
  const listId = `${idPrefix}-values`;
  const summary = t("learn.radar.aria", {
    list: SKILL_AXES.map((a, i) => `${t(AXIS_NAME_KEY[a])} ${values[i]}`).join(", "),
  });

  return (
    <section aria-labelledby={`${idPrefix}-h`} className="rounded-2xl border border-[var(--border)] bg-white p-5" data-testid="skills-radar">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${idPrefix}-h`} className="flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
            <span aria-hidden="true">🕸️</span> {t("learn.radar.title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--ink2)]">
            {t(publicView ? "learn.radar.explainPublic" : "learn.radar.explain")}
          </p>
        </div>
        {sharePath && <ShareLinkButton path={sharePath} />}
      </div>

      {profile.results === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-5 text-center text-sm text-[var(--ink3)]" data-testid="skills-radar-empty">
          {t(publicView ? "learn.radar.emptyPublic" : "learn.radar.empty")}
        </p>
      ) : (
        <div className="mt-4 grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            role="img"
            aria-label={summary}
            aria-describedby={listId}
            className="mx-auto h-auto w-full max-w-[440px]"
          >
            {RINGS.map((ring) => (
              <polygon
                key={ring}
                points={pts(SKILL_AXES.map(() => ring))}
                fill={ring === 100 ? "#F7FAFD" : "none"}
                stroke="#C3CFDD"
                strokeWidth={ring === 100 ? 1.5 : 1}
              />
            ))}
            {SKILL_AXES.map((a, i) => {
              const [x, y] = point(i, 100);
              return <line key={a} x1={CX} y1={CY} x2={x} y2={y} stroke="#C3CFDD" strokeWidth={1} />;
            })}
            <text x={CX + 4} y={CY - R / 2 - 2} fontSize={10} fill="#5B6B7D">50</text>
            <text x={CX + 4} y={CY - R - 2} fontSize={10} fill="#5B6B7D">100</text>
            <polygon points={pts(values)} fill="rgba(244,124,32,0.28)" stroke="#C25200" strokeWidth={2.5} strokeLinejoin="round" />
            {values.map((v, i) => {
              const [x, y] = point(i, v);
              return <circle key={i} cx={x} cy={y} r={4} fill="#C25200" stroke="#fff" strokeWidth={1.5} />;
            })}
            {SKILL_AXES.map((a, i) => {
              const ang = ((-90 + i * 60) * Math.PI) / 180;
              const cos = Math.cos(ang);
              const sin = Math.sin(ang);
              const x = CX + (R + 14) * cos;
              const y = CY + (R + 14) * sin + (sin < -0.5 ? -4 : sin > 0.5 ? 14 : 4);
              const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
              return (
                <text key={a} x={x} y={y} textAnchor={anchor} fontSize={16} fontWeight={700} fill="#1F2D3D">
                  {t(AXIS_LABEL_KEY[a])}
                </text>
              );
            })}
          </svg>

          <div>
            <ul id={listId} className="space-y-2" aria-label={t("learn.radar.listLabel")}>
              {SKILL_AXES.map((a, i) => (
                <li key={a} className="text-sm" data-testid={`skills-axis-${a}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 font-semibold text-[var(--ink)]">{t(AXIS_NAME_KEY[a])}</span>
                    <span className="shrink-0 font-black text-[var(--ink)]">
                      {values[i]}
                      <span className="sr-only"> / 100</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]" aria-hidden="true">
                    <div className="h-full rounded-full bg-[#C25200]" style={{ width: `${values[i]}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            {(profile.strongest || profile.weakest) && (
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink2)]" data-testid="skills-radar-extremes">
                {profile.strongest && (
                  <>
                    {t("learn.radar.strongest")} <strong className="text-[var(--ink)]">{t(AXIS_NAME_KEY[profile.strongest])}</strong>
                    .{" "}
                  </>
                )}
                {profile.weakest && (
                  <>
                    {t(publicView ? "learn.radar.weakestPublic" : "learn.radar.weakest")}{" "}
                    <strong className="text-[var(--ink)]">{t(AXIS_NAME_KEY[profile.weakest])}</strong>.
                  </>
                )}
              </p>
            )}
            <p className="mt-2 text-xs text-[var(--ink3)]">{t("learn.radar.basis", { n: profile.results })}</p>
            {!publicView && !sharePath && (
              <p className="mt-2 text-xs text-[var(--ink3)]">
                {t("learn.radar.shareHint")}{" "}
                <Link href="#pf-share-h" className="font-semibold text-[var(--blue2)] underline">
                  {t("learn.radar.shareHintLink")}
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
