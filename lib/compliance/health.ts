/**
 * The business health score: one number, 0–100, for "how am I doing?".
 *
 * IT IS ARITHMETIC, AND IT SHOWS ITS WORKING
 *
 * A score that cannot be explained is a slot machine. Every point deducted
 * here comes back as a line the dashboard prints — "GSTR-3B for August is 12
 * days overdue: −12" — so a customer can see exactly what moves it and what
 * fixing one thing is worth. No hidden weights, no model.
 */

import { daysBetween, type ComplianceEvent } from "./calendar.ts";
import { renewalState, licenceMeta } from "./renewals.ts";

export type HealthInput = {
  today: string;
  events: ComplianceEvent[];
  filed: Set<string>;
  licences: { kind: string; label: string; expires_on: string }[];
  vaultKinds: Set<string>;
};

export type HealthLine = { label: string; points: number };

export type Health = {
  score: number;
  band: "excellent" | "good" | "attention" | "at-risk";
  lines: HealthLine[];
};

const OVERDUE_EACH = 12;
const OVERDUE_MAX = 60;

export function healthScore(i: HealthInput): Health {
  const lines: HealthLine[] = [];

  /* Overdue filings in the window the calendar shows (last 90 days). */
  let overduePoints = 0;
  for (const e of i.events) {
    if (i.filed.has(e.key) || e.conditional) continue;
    const d = daysBetween(e.due, i.today);
    if (d <= 0) continue;
    const pts = Math.min(OVERDUE_EACH, OVERDUE_MAX - overduePoints);
    if (pts <= 0) break;
    overduePoints += pts;
    lines.push({ label: `${e.title} (${e.period}) is ${d} day${d === 1 ? "" : "s"} overdue`, points: -pts });
  }

  for (const l of i.licences) {
    const r = renewalState(l.kind, l.expires_on, i.today);
    const name = l.label || licenceMeta(l.kind).label;
    if (r.state === "expired") lines.push({ label: `${name} has expired`, points: -15 });
    else if (r.state === "renew-now") lines.push({ label: `${name} expires in ${r.daysLeft} days`, points: -4 });
  }

  if (!i.vaultKinds.has("pan")) lines.push({ label: "No PAN in your document vault", points: -3 });

  const total = lines.reduce((s, l) => s + l.points, 0);
  const score = Math.max(0, Math.min(100, 100 + total));
  const band = score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 50 ? "attention" : "at-risk";
  return { score, band, lines };
}

export const BAND_LABEL: Record<Health["band"], string> = {
  excellent: "Excellent",
  good: "Good",
  attention: "Needs attention",
  "at-risk": "At risk",
};
