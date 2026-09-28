// Text for recommendations, warnings, the "Copy summary" text and the CSV
// export. Pure: the caller passes the translator and the formatters.

import type { Formatters } from "./format";
import type { Recommendation, Results, Warning } from "./engine";
import { PRICES_AS_OF } from "./pricing";
import { COST_CATEGORIES } from "./types";
import type { CostLines, Inputs } from "./types";

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export const CALCULATOR_URL = "https://tiblogics.com/tools/calculator";

export function unitLabel(i: Inputs, t: Translate): string {
  return t(`calculator.unit.${i.pricingMode}`);
}

export function modelLabel(i: Inputs, name: string, t: Translate): string {
  return i.model === "custom" ? `${i.customName || t("calculator.model.custom")} (${t("calculator.model.customShort")})` : name;
}

export function recommendationText(r: Recommendation, i: Inputs, t: Translate, f: Formatters): { title: string; body: string } {
  const v: Record<string, string | number> = { ...r.vars, amount: f.money(r.amount) };
  if (typeof r.vars.pct === "number") v.pct = f.pct(r.vars.pct);
  if (typeof r.vars.from === "number") v.from = f.pct(r.vars.from);
  if (typeof r.vars.to === "number") v.to = f.pct(r.vars.to);
  if (typeof r.vars.share === "number") v.share = f.pct(r.vars.share);
  if (typeof r.vars.target === "number") v.target = f.pct(r.vars.target);
  if (typeof r.vars.price === "number") v.price = f.money(r.vars.price);
  if (typeof r.vars.mult === "number") v.mult = f.num(r.vars.mult, 1);
  if (typeof r.vars.category === "string") v.category = t(`calculator.cat.${r.vars.category}`);
  v.unit = unitLabel(i, t);
  return { title: t(`calculator.rec.${r.id}.title`, v), body: t(`calculator.rec.${r.id}.body`, v) };
}

export function warningText(w: Warning, t: Translate, f: Formatters): string {
  const v: Record<string, string | number> = {};
  if ("margin" in w.vars) v.margin = f.pct(w.vars.margin);
  if ("target" in w.vars) v.target = f.pct(w.vars.target);
  if ("cost" in w.vars) v.cost = f.money(w.vars.cost);
  if ("revenue" in w.vars) v.revenue = f.money(w.vars.revenue);
  if ("mult" in w.vars) v.mult = f.num(w.vars.mult, 1);
  if ("need" in w.vars) v.need = f.num(w.vars.need);
  if ("have" in w.vars) v.have = f.num(w.vars.have);
  return t(`calculator.warn.${w.id}`, v);
}

/** Plain text for a pitch deck or an investor email. */
export function summaryText(i: Inputs, r: Results, t: Translate, f: Formatters, description = ""): string {
  const { m, build, unit } = r;
  const unitName = unitLabel(i, t);
  const lines: string[] = [];
  lines.push(t("calculator.summary.heading"));
  if (description.trim()) lines.push(`${t("calculator.summary.product")}: ${description.trim()}`);
  lines.push(t("calculator.summary.disclaimer", { date: f.month(PRICES_AS_OF) }));
  lines.push("");
  lines.push(
    t("calculator.summary.usage", {
      users: f.num(m.users),
      per: f.num(i.interactionsPerUser),
      total: f.num(m.interactions),
      model: modelLabel(i, m.ai.primaryPrice.name, t),
    }),
  );
  lines.push(
    t("calculator.summary.running", {
      total: f.money(m.total),
      ai: f.money(m.ai.total),
      perUser: f.money(unit.costPerUser),
      perInteraction: f.moneyPrecise(m.ai.perInteraction),
    }),
  );
  if (m.revenue > 0) {
    lines.push(
      t("calculator.summary.revenue", {
        revenue: f.money(m.revenue),
        price: f.money(i.price),
        unit: unitName,
        margin: m.grossMarginPct === null ? "-" : f.pct(m.grossMarginPct),
        profit: f.money(m.profit),
      }),
    );
    lines.push(
      t("calculator.summary.breakEven", {
        users: unit.breakEvenUsers === null ? t("calculator.na") : f.num(unit.breakEvenUsers),
        months: unit.monthsToRecoverBuild === null ? t("calculator.na") : f.num(unit.monthsToRecoverBuild, 1),
      }),
    );
  }
  lines.push(
    t("calculator.summary.build", {
      low: f.money0(build.low),
      likely: f.money0(build.likely),
      high: f.money0(build.high),
      scope: t(`calculator.scope.${i.scope}`),
      hours: f.num(build.totalHours),
      rate: f.money(i.hourlyRate),
    }),
  );
  if (unit.targetPrice && unit.comfortablePrice) {
    lines.push(
      t("calculator.summary.price", {
        target: f.pct(i.targetMarginPct),
        low: f.money(unit.targetPrice),
        high: f.money(unit.comfortablePrice),
        unit: unitName,
      }),
    );
  }
  lines.push("");
  lines.push(t("calculator.summary.scenarios"));
  for (const s of r.scenarios) {
    lines.push(
      `- ${t(`calculator.scenario.${s.key}`)} (${t("calculator.summary.usersN", { n: f.num(s.m.users) })}): ${t("calculator.summary.scenarioLine", {
        cost: f.money(s.m.total),
        revenue: f.money(s.m.revenue),
        margin: s.m.grossMarginPct === null ? "-" : f.pct(s.m.grossMarginPct),
      })}`,
    );
  }
  const savings = r.recommendations.filter((x) => x.saving).slice(0, 3);
  if (savings.length) {
    lines.push("");
    lines.push(t("calculator.summary.savings"));
    for (const s of savings) lines.push(`- ${recommendationText(s, i, t, f).title}: ${f.money(s.amount)}/${t("calculator.perMonthShort")}`);
  }
  lines.push("");
  lines.push(t("calculator.summary.footer", { url: CALCULATOR_URL }));
  return lines.join("\n");
}

function csvCell(v: string | number): string {
  const s = typeof v === "number" ? (Number.isFinite(v) ? String(Math.round(v * 10000) / 10000) : "") : v;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const LINE_KEYS: (keyof CostLines)[] = [
  "aiPrimary",
  "aiRouted",
  "embeddings",
  "voice",
  "images",
  "messaging",
  "storage",
  "email",
  "paymentFees",
  "hosting",
  "database",
  "vectorDb",
  "monitoring",
  "auth",
  "support",
  "maintenance",
];

/** A CSV with raw numbers (USD) so it opens cleanly in any spreadsheet. */
export function summaryCsv(i: Inputs, r: Results, t: Translate): string {
  const rows: (string | number)[][] = [];
  const { m, build, unit } = r;
  rows.push([t("calculator.csv.section"), t("calculator.csv.item"), t("calculator.csv.launch"), t("calculator.scenario.growth"), t("calculator.scenario.scale")]);
  const sc = r.scenarios;
  const s3 = (fn: (x: (typeof sc)[number]) => number) => sc.map(fn);
  rows.push([t("calculator.csv.usage"), t("calculator.csv.users"), ...s3((x) => x.m.users)]);
  rows.push([t("calculator.csv.usage"), t("calculator.csv.interactions"), ...s3((x) => x.m.interactions)]);
  for (const k of LINE_KEYS) rows.push([t("calculator.csv.monthlyCost"), t(`calculator.line.${k}`), ...s3((x) => x.m.lines[k])]);
  for (const c of COST_CATEGORIES) rows.push([t("calculator.csv.byCategory"), t(`calculator.cat.${c}`), ...s3((x) => x.m.categories[c])]);
  rows.push([t("calculator.csv.totals"), t("calculator.csv.totalCost"), ...s3((x) => x.m.total)]);
  rows.push([t("calculator.csv.totals"), t("calculator.csv.revenue"), ...s3((x) => x.m.revenue)]);
  rows.push([t("calculator.csv.totals"), t("calculator.csv.grossMargin"), ...s3((x) => x.m.grossMarginPct ?? 0)]);
  rows.push([t("calculator.csv.totals"), t("calculator.csv.profit"), ...s3((x) => x.m.profit)]);
  rows.push([]);
  rows.push([t("calculator.csv.unit"), t("calculator.csv.costPerUser"), unit.costPerUser]);
  rows.push([t("calculator.csv.unit"), t("calculator.csv.costPerInteraction"), m.ai.perInteraction]);
  rows.push([t("calculator.csv.unit"), t("calculator.csv.contribution"), unit.contributionPerUser]);
  rows.push([t("calculator.csv.unit"), t("calculator.csv.breakEvenUsers"), unit.breakEvenUsers ?? ""]);
  rows.push([t("calculator.csv.unit"), t("calculator.csv.monthsToRecover"), unit.monthsToRecoverBuild ?? ""]);
  rows.push([t("calculator.csv.unit"), t("calculator.csv.targetPrice", { unit: unitLabel(i, t) }), unit.targetPrice ?? ""]);
  rows.push([]);
  rows.push([t("calculator.csv.build"), t("calculator.csv.hours"), build.totalHours]);
  rows.push([t("calculator.csv.build"), t("calculator.csv.rate"), i.hourlyRate]);
  rows.push([t("calculator.csv.build"), t("calculator.range.low"), build.low]);
  rows.push([t("calculator.csv.build"), t("calculator.range.likely"), build.likely]);
  rows.push([t("calculator.csv.build"), t("calculator.range.high"), build.high]);
  rows.push([]);
  rows.push([t("calculator.csv.note", { date: PRICES_AS_OF })]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
