import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addDays,
  buildCalendar,
  daysBetween,
  fyOf,
  obligationsForFy,
  profileFromParams,
  profileToParams,
  stateOf,
  todayIST,
  ymd,
  type BusinessProfile,
} from "./calendar.ts";
import { estimatePenalty, gstMonthlyCap } from "./penalties.ts";
import { assess, fssaiTier, gstThreshold } from "./eligibility.ts";
import { checkId, gstinCheckDigit } from "./identifiers.ts";
import { checkName } from "./name-check.ts";
import { healthScore } from "./health.ts";
import { renewalState } from "./renewals.ts";
import { toIcs } from "./ics.ts";
import { estimateFees, parseRupees } from "./fees.ts";
import { expectedBy } from "../orders.ts";

const base: BusinessProfile = {
  entity: "proprietorship",
  gst: "none",
  employees: false,
  tds: false,
  taxAudit: false,
};

/* ── dates ─────────────────────────────────────────────────────────────── */

test("ymd normalises month overflow and clamps the day", () => {
  assert.equal(ymd(2026, 13, 11), "2027-01-11");
  assert.equal(ymd(2026, 2, 31), "2026-02-28");
  assert.equal(ymd(2028, 2, 30), "2028-02-29");
});

test("financial year starts in April", () => {
  assert.equal(fyOf("2026-03-31"), 2025);
  assert.equal(fyOf("2026-04-01"), 2026);
});

test("day arithmetic is zone-free", () => {
  assert.equal(daysBetween("2026-10-01", "2026-10-09"), 8);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("today is computed in IST, not UTC", () => {
  // 20:00 UTC on 9 Oct is 01:30 on 10 Oct in India.
  assert.equal(todayIST(new Date("2026-10-09T20:00:00Z")), "2026-10-10");
});

/* ── calendar ──────────────────────────────────────────────────────────── */

test("monthly GST filer gets GSTR-1 on the 11th and 3B on the 20th", () => {
  const ev = obligationsForFy({ ...base, gst: "monthly" }, 2026);
  const sep1 = ev.find((e) => e.key === "GSTR1:2026-09");
  const sep3b = ev.find((e) => e.key === "GSTR3B:2026-09");
  assert.equal(sep1?.due, "2026-10-11");
  assert.equal(sep3b?.due, "2026-10-20");
  const mar = ev.find((e) => e.key === "GSTR3B:2027-03");
  assert.equal(mar?.due, "2027-04-20");
});

test("QRMP 3B date depends on the state", () => {
  const mh = obligationsForFy({ ...base, gst: "qrmp", state: "MH" }, 2026).find((e) => e.key === "GSTR3BQ:2026-Q2");
  const hp = obligationsForFy({ ...base, gst: "qrmp", state: "HP" }, 2026).find((e) => e.key === "GSTR3BQ:2026-Q2");
  assert.equal(mh?.due, "2026-10-22");
  assert.equal(hp?.due, "2026-10-24");
});

test("no GST, no GST events", () => {
  const ev = obligationsForFy(base, 2026);
  assert.ok(ev.every((e) => e.authority !== "GST"));
});

test("companies get ROC filings and an October ITR; proprietors do not", () => {
  const co = obligationsForFy({ ...base, entity: "pvt_ltd" }, 2025);
  assert.equal(co.find((e) => e.key === "AOC4:2025")?.due, "2026-10-30");
  assert.equal(co.find((e) => e.key === "MGT7:2025")?.due, "2026-11-29");
  assert.equal(co.find((e) => e.key === "ITR:2025")?.due, "2026-10-31");
  const prop = obligationsForFy(base, 2025);
  assert.equal(prop.find((e) => e.key === "ITR:2025")?.due, "2026-07-31");
  assert.ok(!prop.some((e) => e.authority === "MCA"));
});

test("March TDS is due 30 April", () => {
  const ev = obligationsForFy({ ...base, tds: true }, 2026);
  assert.equal(ev.find((e) => e.key === "TDSPAY:2027-03")?.due, "2027-04-30");
  assert.equal(ev.find((e) => e.key === "TDSPAY:2026-04")?.due, "2026-05-07");
});

test("buildCalendar is sorted, windowed and de-duplicated", () => {
  const cal = buildCalendar({ ...base, gst: "monthly", entity: "pvt_ltd", tds: true }, "2026-10-09");
  const keys = cal.map((e) => e.key);
  assert.equal(new Set(keys).size, keys.length);
  for (let i = 1; i < cal.length; i++) assert.ok(cal[i - 1].due <= cal[i].due);
  assert.ok(cal.every((e) => e.due >= "2026-07-11" && e.due <= "2027-10-09"));
});

test("event state", () => {
  const e = { key: "X:1", due: "2026-10-11" } as Parameters<typeof stateOf>[0];
  assert.equal(stateOf(e, "2026-10-09", new Set()), "due-soon");
  assert.equal(stateOf(e, "2026-10-12", new Set()), "overdue");
  assert.equal(stateOf(e, "2026-10-12", new Set(["X:1"])), "filed");
});

test("profile round-trips through a query string and rejects junk", () => {
  const p: BusinessProfile = { entity: "llp", gst: "qrmp", state: "KA", employees: true, tds: false, taxAudit: true };
  const q = new URLSearchParams(profileToParams(p));
  assert.deepEqual(profileFromParams((k) => q.get(k)), p);
  const junk = profileFromParams((k) => ({ entity: "bank", gst: "x", state: "<script>" })[k as "entity"]);
  assert.equal(junk.entity, "proprietorship");
  assert.equal(junk.gst, "none");
  assert.equal(junk.state, "SC");
});

/* ── penalties ─────────────────────────────────────────────────────────── */

test("GSTR-3B late fee is per day and capped by turnover", () => {
  assert.equal(gstMonthlyCap(1_00_00_000, false), 2_000);
  assert.equal(gstMonthlyCap(4_00_00_000, false), 5_000);
  assert.equal(gstMonthlyCap(10_00_00_000, true), 500);
  const r = estimatePenalty({ kind: "gstr3b", due: "2026-09-20", filedOn: "2026-10-09", turnover: 50_00_000 });
  assert.equal(r.daysLate, 19);
  assert.equal(r.lines[0].rupees, 950);
  const long = estimatePenalty({ kind: "gstr3b", due: "2026-01-20", filedOn: "2026-10-09", turnover: 50_00_000 });
  assert.equal(long.lines[0].rupees, 2_000);
});

test("GST interest is 18% a year on the cash liability", () => {
  const r = estimatePenalty({ kind: "gstr3b", due: "2026-09-20", filedOn: "2026-10-20", taxDue: 1_00_000 });
  assert.equal(r.lines.find((l) => l.label.startsWith("Interest"))?.rupees, Math.round((100000 * 0.18 * 30) / 365));
});

test("ITR late fee has a lower slab up to ₹5 lakh", () => {
  assert.equal(estimatePenalty({ kind: "itr", due: "2026-07-31", filedOn: "2026-08-10", totalIncome: 4_00_000 }).total, 1_000);
  assert.equal(estimatePenalty({ kind: "itr", due: "2026-07-31", filedOn: "2026-08-10", totalIncome: 9_00_000 }).total, 5_000);
});

test("TDS return fee never exceeds the TDS", () => {
  const r = estimatePenalty({ kind: "tds-return", due: "2026-07-31", filedOn: "2026-10-09", taxDue: 3_000 });
  assert.equal(r.lines[0].rupees, 3_000);
});

test("filing on time costs nothing", () => {
  assert.equal(estimatePenalty({ kind: "roc", due: "2026-10-30", filedOn: "2026-10-30" }).total, 0);
});

/* ── eligibility ───────────────────────────────────────────────────────── */

test("GST thresholds by state and supply", () => {
  assert.equal(gstThreshold("HP", "goods"), 40_00_000);
  assert.equal(gstThreshold("UK", "goods"), 20_00_000);
  assert.equal(gstThreshold("MZ", "services"), 10_00_000);
  assert.equal(gstThreshold("MH", "services"), 20_00_000);
});

test("inter-state goods sellers need GST at any turnover", () => {
  const { findings } = assess({
    state: "HP", supply: "goods", turnover: 5_00_000, interState: true, ecommerce: false,
    food: false, importExport: false, multiState: false, employees: 0,
  });
  assert.equal(findings.find((f) => f.id === "gst")?.verdict, "required");
});

test("FSSAI tiers use the 2026 limits", () => {
  assert.equal(fssaiTier(1_00_00_000, false, false).tier, "basic");
  assert.equal(fssaiTier(10_00_00_000, false, false).tier, "state");
  assert.equal(fssaiTier(60_00_00_000, false, false).tier, "central");
  assert.equal(fssaiTier(1_00_000, true, false).tier, "central");
});

/* ── identifiers ───────────────────────────────────────────────────────── */

test("GSTIN check digit", () => {
  // Built from a synthetic PAN; the digit is what the algorithm must produce.
  const body = "27AAPFU0939F1Z";
  const full = body + gstinCheckDigit(body);
  assert.equal(checkId("gstin", full).valid, true);
  const wrong = body + (full[14] === "A" ? "B" : "A");
  assert.equal(checkId("gstin", wrong).valid, false);
  assert.equal(checkId("gstin", "27AAPFU0939F1").valid, false);
});

test("PAN holder type is read from the fourth character", () => {
  const r = checkId("pan", "abcpe1234f");
  assert.equal(r.valid, true);
  assert.equal(r.facts[0].value, "Individual");
  assert.equal(checkId("pan", "ABCXE1234F").valid, false);
});

test("Udyam and CIN shapes", () => {
  assert.equal(checkId("udyam", "UDYAM-HP-02-0001234").valid, true);
  assert.equal(checkId("udyam", "UDYAM-HP-2-0001234").valid, false);
  assert.equal(checkId("cin", "U72900HP2020PTC012345").valid, true);
});

/* ── names ─────────────────────────────────────────────────────────────── */

test("all-generic names are blocked and restricted words flagged", () => {
  assert.ok(checkName("company", "Global Solutions Private Limited").issues.some((i) => i.severity === "block"));
  const bank = checkName("company", "Kangra Bank Private Limited");
  assert.ok(bank.restricted.some((r) => r.startsWith("bank")));
  const ok = checkName("company", "Dhauladhar Looms Private Limited");
  assert.ok(!ok.issues.some((i) => i.severity === "block"));
});

/* ── health, renewals ──────────────────────────────────────────────────── */

test("health score deducts and explains", () => {
  const events = buildCalendar({ ...base, gst: "monthly" }, "2026-10-09");
  const filedAll = new Set(events.map((e) => e.key));
  const clean = healthScore({ today: "2026-10-09", events, filed: filedAll, licences: [], vaultKinds: new Set(["pan"]) });
  assert.equal(clean.score, 100);
  const messy = healthScore({
    today: "2026-10-09",
    events,
    filed: new Set(),
    licences: [{ kind: "fssai", label: "", expires_on: "2026-09-01" }],
    vaultKinds: new Set(),
  });
  assert.ok(messy.score < 50);
  assert.equal(messy.score, 100 + messy.lines.reduce((s, l) => s + l.points, 0) < 0 ? 0 : 100 + messy.lines.reduce((s, l) => s + l.points, 0));
});

test("renewal warning windows", () => {
  assert.equal(renewalState("trademark", "2027-03-01", "2026-10-09").state, "renew-now");
  assert.equal(renewalState("dsc", "2027-03-01", "2026-10-09").state, "ok");
  assert.equal(renewalState("dsc", "2026-10-01", "2026-10-09").state, "expired");
});

/* ── ics ───────────────────────────────────────────────────────────────── */

test("ics has all-day events with stable UIDs and folded lines", () => {
  const events = buildCalendar({ ...base, gst: "monthly" }, "2026-10-09").slice(0, 3);
  const ics = toIcs(events, { name: "Test", siteUrl: "https://lawfic.pro", stamp: new Date("2026-10-09T00:00:00Z") });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 3);
  assert.ok(ics.includes(`UID:${events[0].key.replace(/[^A-Za-z0-9-]/g, "-")}@lawfic`));
  assert.ok(ics.split("\r\n").every((l) => l.length <= 75));
});

/* ── fees, eta ─────────────────────────────────────────────────────────── */

test("fee parsing and estimate", () => {
  assert.equal(parseRupees("₹1,499"), 1499);
  assert.equal(parseRupees("Free — there is no government fee"), 0);
  assert.equal(parseRupees("Quoted"), null);
  const e = estimateFees({ governmentRupees: 107, professionalRupees: 299, planId: "per-filing", gstRegistered: false });
  assert.equal(e.totalPaise, 40_600);
  assert.equal(e.gstPaise, 0);
  const g = estimateFees({ governmentRupees: 0, professionalRupees: 1000, planId: "per-filing", gstRegistered: true });
  assert.equal(g.gstPaise, 18_000);
});

test("expectedBy takes the upper end and skips weekends for working days", () => {
  // Friday 2 Oct 2026 + 10 working days = Friday 16 Oct.
  const d = expectedBy("7–10 working days", "2026-10-02T06:00:00Z");
  assert.equal(d?.toISOString().slice(0, 10), "2026-10-16");
  assert.equal(expectedBy("e-PAN in 48 hours", "2026-10-02T06:00:00Z")?.toISOString().slice(0, 10), "2026-10-04");
  assert.equal(expectedBy("Quoted before you commit", "2026-10-02T06:00:00Z"), null);
});
