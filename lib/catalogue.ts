/**
 * The full service catalogue — what the navigation is built from.
 *
 * This is deliberately separate from `lib/services.ts`. That file holds the
 * deep page content for the handful of services that are LIVE: fees, documents,
 * process, FAQs. This one holds every service LAWFIC intends to offer, at the
 * one-line depth a menu needs.
 *
 * Two rules keep the two honest:
 *
 *   1. every `status: "live"` entry must have a matching slug in services.ts,
 *      or the menu links to a 404. `catalogueIntegrity()` checks this and the
 *      services page calls it in development;
 *   2. a `soon` entry never links anywhere. It renders as a label with a chip,
 *      not an anchor, so the menu cannot promise a page that does not exist.
 *
 * Adding a service is one entry here. Promoting it to live is a page in
 * services.ts plus flipping the status.
 */

export type ServiceStatus = "live" | "soon";

export type CatalogueEntry = {
  slug: string;
  name: string;
  /** One line. It has to read cleanly in a menu row, so keep it short. */
  blurb: string;
  status: ServiceStatus;
  /** Extra words people search by that are not in the name. */
  aliases?: string[];
};

export type Category = {
  id: string;
  name: string;
  /** Shown at the top of the mega-menu panel when this category is active. */
  summary: string;
  icon: IconKey;
  services: CatalogueEntry[];
};

export type IconKey =
  | "identity"
  | "business"
  | "tax"
  | "licence"
  | "ip"
  | "payroll"
  | "legal";

export const categories: Category[] = [
  {
    id: "identity",
    name: "Identity & KYC",
    summary:
      "The documents everything else is built on. Get these right and the rest of the paperwork stops bouncing.",
    icon: "identity",
    services: [
      { slug: "aadhaar", name: "Aadhaar Services", blurb: "Corrections, updates and appointments", status: "live", aliases: ["uid", "biometric", "address change"] },
      { slug: "pan", name: "PAN Services", blurb: "New cards, corrections and Aadhaar linking", status: "live", aliases: ["permanent account number", "49a"] },
      { slug: "tan", name: "TAN Registration", blurb: "For anyone required to deduct TDS", status: "soon", aliases: ["tds", "deduction account"] },
      { slug: "digital-signature", name: "Digital Signature (DSC)", blurb: "Class 3 tokens for tenders and filings", status: "soon", aliases: ["dsc", "class 3", "token"] },
      { slug: "voter-id", name: "Voter ID Assistance", blurb: "New enrolment, corrections and transfers", status: "soon", aliases: ["epic", "election card"] },
      { slug: "passport", name: "Passport Assistance", blurb: "Form filling, appointments and police verification", status: "soon", aliases: ["seva kendra", "psk"] },
    ],
  },
  {
    id: "business",
    name: "Business Registration",
    summary:
      "Choosing the wrong structure costs more to unwind than it does to set up. We start with which one you actually need.",
    icon: "business",
    services: [
      { slug: "msme-udyam", name: "MSME Udyam Registration", blurb: "Collateral-free loans and tender access", status: "live", aliases: ["udyog aadhaar", "small business"] },
      { slug: "private-limited", name: "Private Limited Company", blurb: "Incorporation, DIN, MOA and AOA", status: "soon", aliases: ["pvt ltd", "incorporation", "spice"] },
      { slug: "llp", name: "LLP Registration", blurb: "Limited liability without company compliance", status: "soon", aliases: ["limited liability partnership"] },
      { slug: "opc", name: "One Person Company", blurb: "A company structure for a single founder", status: "soon", aliases: ["single founder"] },
      { slug: "partnership", name: "Partnership Firm", blurb: "Deed drafting and registration", status: "soon", aliases: ["deed"] },
      { slug: "proprietorship", name: "Sole Proprietorship", blurb: "The lightest way to start trading", status: "soon", aliases: ["sole trader"] },
      { slug: "roc-filings", name: "ROC Annual Filings", blurb: "AOC-4, MGT-7 and director KYC", status: "soon", aliases: ["mca", "annual return", "din kyc"] },
    ],
  },
  {
    id: "tax",
    name: "Tax & Filings",
    summary:
      "Registration is the easy half. Staying compliant month after month is where most businesses come unstuck.",
    icon: "tax",
    services: [
      { slug: "gst", name: "GST Registration", blurb: "A GSTIN in your name, start to finish", status: "live", aliases: ["gstin", "goods and services"] },
      { slug: "gst-returns", name: "GST Returns", blurb: "GSTR-1 and 3B, filed monthly", status: "soon", aliases: ["gstr", "3b", "monthly return"] },
      { slug: "itr-filing", name: "Income Tax Returns", blurb: "Salaried, business and presumptive", status: "soon", aliases: ["itr", "income tax", "44ad"] },
      { slug: "tds-returns", name: "TDS Returns", blurb: "Quarterly filing and Form 16", status: "soon", aliases: ["form 16", "26q", "24q"] },
      { slug: "professional-tax", name: "Professional Tax", blurb: "State registration and returns", status: "soon", aliases: ["pt", "ptrc", "ptec"] },
      { slug: "gst-cancellation", name: "GST Cancellation", blurb: "Closing a registration cleanly", status: "soon", aliases: ["surrender", "closure"] },
    ],
  },
  {
    id: "licence",
    name: "Licences & Permits",
    summary:
      "Trading without the right licence is the kind of problem that arrives with an inspector rather than a letter.",
    icon: "licence",
    services: [
      { slug: "fssai", name: "FSSAI Food Licence", blurb: "Basic, State and Central registration", status: "soon", aliases: ["food licence", "food safety", "14 digit"] },
      { slug: "trade-licence", name: "Trade Licence", blurb: "Municipal permission to operate", status: "soon", aliases: ["municipal", "corporation"] },
      { slug: "shop-establishment", name: "Shop & Establishment", blurb: "The registration most landlords ask for", status: "soon", aliases: ["gumasta", "shops act"] },
      { slug: "iec", name: "Import Export Code", blurb: "Required before your first shipment", status: "soon", aliases: ["iec", "dgft", "import", "export"] },
      { slug: "drug-licence", name: "Drug Licence", blurb: "Retail and wholesale pharmacy", status: "soon", aliases: ["pharmacy", "chemist"] },
      { slug: "iso-certification", name: "ISO Certification", blurb: "9001, 14001 and 22000", status: "soon", aliases: ["9001", "quality"] },
    ],
  },
  {
    id: "ip",
    name: "Intellectual Property",
    summary:
      "A name you have not registered is a name someone else can register. Searching first costs a fraction of fighting later.",
    icon: "ip",
    services: [
      { slug: "trademark", name: "Trademark Registration", blurb: "Search, filing and class selection", status: "soon", aliases: ["tm", "brand name", "logo"] },
      { slug: "trademark-objection", name: "Trademark Objection Reply", blurb: "Responding to an examination report", status: "soon", aliases: ["examination report", "opposition"] },
      { slug: "copyright", name: "Copyright Registration", blurb: "Software, artistic and literary work", status: "soon", aliases: ["©", "authorship"] },
      { slug: "design-registration", name: "Design Registration", blurb: "Protecting how a product looks", status: "soon", aliases: ["industrial design"] },
      { slug: "patent-search", name: "Patent Search", blurb: "Prior-art search before you file", status: "soon", aliases: ["prior art", "novelty"] },
    ],
  },
  {
    id: "payroll",
    name: "Labour & Payroll",
    summary:
      "The thresholds creep up on you. Most businesses cross into PF and ESI without noticing until a notice arrives.",
    icon: "payroll",
    services: [
      { slug: "pf-registration", name: "PF Registration", blurb: "EPFO registration and monthly ECR", status: "soon", aliases: ["epf", "epfo", "provident fund"] },
      { slug: "esi-registration", name: "ESI Registration", blurb: "ESIC registration and contributions", status: "soon", aliases: ["esic", "insurance"] },
      { slug: "labour-licence", name: "Labour Licence", blurb: "Contract labour and migrant workers", status: "soon", aliases: ["clra", "contract labour"] },
      { slug: "payroll-management", name: "Payroll Management", blurb: "Salary processing, payslips and compliance", status: "soon", aliases: ["salary", "payslip"] },
    ],
  },
  {
    id: "legal",
    name: "Legal Documents",
    summary:
      "Drafted properly, on the right stamp paper, and registered where registration is what makes it enforceable.",
    icon: "legal",
    services: [
      { slug: "rent-agreement", name: "Rent Agreement", blurb: "Drafted, stamped and registered", status: "soon", aliases: ["lease", "leave and licence", "11 month"] },
      { slug: "affidavit", name: "Affidavit Drafting", blurb: "Name change, income, residence and more", status: "soon", aliases: ["notary", "sworn statement"] },
      { slug: "legal-notice", name: "Legal Notice", blurb: "Recovery, breach and cease-and-desist", status: "soon", aliases: ["demand notice", "recovery"] },
      { slug: "noc", name: "NOC Drafting", blurb: "Landlord, society and employer consents", status: "soon", aliases: ["no objection", "consent letter"] },
      { slug: "will-drafting", name: "Will Drafting", blurb: "Simple wills and registration", status: "soon", aliases: ["testament", "succession"] },
    ],
  },
];

/* ------------------------------------------------------------------ views -- */

export const allServices: (CatalogueEntry & { categoryId: string; categoryName: string })[] =
  categories.flatMap((c) =>
    c.services.map((s) => ({ ...s, categoryId: c.id, categoryName: c.name }))
  );

export const totalServices = allServices.length;
export const liveServices = allServices.filter((s) => s.status === "live");

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

/**
 * Ranked search across name, blurb, category and aliases.
 *
 * Not fuzzy. Someone typing "gst" wants GST first, not a Levenshtein-adjacent
 * surprise — so this is substring matching with a scoring order that puts an
 * exact name prefix above a blurb mention.
 */
export function searchServices(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = allServices
    .map((s) => {
      const name = s.name.toLowerCase();
      const hay = [s.name, s.blurb, s.categoryName, ...(s.aliases ?? [])]
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 80;
      else if (s.aliases?.some((a) => a.toLowerCase().startsWith(q))) score = 70;
      else if (name.includes(q)) score = 60;
      else if (hay.includes(q)) score = 40;
      else return null;

      // A page someone can actually open beats one that is still a promise.
      if (s.status === "live") score += 15;
      return { ...s, score };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // On a tie, the shorter name wins: someone typing "trademark" almost always
  // means Trademark Registration rather than Trademark Objection Reply, and the
  // more general service is reliably the more briefly named one.
  return scored.sort(
    (a, b) => b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name)
  );
}

/**
 * Every live entry must have a real page behind it. Called from the services
 * page in development so a bad status flip fails loudly rather than shipping a
 * menu that links to nothing.
 */
export function catalogueIntegrity(liveSlugs: string[]): string[] {
  const problems: string[] = [];
  const known = new Set(liveSlugs);

  for (const s of allServices) {
    if (s.status === "live" && !known.has(s.slug)) {
      problems.push(`"${s.slug}" is marked live but has no page in services.ts`);
    }
  }
  for (const slug of liveSlugs) {
    if (!allServices.some((s) => s.slug === slug)) {
      problems.push(`"${slug}" has a page but is missing from the catalogue`);
    }
  }

  const seen = new Set<string>();
  for (const s of allServices) {
    if (seen.has(s.slug)) problems.push(`"${s.slug}" appears twice in the catalogue`);
    seen.add(s.slug);
  }

  return problems;
}
