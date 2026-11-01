/**
 * Studio invoices: the bills LAWFIC issues for websites, apps, marketing and
 * the rest, made in the back office at /admin/invoices.
 *
 * Everything an invoice says is in InvoiceData, stored whole as JSON, so the
 * sheet can always be redrawn exactly as it was issued. The maths lives here,
 * pure, so the preview, the print and the tests all agree.
 *
 * MONEY IS PAISE INSIDE, RUPEES AT THE EDGES
 *
 * The form takes rupees because that is what someone types. Every sum below is
 * done in whole paise so ₹4,500.50 split three ways never drifts by a paisa;
 * the last payment milestone absorbs any remainder.
 */

export type ServiceKey =
  | "website"
  | "ecommerce"
  | "app"
  | "marketing"
  | "seo"
  | "social"
  | "photoshoot"
  | "leads"
  | "saas"
  | "branding"
  | "renewal"
  | "other";

export type TaxMode = "excluding" | "not-applicable" | "including" | "add18";

export type InvoiceItem = { id: string; title: string; qty: number; rate: number };
export type Milestone = { id: string; percent: number; label: string; note: string };

export type InvoiceData = {
  heading: string;
  number: string;
  /** YYYY-MM-DD */
  date: string;
  quoteRef: string;
  service: ServiceKey;
  client: { business: string; person: string; phone: string; email: string; address: string; gstin: string };
  items: InvoiceItem[];
  inclusions: string[];
  /** Rupees off the subtotal. */
  discount: number;
  tax: TaxMode;
  showTerms: boolean;
  milestones: Milestone[];
  showRenewal: boolean;
  renewalText: string;
  note: string;
  issuer: { phone: string; specialEmail: string; supportEmail: string; websites: string; address: string };
};

export const SERVICES: { key: ServiceKey; label: string; title: string; inclusions: string[]; renewal: boolean }[] = [
  {
    key: "website",
    label: "Website development",
    title: "Website Development",
    inclusions: [
      "Custom responsive design",
      "Up to 6 pages",
      "Domain (12 months)",
      "Hosting + SSL",
      "2 business emails",
      "Google Search Console",
      "Enquiry, WhatsApp & Maps",
      "On-page SEO & handover",
    ],
    renewal: true,
  },
  {
    key: "ecommerce",
    label: "E-commerce website",
    title: "E-commerce Website Development",
    inclusions: [
      "Product catalogue",
      "Cart & checkout",
      "Payment gateway",
      "Order management",
      "Admin panel",
      "Domain (12 months)",
      "Hosting + SSL",
      "On-page SEO & handover",
    ],
    renewal: true,
  },
  {
    key: "app",
    label: "App development",
    title: "Mobile App Development (Android & iOS)",
    inclusions: [
      "Custom app design",
      "Android app",
      "iOS app",
      "Admin panel",
      "Push notifications",
      "Play Store publishing",
      "App Store publishing",
      "3 months support",
    ],
    renewal: true,
  },
  {
    key: "marketing",
    label: "Digital marketing",
    title: "Digital Marketing — Meta & Google Ads",
    inclusions: [
      "Campaign strategy",
      "Meta ads setup",
      "Google ads setup",
      "Ad creatives",
      "Audience targeting",
      "Conversion tracking",
      "Monthly report",
      "Ad spend billed separately",
    ],
    renewal: false,
  },
  {
    key: "seo",
    label: "SEO & Google Business Profile",
    title: "SEO & Google Business Profile",
    inclusions: [
      "Keyword research",
      "On-page SEO",
      "Google Business Profile",
      "Local listings",
      "Monthly blog posts",
      "Search Console setup",
      "Speed improvements",
      "Monthly report",
    ],
    renewal: false,
  },
  {
    key: "social",
    label: "Social media management",
    title: "Social Media Management",
    inclusions: [
      "12 posts a month",
      "4 reels a month",
      "Content calendar",
      "Captions & hashtags",
      "Scheduling & posting",
      "Profile optimisation",
      "Comment replies",
      "Monthly report",
    ],
    renewal: false,
  },
  {
    key: "photoshoot",
    label: "Brand photoshoot",
    title: "Brand Photoshoot",
    inclusions: [
      "Shoot planning",
      "Product photography",
      "Lifestyle shots",
      "Team portraits",
      "Professional editing",
      "Web & social sizes",
      "Print-ready files",
      "Online delivery",
    ],
    renewal: false,
  },
  {
    key: "leads",
    label: "Lead generation",
    title: "Lead Generation Setup",
    inclusions: [
      "Landing page",
      "Lead form",
      "WhatsApp click-to-chat",
      "Sheet / CRM integration",
      "Campaign tracking",
      "Follow-up automation",
      "Enquiry alerts",
      "Monthly report",
    ],
    renewal: false,
  },
  {
    key: "saas",
    label: "SaaS / custom software",
    title: "Custom Software Development",
    inclusions: [
      "Requirement study",
      "UI design",
      "Dashboard",
      "Role-based access",
      "Billing & reports",
      "Cloud hosting",
      "Training & handover",
      "3 months support",
    ],
    renewal: true,
  },
  {
    key: "branding",
    label: "Logo & brand identity",
    title: "Logo & Brand Identity",
    inclusions: [
      "3 logo concepts",
      "Colour palette",
      "Typography",
      "Business card",
      "Letterhead",
      "Social media kit",
      "Brand guide",
      "Source files",
    ],
    renewal: false,
  },
  {
    key: "renewal",
    label: "Domain, hosting & email renewal",
    title: "Domain, Hosting & Email Renewal (12 months)",
    inclusions: ["Domain renewal", "Hosting renewal", "SSL certificate", "Business emails", "Backups", "Uptime monitoring"],
    renewal: true,
  },
  { key: "other", label: "Other", title: "", inclusions: [], renewal: false },
];

export function servicePreset(key: ServiceKey) {
  return SERVICES.find((s) => s.key === key) ?? SERVICES[SERVICES.length - 1];
}

export const TAX_LABEL: Record<TaxMode, string> = {
  excluding: "Excluding GST",
  "not-applicable": "GST Not Applicable",
  including: "Inclusive of GST",
  add18: "Including 18% GST",
};

export const DEFAULT_RENEWAL =
  "Domain, hosting & emails are valid for 12 months. Renewal is due in the 11th month — one month before expiry — to keep the website live without interruption.";

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: "m1", percent: 50, label: "Advance", note: "On confirmation of the project" },
  { id: "m2", percent: 25, label: "Mid-project", note: "On design approval / mid-way" },
  { id: "m3", percent: 25, label: "On delivery", note: "On delivery & go-live" },
];

export const LAWFIC_ISSUER: InvoiceData["issuer"] = {
  phone: "+91 98825 75996",
  specialEmail: "family@lawfic.in",
  supportEmail: "care@lawfic.in",
  websites: "lawfic.in · lawfic.pro",
  address:
    "A-21, Second Floor, Maharana Pratap Building, Civil Line, Near Kacheri Adda,\nDharamshala, Kangra, Himachal Pradesh, India – 176215",
};

let seq = 0;
export const newId = () => `i${Date.now().toString(36)}${(seq++).toString(36)}`;

export function blankInvoice(number: string, date: string, service: ServiceKey = "website"): InvoiceData {
  const p = servicePreset(service);
  return {
    heading: "Lawfic Billed",
    number,
    date,
    quoteRef: "",
    service,
    client: { business: "", person: "", phone: "", email: "", address: "", gstin: "" },
    items: [{ id: newId(), title: p.title, qty: 1, rate: 0 }],
    inclusions: [...p.inclusions],
    discount: 0,
    tax: "excluding",
    showTerms: true,
    milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })),
    showRenewal: p.renewal,
    renewalText: DEFAULT_RENEWAL,
    note: "",
    issuer: { ...LAWFIC_ISSUER },
  };
}

/* ── money ─────────────────────────────────────────────────────────────── */

export const toPaise = (rupees: number) => (Number.isFinite(rupees) ? Math.round(rupees * 100) : 0);

export type Totals = {
  subtotal: number;
  discount: number;
  taxable: number;
  gst: number;
  total: number;
  /** Paise per milestone, in order; sums to total exactly. */
  milestones: number[];
};

export function totals(d: Pick<InvoiceData, "items" | "discount" | "tax" | "milestones">): Totals {
  const subtotal = d.items.reduce((s, it) => s + Math.max(0, it.qty || 0) * Math.max(0, toPaise(it.rate)), 0);
  const discount = Math.min(subtotal, Math.max(0, toPaise(d.discount)));
  const taxable = subtotal - discount;
  const gst = d.tax === "add18" ? Math.round(taxable * 0.18) : 0;
  const total = taxable + gst;
  const parts = d.milestones.map((m) => Math.round((total * Math.max(0, m.percent || 0)) / 100));
  if (parts.length) {
    const pctSum = d.milestones.reduce((s, m) => s + (m.percent || 0), 0);
    /* When the percentages add to 100, the last one takes the rounding so the
       instalments sum to the total exactly. */
    if (pctSum === 100) parts[parts.length - 1] = total - parts.slice(0, -1).reduce((s, v) => s + v, 0);
  }
  return { subtotal, discount, taxable, gst, total, milestones: parts };
}

/** ₹18,000 or ₹4,500.50 — paise shown only when there are some. */
export function formatINR(paise: number): string {
  const neg = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const p = abs % 100;
  const r = rupees.toLocaleString("en-IN");
  return `${neg ? "−" : ""}₹${r}${p ? `.${String(p).padStart(2, "0")}` : ""}`;
}

/** ₹18,000.00 — for unit prices, where the decimals read as precision. */
export function formatINRExact(paise: number): string {
  const rupees = Math.floor(Math.abs(paise) / 100).toLocaleString("en-IN");
  return `₹${rupees}.${String(Math.abs(paise) % 100).padStart(2, "0")}`;
}

/* ── words, the Indian way: lakh and crore ─────────────────────────────── */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? twoDigits(rest) : ""].filter(Boolean).join(" ");
}

export function numberToWordsIN(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${numberToWordsIN(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return parts.join(" ");
}

export function amountInWords(paise: number): string {
  const rupees = Math.floor(Math.abs(paise) / 100);
  const p = Math.abs(paise) % 100;
  return `Rupees ${numberToWordsIN(rupees)}${p ? ` and ${twoDigits(p)} Paise` : ""} Only`;
}

/* ── numbering ─────────────────────────────────────────────────────────── */

export const INVOICE_PREFIX = "LF/INV";

/**
 * The next number for a year, from the numbers already used: one more than
 * the highest serial issued that year, or 1001 for the first.
 */
export function nextInvoiceNumber(existing: string[], year: number): string {
  const head = `${INVOICE_PREFIX}/${year}/`;
  const serials = existing
    .filter((n) => n.startsWith(head))
    .map((n) => Number(n.slice(head.length)))
    .filter((v) => Number.isInteger(v) && v > 0);
  const next = serials.length ? Math.max(...serials) + 1 : 1001;
  return `${head}${next}`;
}

/** 22 Oct 2026 */
export function formatInvoiceDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** A file-safe name for the PDF: Invoice LF-INV-2026-1023 MV Homes */
export function invoiceFileName(d: Pick<InvoiceData, "number" | "client">): string {
  const who = (d.client.business || d.client.person).replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  return `Invoice ${d.number.replace(/\//g, "-")}${who ? ` ${who}` : ""}`.trim();
}
