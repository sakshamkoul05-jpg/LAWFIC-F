/**
 * The compliance calendar: which returns a business owes, and when.
 *
 * ⚠ THESE ARE STATUTORY DUE DATES AND THEY MOVE.
 *
 * CBIC, CBDT and the MCA extend dates by notification, sometimes days before
 * they fall. The rules below are the standing dates in the Acts and Rules; an
 * extension is a one-line override in EXTENSIONS at the bottom, not a hunt
 * through components. Somebody must look at that list whenever a circular
 * lands — a calendar that tells a customer they are late when the date was
 * extended is merely annoying, but one that tells them they are on time after
 * an extension was withdrawn costs them a penalty.
 *
 * WHY IT IS COMPUTED, NOT STORED
 *
 * The calendar is a pure function of the business's answers and today's date.
 * Nothing here touches the database. The only stored fact is that a customer
 * has filed something (compliance_filings), keyed by the stable `key` each
 * obligation gets here — "GSTR3B:2026-09" means the September 2026 GSTR-3B for
 * every business, forever, so a rule change never orphans a filing record.
 *
 * DATES ARE PLAIN STRINGS
 *
 * Every date is "YYYY-MM-DD" with no time and no zone. A due date in India is
 * a calendar day in IST; turning it into a JavaScript Date at UTC midnight
 * makes it the previous evening for a reader in IST, which is exactly how a
 * calendar ends up one day early.
 */

export type EntityType = "proprietorship" | "partnership" | "llp" | "opc" | "pvt_ltd";
export type GstScheme = "none" | "monthly" | "qrmp" | "composition";

export type BusinessProfile = {
  entity: EntityType;
  /** Two-letter code from lib/states.ts. Only matters for QRMP's GSTR-3B date. */
  state?: string;
  gst: GstScheme;
  /** Pays salaries covered by PF / ESI. */
  employees: boolean;
  /** Deducts tax at source — rent, contractors, professional fees, salaries. */
  tds: boolean;
  /** Accounts must be audited under section 44AB. Companies are always audited
      under the Companies Act; this flag is about the income-tax audit. */
  taxAudit: boolean;
};

export const ENTITY_LABELS: Record<EntityType, string> = {
  proprietorship: "Sole proprietorship",
  partnership: "Partnership firm",
  llp: "LLP",
  opc: "One Person Company",
  pvt_ltd: "Private limited company",
};

export const GST_LABELS: Record<GstScheme, string> = {
  none: "Not registered for GST",
  monthly: "GST — monthly returns",
  qrmp: "GST — quarterly (QRMP)",
  composition: "GST — composition scheme",
};

export type Authority = "GST" | "Income Tax" | "MCA" | "EPFO / ESIC";

export type ComplianceEvent = {
  /** Stable across rule changes. "<CODE>:<period>". */
  key: string;
  code: string;
  title: string;
  /** What it is, in one line a non-accountant can follow. */
  what: string;
  authority: Authority;
  /** "YYYY-MM-DD", IST calendar day. */
  due: string;
  /** Human period, e.g. "Sep 2026" or "FY 2025–26". */
  period: string;
  /** A catalogue slug LAWFIC can be asked to file it under, where one exists. */
  serviceSlug?: string;
  /** Shown when the obligation only applies in some cases. */
  caveat?: string;
  /** Applies only above a threshold we do not ask about. Shown, but never
      counted against the health score — a business below the threshold would
      otherwise be marked down for something it does not owe. */
  conditional?: boolean;
};

/* ── date helpers, on strings ─────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");

export function ymd(y: number, m: number, d: number): string {
  // m is 1–12. Normalise overflow (month 13 → January next year).
  const yy = y + Math.floor((m - 1) / 12);
  const mm = ((m - 1) % 12 + 12) % 12 + 1;
  const last = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  return `${yy}-${pad(mm)}-${pad(Math.min(d, last))}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(y: number, m: number): string {
  return `${MONTHS[m - 1]} ${y}`;
}

function fyLabel(fy: number): string {
  return `FY ${fy}–${String(fy + 1).slice(2)}`;
}

/** The financial year (by its starting calendar year) a date falls in. */
export function fyOf(date: string): number {
  const [y, m] = date.split("-").map(Number);
  return m >= 4 ? y : y - 1;
}

/** Whole days from a to b, both "YYYY-MM-DD". Positive when b is later. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Today in IST, as "YYYY-MM-DD", whatever zone the server runs in. */
export function todayIST(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;
}

/* ── the rules ─────────────────────────────────────────────────────────── */

/**
 * States whose QRMP filers have GSTR-3B due on the 22nd; everyone else files
 * on the 24th. Notification 1/2021 – Central Tax and its successors.
 */
const QRMP_22ND = new Set([
  "CT", "MP", "GJ", "MH", "KA", "GA", "KL", "TN", "TG", "AP",
  "DH", "PY", "AN", "LD",
]);

/** Months of a financial year in order: April (4) of `fy` to March (3) of fy+1. */
function fyMonths(fy: number): { y: number; m: number }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = ((3 + i) % 12) + 1;
    return { y: m >= 4 ? fy : fy + 1, m };
  });
}

/** Every obligation that arises from financial year `fy` (April fy – March fy+1). */
export function obligationsForFy(p: BusinessProfile, fy: number): ComplianceEvent[] {
  const out: ComplianceEvent[] = [];
  const isCompany = p.entity === "pvt_ltd" || p.entity === "opc";
  const months = fyMonths(fy);

  /* GST ------------------------------------------------------------------ */
  if (p.gst === "monthly") {
    for (const { y, m } of months) {
      const per = `${y}-${pad(m)}`;
      out.push({
        key: `GSTR1:${per}`,
        code: "GSTR-1",
        title: "GSTR-1",
        what: "Your outward sales for the month, invoice by invoice.",
        authority: "GST",
        due: ymd(y, m + 1, 11),
        period: monthLabel(y, m),
        serviceSlug: "gst-returns",
      });
      out.push({
        key: `GSTR3B:${per}`,
        code: "GSTR-3B",
        title: "GSTR-3B and GST payment",
        what: "The summary return, and the tax for the month paid in cash.",
        authority: "GST",
        due: ymd(y, m + 1, 20),
        period: monthLabel(y, m),
        serviceSlug: "gst-returns",
      });
    }
  }

  if (p.gst === "qrmp") {
    const threeB = p.state && QRMP_22ND.has(p.state) ? 22 : 24;
    for (let q = 0; q < 4; q++) {
      const qMonths = months.slice(q * 3, q * 3 + 3);
      const last = qMonths[2];
      const per = `${fy}-Q${q + 1}`;
      const label = `Q${q + 1} ${fyLabel(fy)}`;
      // PMT-06 for the first two months of the quarter.
      for (const { y, m } of qMonths.slice(0, 2)) {
        out.push({
          key: `PMT06:${y}-${pad(m)}`,
          code: "PMT-06",
          title: "GST monthly payment (PMT-06)",
          what: "Tax for the month, paid by challan. No return that month under QRMP.",
          authority: "GST",
          due: ymd(y, m + 1, 25),
          period: monthLabel(y, m),
          serviceSlug: "gst-returns",
          caveat: "Not needed if there is no tax payable after input credit.",
          conditional: true,
        });
      }
      out.push({
        key: `GSTR1Q:${per}`,
        code: "GSTR-1 (QRMP)",
        title: "GSTR-1, quarterly",
        what: "The quarter's outward sales, invoice by invoice.",
        authority: "GST",
        due: ymd(last.y, last.m + 1, 13),
        period: label,
        serviceSlug: "gst-returns",
      });
      out.push({
        key: `GSTR3BQ:${per}`,
        code: "GSTR-3B (QRMP)",
        title: "GSTR-3B, quarterly",
        what: "The quarter's summary return and the balance of tax.",
        authority: "GST",
        due: ymd(last.y, last.m + 1, threeB),
        period: label,
        serviceSlug: "gst-returns",
      });
    }
  }

  if (p.gst === "composition") {
    for (let q = 0; q < 4; q++) {
      const last = months[q * 3 + 2];
      out.push({
        key: `CMP08:${fy}-Q${q + 1}`,
        code: "CMP-08",
        title: "CMP-08 composition payment",
        what: "The quarter's tax at the composition rate.",
        authority: "GST",
        due: ymd(last.y, last.m + 1, 18),
        period: `Q${q + 1} ${fyLabel(fy)}`,
        serviceSlug: "gst-returns",
      });
    }
    out.push({
      key: `GSTR4:${fy}`,
      code: "GSTR-4",
      title: "GSTR-4 annual return",
      what: "The composition dealer's return for the year.",
      authority: "GST",
      due: ymd(fy + 1, 4, 30),
      period: fyLabel(fy),
      serviceSlug: "gst-returns",
    });
  }

  if (p.gst === "monthly" || p.gst === "qrmp") {
    out.push({
      key: `GSTR9:${fy}`,
      code: "GSTR-9",
      title: "GSTR-9 annual return",
      what: "The year's GST reconciled in one return.",
      authority: "GST",
      due: ymd(fy + 1, 12, 31),
      period: fyLabel(fy),
      serviceSlug: "gst-returns",
      caveat: "Optional where aggregate turnover is up to ₹2 crore.",
      conditional: true,
    });
  }

  /* TDS ------------------------------------------------------------------ */
  if (p.tds) {
    for (const { y, m } of months) {
      out.push({
        key: `TDSPAY:${y}-${pad(m)}`,
        code: "TDS payment",
        title: "Deposit TDS deducted",
        what: "Tax you deducted from payments this month, paid to the government.",
        authority: "Income Tax",
        // March's deductions are due 30 April; every other month the 7th.
        due: m === 3 ? ymd(y, 4, 30) : ymd(y, m + 1, 7),
        period: monthLabel(y, m),
        serviceSlug: "tds-returns",
      });
    }
    const tdsReturnDue = [ymd(fy, 7, 31), ymd(fy, 10, 31), ymd(fy + 1, 1, 31), ymd(fy + 1, 5, 31)];
    tdsReturnDue.forEach((due, q) => {
      out.push({
        key: `TDSRET:${fy}-Q${q + 1}`,
        code: "24Q / 26Q",
        title: "Quarterly TDS return",
        what: "Who you deducted from, and how much — what builds their Form 16 / 16A.",
        authority: "Income Tax",
        due,
        period: `Q${q + 1} ${fyLabel(fy)}`,
        serviceSlug: "tds-returns",
      });
    });
  }

  /* Advance tax ---------------------------------------------------------- */
  const advance: [number, number, number, string][] = [
    [fy, 6, 15, "15% of the year's tax"],
    [fy, 9, 15, "45% cumulative"],
    [fy, 12, 15, "75% cumulative"],
    [fy + 1, 3, 15, "100%"],
  ];
  advance.forEach(([y, m, d, share], i) => {
    out.push({
      key: `ADVTAX:${fy}-${i + 1}`,
      code: "Advance tax",
      title: `Advance tax instalment ${i + 1}`,
      what: `Pay ${share} of the estimated tax for ${fyLabel(fy)}.`,
      authority: "Income Tax",
      due: ymd(y, m, d),
      period: fyLabel(fy),
      caveat: "Only if the year's tax after TDS is ₹10,000 or more. Presumptive-scheme businesses pay it all by 15 March.",
      conditional: true,
    });
  });

  /* Income tax return ---------------------------------------------------- */
  const auditedForTax = isCompany || p.taxAudit;
  if (p.taxAudit) {
    out.push({
      key: `TAXAUDIT:${fy}`,
      code: "Form 3CA/3CB-3CD",
      title: "Tax audit report",
      what: "The auditor's report under section 44AB, filed before the return.",
      authority: "Income Tax",
      due: ymd(fy + 1, 9, 30),
      period: fyLabel(fy),
    });
  }
  out.push({
    key: `ITR:${fy}`,
    code: isCompany ? "ITR-6" : p.entity === "proprietorship" ? "ITR-3 / ITR-4" : "ITR-5",
    title: "Income tax return",
    what: "The year's income and tax, for the business.",
    authority: "Income Tax",
    due: auditedForTax ? ymd(fy + 1, 10, 31) : ymd(fy + 1, 7, 31),
    period: fyLabel(fy),
    serviceSlug: "itr-filing",
  });

  /* Companies ------------------------------------------------------------ */
  if (isCompany) {
    out.push({
      key: `DPT3:${fy}`,
      code: "DPT-3",
      title: "DPT-3 return of deposits",
      what: "Money the company received that is not share capital — including loans from directors.",
      authority: "MCA",
      due: ymd(fy + 1, 6, 30),
      period: fyLabel(fy),
      serviceSlug: "roc-filings",
    });
    /* DIR-3 KYC is no longer annual. From 31 March 2026 (Companies
       (Appointment and Qualification of Directors) Amendment Rules, notified
       31 December 2025) each director files once every three financial years,
       by 30 June of the third. Which year that is depends on the director, not
       the company, so it cannot be put on a company calendar without asking —
       a wrong annual date here showed every company as overdue. Track it as a
       renewal on the dashboard instead. */
    out.push({
      key: `AOC4:${fy}`,
      code: p.entity === "opc" ? "AOC-4 (OPC)" : "AOC-4",
      title: "Financial statements (AOC-4)",
      what: "The audited accounts, filed with the registrar.",
      authority: "MCA",
      // OPC: 180 days from year end. Others: 30 days from an AGM held by 30 September.
      due: p.entity === "opc" ? ymd(fy + 1, 9, 27) : ymd(fy + 1, 10, 30),
      period: fyLabel(fy),
      serviceSlug: "roc-filings",
      caveat: p.entity === "opc" ? undefined : "Assumes the AGM is held on the last permitted day, 30 September.",
    });
    out.push({
      key: `MGT7:${fy}`,
      code: p.entity === "opc" ? "MGT-7A" : "MGT-7 / MGT-7A",
      title: "Annual return",
      what: "Shareholders, directors and meetings for the year.",
      authority: "MCA",
      due: ymd(fy + 1, 11, 29),
      period: fyLabel(fy),
      serviceSlug: "roc-filings",
    });
  }

  /* LLPs ----------------------------------------------------------------- */
  if (p.entity === "llp") {
    out.push({
      key: `LLP11:${fy}`,
      code: "Form 11",
      title: "LLP annual return (Form 11)",
      what: "Partners and contributions as at 31 March.",
      authority: "MCA",
      due: ymd(fy + 1, 5, 30),
      period: fyLabel(fy),
      serviceSlug: "roc-filings",
    });
    out.push({
      key: `LLP8:${fy}`,
      code: "Form 8",
      title: "LLP statement of account (Form 8)",
      what: "The accounts and the solvency statement.",
      authority: "MCA",
      due: ymd(fy + 1, 10, 30),
      period: fyLabel(fy),
      serviceSlug: "roc-filings",
    });
  }

  /* Payroll -------------------------------------------------------------- */
  if (p.employees) {
    for (const { y, m } of months) {
      out.push({
        key: `PFESI:${y}-${pad(m)}`,
        code: "PF ECR / ESI",
        title: "PF and ESI contributions",
        what: "The month's provident fund and ESI, deposited with the return.",
        authority: "EPFO / ESIC",
        due: ymd(y, m + 1, 15),
        period: monthLabel(y, m),
        serviceSlug: "pf-registration",
        caveat: "PF applies from 20 employees, ESI from 10 — earlier if you registered voluntarily.",
      });
    }
  }

  return out.map(applyExtension);
}

/**
 * Notified extensions, by key. Add an entry when CBIC / CBDT / MCA moves a
 * date; delete it once the period has passed. Empty is the honest default.
 */
export const EXTENSIONS: Record<string, { due: string; note: string }> = {};

function applyExtension(e: ComplianceEvent): ComplianceEvent {
  const ext = EXTENSIONS[e.key];
  return ext ? { ...e, due: ext.due, caveat: ext.note } : e;
}

/**
 * The calendar for a window around `today`: everything due from `back` days
 * ago to `ahead` days ahead, sorted by date. Obligations are generated for the
 * three financial years that can land in that window and de-duplicated by key.
 */
export function buildCalendar(
  p: BusinessProfile,
  today: string,
  { back = 90, ahead = 365 }: { back?: number; ahead?: number } = {},
): ComplianceEvent[] {
  const from = addDays(today, -back);
  const to = addDays(today, ahead);
  const fy = fyOf(today);
  const seen = new Set<string>();
  const all: ComplianceEvent[] = [];
  for (const f of [fy - 2, fy - 1, fy, fy + 1]) {
    for (const e of obligationsForFy(p, f)) {
      if (seen.has(e.key)) continue;
      seen.add(e.key);
      if (e.due >= from && e.due <= to) all.push(e);
    }
  }
  return all.sort((a, b) => (a.due === b.due ? a.title.localeCompare(b.title) : a.due < b.due ? -1 : 1));
}

export type EventState = "filed" | "overdue" | "due-soon" | "upcoming";

export function stateOf(e: ComplianceEvent, today: string, filed: Set<string>): EventState {
  if (filed.has(e.key)) return "filed";
  const d = daysBetween(today, e.due);
  if (d < 0) return "overdue";
  if (d <= 7) return "due-soon";
  return "upcoming";
}

/* ── profile from a URL ─────────────────────────────────────────────────── */

const ENTITIES: EntityType[] = ["proprietorship", "partnership", "llp", "opc", "pvt_ltd"];
const SCHEMES: GstScheme[] = ["none", "monthly", "qrmp", "composition"];

/**
 * Read a profile from query parameters. The free calendar and its .ics feed
 * carry the answers in the URL, so a calendar subscription works with no
 * account and no personal data — five choices and a state code.
 */
export function profileFromParams(get: (k: string) => string | null | undefined): BusinessProfile {
  const entity = get("entity");
  const gst = get("gst");
  const state = (get("state") ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  return {
    entity: ENTITIES.includes(entity as EntityType) ? (entity as EntityType) : "proprietorship",
    gst: SCHEMES.includes(gst as GstScheme) ? (gst as GstScheme) : "none",
    state: state || undefined,
    employees: get("emp") === "1",
    tds: get("tds") === "1",
    taxAudit: get("audit") === "1",
  };
}

export function profileToParams(p: BusinessProfile): string {
  const q = new URLSearchParams({ entity: p.entity, gst: p.gst });
  if (p.state) q.set("state", p.state);
  if (p.employees) q.set("emp", "1");
  if (p.tds) q.set("tds", "1");
  if (p.taxAudit) q.set("audit", "1");
  return q.toString();
}

/** A stored business row, as the calendar needs it. */
export function profileFromBusiness(b: {
  entity_type: string;
  state: string;
  gst_scheme: string;
  has_employees: boolean;
  deducts_tds: boolean;
  tax_audit: boolean;
}): BusinessProfile {
  return {
    entity: ENTITIES.includes(b.entity_type as EntityType) ? (b.entity_type as EntityType) : "proprietorship",
    gst: SCHEMES.includes(b.gst_scheme as GstScheme) ? (b.gst_scheme as GstScheme) : "none",
    state: b.state || undefined,
    employees: b.has_employees,
    tds: b.deducts_tds,
    taxAudit: b.tax_audit,
  };
}

export function formatDue(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
