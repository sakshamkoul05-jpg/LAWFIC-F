import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCalendar, obligationsForFy, type BusinessProfile, type EntityType, type GstScheme } from "./calendar.ts";
import { healthScore } from "./health.ts";
import { assess } from "./eligibility.ts";
import { estimatePenalty } from "./penalties.ts";
import { expectedBy } from "../orders.ts";

const ENTITIES: EntityType[] = ["proprietorship", "partnership", "llp", "opc", "pvt_ltd"];
const SCHEMES: GstScheme[] = ["none", "monthly", "qrmp", "composition"];

function* profiles(): Generator<BusinessProfile> {
  for (const entity of ENTITIES)
    for (const gst of SCHEMES)
      for (const flags of [0, 1, 2, 3, 4, 5, 6, 7])
        for (const state of ["MH", "HP"])
          yield { entity, gst, state, employees: !!(flags & 1), tds: !!(flags & 2), taxAudit: !!(flags & 4) };
}

test("every profile: valid dates, unique keys, keys match the toggle-filed format", () => {
  let n = 0;
  for (const p of profiles()) {
    const ev = obligationsForFy(p, 2026);
    const keys = new Set<string>();
    for (const e of ev) {
      assert.match(e.due, /^\d{4}-\d{2}-\d{2}$/);
      const [y, m, d] = e.due.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      assert.equal(dt.getUTCDate(), d, `${e.key} has impossible date ${e.due}`);
      assert.ok(e.due >= "2026-04-01" && e.due <= "2028-03-31", `${e.key} due ${e.due} outside FY window`);
      assert.ok(!keys.has(e.key), `duplicate ${e.key}`);
      keys.add(e.key);
      // The server action only accepts this shape — anything else could never be marked filed.
      assert.match(e.key, /^[A-Z0-9]{2,12}:[0-9A-Z-]{1,20}$/, `key ${e.key} cannot be marked filed`);
      n++;
    }
  }
  assert.ok(n > 1000);
});

test("obligations match the profile", () => {
  for (const p of profiles()) {
    const ev = obligationsForFy(p, 2026);
    const has = (prefix: string) => ev.some((e) => e.key.startsWith(prefix + ":"));
    assert.equal(has("GSTR3B"), p.gst === "monthly");
    assert.equal(has("GSTR3BQ"), p.gst === "qrmp");
    assert.equal(has("CMP08"), p.gst === "composition");
    assert.equal(has("TDSPAY"), p.tds);
    assert.equal(has("PFESI"), p.employees);
    assert.equal(has("AOC4"), p.entity === "pvt_ltd" || p.entity === "opc");
    assert.equal(has("LLP11"), p.entity === "llp");
    assert.equal(has("TAXAUDIT"), p.taxAudit);
    assert.equal(has("DIR3KYC"), false, "DIR-3 KYC is triennial now and must not be on the yearly calendar");
    assert.equal(has("ITR"), true);
    // monthly counts
    if (p.gst === "monthly") assert.equal(ev.filter((e) => e.key.startsWith("GSTR1:")).length, 12);
    if (p.gst === "qrmp") {
      assert.equal(ev.filter((e) => e.key.startsWith("PMT06:")).length, 8);
      assert.equal(ev.filter((e) => e.key.startsWith("GSTR3BQ:")).length, 4);
    }
  }
});

test("ITR date: 31 Oct for companies and audited, else 31 Jul", () => {
  for (const p of profiles()) {
    const itr = obligationsForFy(p, 2025).find((e) => e.key === "ITR:2025")!;
    const late = p.entity === "pvt_ltd" || p.entity === "opc" || p.taxAudit;
    assert.equal(itr.due, late ? "2026-10-31" : "2026-07-31", JSON.stringify(p));
  }
});

test("QRMP quarter-end dates", () => {
  const ev = obligationsForFy({ entity: "proprietorship", gst: "qrmp", state: "HP", employees: false, tds: false, taxAudit: false }, 2026);
  const g = (k: string) => ev.find((e) => e.key === k)?.due;
  assert.equal(g("GSTR1Q:2026-Q4"), "2027-04-13");
  assert.equal(g("GSTR3BQ:2026-Q4"), "2027-04-24");
  assert.equal(g("PMT06:2026-04"), "2026-05-25");
  assert.equal(g("PMT06:2026-05"), "2026-06-25");
  assert.equal(g("PMT06:2026-06"), undefined, "no PMT-06 in the quarter's third month");
});

test("health ignores conditional items (advance tax, PMT-06, optional GSTR-9)", () => {
  const p: BusinessProfile = { entity: "proprietorship", gst: "none", employees: false, tds: false, taxAudit: false };
  const events = buildCalendar(p, "2026-10-09");
  const unfiledAdvance = events.filter((e) => e.key.startsWith("ADVTAX") && e.due < "2026-10-09");
  assert.ok(unfiledAdvance.length > 0);
  const h = healthScore({ today: "2026-10-09", events, filed: new Set(), licences: [], vaultKinds: new Set(["pan"]) });
  assert.ok(!h.lines.some((l) => /Advance tax|PMT-06|GSTR-9/.test(l.label)), h.lines.map((l) => l.label).join("; "));
  // The ITR (31 July, unconditional) is genuinely overdue and is the only deduction.
  assert.deepEqual(h.lines.map((l) => l.points), [-12]);
});

test("health deductions cap at 60 for overdue items", () => {
  const p: BusinessProfile = { entity: "pvt_ltd", gst: "monthly", employees: true, tds: true, taxAudit: true };
  const events = buildCalendar(p, "2026-10-09");
  const h = healthScore({ today: "2026-10-09", events, filed: new Set(), licences: [], vaultKinds: new Set(["pan"]) });
  assert.equal(h.score, 40);
});

test("e-commerce small seller within the state is not forced to register", () => {
  const base = { state: "HP", supply: "goods" as const, food: false, importExport: false, multiState: false, employees: 0 };
  const small = assess({ ...base, turnover: 8_00_000, interState: false, ecommerce: true }).findings.find((f) => f.id === "gst")!;
  assert.equal(small.verdict, "recommended");
  const inter = assess({ ...base, turnover: 8_00_000, interState: true, ecommerce: true }).findings.find((f) => f.id === "gst")!;
  assert.equal(inter.verdict, "required");
  const big = assess({ ...base, turnover: 25_00_000, interState: false, ecommerce: true }).findings.find((f) => f.id === "gst")!;
  assert.equal(big.verdict, "required");
});

test("services seller under ₹20 lakh selling inter-state is not forced to register", () => {
  const r = assess({ state: "MH", supply: "services", turnover: 10_00_000, interState: true, ecommerce: false, food: false, importExport: false, multiState: false, employees: 0 });
  assert.notEqual(r.findings.find((f) => f.id === "gst")!.verdict, "required");
});

test("TDS deposit interest counts from the month of deduction", () => {
  // Due 7 Oct, deposited 20 Oct: 1 month late-part + deduction month = 2 months × 1.5%
  const r = estimatePenalty({ kind: "tds-payment", due: "2026-10-07", filedOn: "2026-10-20", taxDue: 10_000 });
  assert.equal(r.total, 300);
});

test("appointment turnarounds give no completion date", () => {
  assert.equal(expectedBy("Appointment in 2–4 days", "2026-10-02T06:00:00Z"), null);
  assert.ok(expectedBy("Same day", "2026-10-02T06:00:00Z"));
});
