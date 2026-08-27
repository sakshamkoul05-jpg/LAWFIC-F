/**
 * The company's own facts.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  THIS FILE IS A CHECKLIST. Every `null` below is something only LAWFIC can
 *  supply, and several of them are legally required to appear on the site:
 *
 *   • CIN — Companies Act 2013 s.12 and Rule 26. Must be displayed on the
 *     website. Penalty for omission is ₹1,000 per day, on the company and on
 *     every officer in default.
 *   • Registered address, customer-care contact, and a named GRIEVANCE
 *     OFFICER — Consumer Protection (E-Commerce) Rules 2020. The officer must
 *     acknowledge complaints within 48 hours and resolve within one month.
 *
 *  Nothing here is invented. A `null` renders as nothing in production rather
 *  than as a plausible-looking placeholder, because a fabricated CIN or a fake
 *  support number is worse than a gap — it is a false statement about a real
 *  company. Run `missingCompanyFacts()` to see what is still outstanding; the
 *  footer surfaces it in development only.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type CompanyFacts = {
  /** Trading name. Safe to state. */
  brand: string;
  /** Full registered name, e.g. "Lawfic Advisory Private Limited". */
  legalName: string | null;
  /** 21-character Corporate Identity Number. Legally required on the site. */
  cin: string | null;
  gstin: string | null;
  registeredAddress: Address | null;
  /** Where customers actually walk in, if different. */
  officeAddress: Address | null;
  supportEmail: string | null;
  supportPhone: string | null;
  whatsapp: string | null;
  /** Required by the E-Commerce Rules, and must be a real person. */
  grievanceOfficer: { name: string; designation: string; email: string; phone?: string } | null;
  supportHours: string;
  foundedYear: number | null;
};

export const company: CompanyFacts = {
  brand: "LAWFIC",

  // ── Fill these in ───────────────────────────────────────────────────────
  legalName: null,
  cin: null,
  gstin: null,
  registeredAddress: null,
  officeAddress: null,
  supportEmail: null,
  supportPhone: null,
  whatsapp: null,
  grievanceOfficer: null,
  foundedYear: null,
  // ────────────────────────────────────────────────────────────────────────

  // Safe to state now; change if the real hours differ.
  supportHours: "Monday to Saturday, 10:00–19:00 IST",
};

/**
 * Numbers LAWFIC can put its name to.
 *
 * Deliberately empty. Every one of these is a claim about the real world, and
 * an invented "12,000+ businesses served" on a compliance company's own site is
 * the exact thing that gets a compliance company in trouble. Add them when they
 * are true and sourced; the UI shows nothing until then.
 */
export type Proof = { value: string; label: string; note?: string };

export const proofPoints: Proof[] = [];

/** Third-party review profiles, once they exist. */
export const reviewProfiles: { platform: string; url: string; rating?: string; count?: number }[] = [];

/* ------------------------------------------------------------- helpers -- */

export const hasContact = Boolean(
  company.supportEmail || company.supportPhone || company.whatsapp
);

export function formatAddress(a: Address): string {
  return [a.line1, a.line2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(", ");
}

/** What is still outstanding, and whether the law cares. */
export function missingCompanyFacts(): { field: string; why: string; legal: boolean }[] {
  const out: { field: string; why: string; legal: boolean }[] = [];
  const need = (cond: boolean, field: string, why: string, legal = false) => {
    if (cond) out.push({ field, why, legal });
  };

  need(!company.legalName, "legalName", "E-Commerce Rules 2020 — legal name must be displayed", true);
  need(!company.cin, "cin", "Companies Act s.12 — ₹1,000/day penalty for omission", true);
  need(!company.registeredAddress, "registeredAddress", "E-Commerce Rules 2020 — registered office address", true);
  need(!company.grievanceOfficer, "grievanceOfficer", "E-Commerce Rules 2020 — named officer, 48h acknowledgement", true);
  need(!company.supportEmail && !company.supportPhone, "supportEmail / supportPhone", "E-Commerce Rules 2020 — customer care contact", true);
  need(!company.gstin, "gstin", "Needed on invoices once GST-registered", false);
  need(proofPoints.length === 0, "proofPoints", "No social proof — the site reads as unlaunched without it", false);

  return out;
}
