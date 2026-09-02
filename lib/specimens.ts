/**
 * Specimen documents — the illustrated example shown on every document page.
 *
 * WHY THIS IS DATA AND NOT TWENTY-FIVE COMPONENTS
 *
 * Each of these depicts an Indian statutory document. Depicting one carelessly
 * is the single highest-risk asset on the site: a convincing facsimile of a
 * government document is a forgery risk, reproducing the State Emblem is an
 * offence under the Emblems and Names (Prevention of Improper Use) Act 1950,
 * and UIDAI is actively tightening what private parties may do with anything
 * Aadhaar-shaped.
 *
 * Hand-building twenty-five of these would be twenty-five chances to forget
 * one of those rules. Instead every specimen is a row of data here, and
 * `DocumentSpecimen` renders all of them through one path that always stamps
 * SPECIMEN, always marks the thing NOT VALID, always uses LAWFIC's own colours,
 * and never draws an emblem or a government logo. The guarantees are
 * structural rather than remembered.
 *
 * RULES FOR ADDING ONE
 *
 *   1. Never use a real, live identifier. The values below are shaped like the
 *      real thing so the explanation makes sense, and are otherwise invented.
 *   2. Set `sensitive` on anything Aadhaar-shaped. It forces the number to
 *      render masked, and the renderer will not display it in full.
 *   3. `teaches` must be true and useful. A specimen that only decorates has
 *      no business being on the page — the point is that a reader leaves
 *      knowing something about their own document.
 */

export type SpecimenForm = "coded" | "certificate" | "agreement";

/** One meaningful run of characters inside a coded identifier. */
export type Segment = {
  chars: string;
  label: string;
  meaning: string;
};

export type SpecimenField = { label: string; value: string };

export type Specimen = {
  /** Matches a document slug, a service slug, or both. */
  slug: string;
  /** What the document is actually called. */
  title: string;
  form: SpecimenForm;
  /** `coded` only: the identifier, split into segments that mean something. */
  segments?: Segment[];
  /** Shown on the specimen face. */
  fields?: SpecimenField[];
  /** Aadhaar-shaped. Forces masking; never rendered in full. */
  sensitive?: boolean;
  /** The one true thing a reader should leave with. */
  teaches: string;
};

export const SPECIMENS: Specimen[] = [
  /* ---- Coded identifiers -------------------------------------------------- */
  {
    slug: "fssai",
    title: "FSSAI Licence Number",
    form: "coded",
    segments: [
      { chars: "1", label: "Tier", meaning: "1 is a central licence, 2 a state licence, 3 a registration." },
      { chars: "26", label: "Year", meaning: "The year the licence was first issued." },
      { chars: "08", label: "State", meaning: "The state code where the business is registered." },
      { chars: "0001", label: "Authority", meaning: "Which licensing authority granted it." },
      { chars: "0000123", label: "Serial", meaning: "The business's own serial number with that authority." },
    ],
    fields: [
      { label: "Licence holder", value: "Anjali Foods (Specimen)" },
      { label: "Valid until", value: "31 / 03 / 2027" },
    ],
    teaches:
      "The 14 digits are printed on every packet you buy. The first digit alone tells you whether the maker holds a central licence or only a small-scale registration.",
  },
  {
    slug: "tan",
    title: "Tax Deduction Account Number",
    form: "coded",
    segments: [
      { chars: "MUM", label: "City", meaning: "The first three letters are the city where TAN was allotted." },
      { chars: "A", label: "Initial", meaning: "The first letter of the deductor's name." },
      { chars: "12345", label: "Serial", meaning: "A five-digit running number." },
      { chars: "B", label: "Check", meaning: "A check letter that catches mistyped numbers." },
    ],
    fields: [{ label: "Deductor", value: "Specimen Enterprises" }],
    teaches:
      "Anyone who deducts TDS needs a TAN, and it is not the same as a PAN. Quoting a PAN where a TAN belongs is the most common reason a TDS return is rejected.",
  },
  {
    slug: "passport-application",
    title: "Passport Number",
    form: "coded",
    segments: [
      { chars: "Z", label: "Series", meaning: "A letter identifying the booklet series." },
      { chars: "1234567", label: "Serial", meaning: "Seven digits unique to the booklet." },
    ],
    fields: [
      { label: "Type", value: "P — Ordinary" },
      { label: "Date of expiry", value: "14 / 08 / 2036" },
    ],
    teaches:
      "The number belongs to the booklet, not to you. It changes on every reissue, which is why old documents quoting it need updating after renewal.",
  },
  {
    slug: "trademark",
    title: "Trademark Application Number",
    form: "coded",
    segments: [
      { chars: "1234567", label: "Application", meaning: "The number allotted the day you file." },
      { chars: "09", label: "Class", meaning: "The Nice class — which goods or services the mark covers." },
    ],
    fields: [
      { label: "Mark", value: "SPECIMEN" },
      { label: "Status", value: "Objected — reply due" },
    ],
    teaches:
      "A trademark is registered per class, not outright. Registering in class 9 does not stop someone using the same name in class 25.",
  },

  /* ---- Certificates ------------------------------------------------------- */
  {
    slug: "birth-certificate",
    title: "Birth Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Anjali R. Deshmukh" },
      { label: "Date of birth", value: "14 / 08 / 1994" },
      { label: "Place", value: "Pune, Maharashtra" },
      { label: "Registration no.", value: "SPEC/2026/00123" },
    ],
    teaches:
      "The registration number, not the name, is what every later document keys off. If it is wrong on the certificate, every correction downstream needs this one fixed first.",
  },
  {
    slug: "death-certificate",
    title: "Death Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Specimen Name" },
      { label: "Date", value: "02 / 01 / 2026" },
      { label: "Place", value: "Pune, Maharashtra" },
      { label: "Registration no.", value: "SPEC/2026/00456" },
    ],
    teaches:
      "Succession, insurance and bank claims each need their own certified copy. Ask for several at registration — later copies take far longer.",
  },
  {
    slug: "marriage-certificate",
    title: "Marriage Certificate",
    form: "certificate",
    fields: [
      { label: "Parties", value: "Specimen A & Specimen B" },
      { label: "Date of marriage", value: "20 / 11 / 2025" },
      { label: "Registered at", value: "Sub-Registrar, Pune" },
      { label: "Act", value: "Special Marriage Act, 1954" },
    ],
    teaches:
      "Which Act you register under matters. The Special Marriage Act needs a 30-day public notice; personal-law registration does not.",
  },
  {
    slug: "domicile-certificate",
    title: "Domicile Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Anjali R. Deshmukh" },
      { label: "State", value: "Maharashtra" },
      { label: "Resident since", value: "1994" },
    ],
    teaches:
      "Domicile is proved by continuous residence, usually 10 to 15 years depending on the state. It is not the same as your current address.",
  },
  {
    slug: "income-certificate",
    title: "Income Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Anjali R. Deshmukh" },
      { label: "Annual family income", value: "₹2,40,000" },
      { label: "Valid until", value: "31 / 03 / 2027" },
    ],
    teaches:
      "It states household income, not yours alone, and most authorities treat it as valid for one financial year only.",
  },
  {
    slug: "caste-certificate",
    title: "Caste Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Anjali R. Deshmukh" },
      { label: "Category", value: "Specimen category" },
      { label: "Issuing authority", value: "Sub-Divisional Officer" },
    ],
    teaches:
      "Central and state lists differ. A certificate accepted for a state seat may not be accepted for a central one without a separate validity check.",
  },
  {
    slug: "ews-certificate",
    title: "EWS Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Anjali R. Deshmukh" },
      { label: "Financial year", value: "2025–26" },
      { label: "Valid until", value: "31 / 03 / 2027" },
    ],
    teaches:
      "EWS is assessed on the previous financial year and expires annually. Most rejections are simply an expired certificate.",
  },
  {
    slug: "obc-ncl",
    title: "OBC Non-Creamy Layer Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Anjali R. Deshmukh" },
      { label: "Financial year", value: "2025–26" },
      { label: "Status", value: "Non-Creamy Layer" },
    ],
    teaches:
      "Non-Creamy Layer status is re-tested each year against family income. An OBC certificate without a current NCL endorsement will not be accepted.",
  },
  {
    slug: "character-certificate",
    title: "Character Certificate",
    form: "certificate",
    fields: [
      { label: "Name", value: "Anjali R. Deshmukh" },
      { label: "Issued by", value: "Police Station / Institution" },
      { label: "Date", value: "02 / 09 / 2026" },
    ],
    teaches:
      "Who issues it decides whether it is accepted. Employers usually want a police-issued certificate; institutions often accept one from a college.",
  },
  {
    slug: "legal-heir",
    title: "Legal Heir Certificate",
    form: "certificate",
    fields: [
      { label: "Deceased", value: "Specimen Name" },
      { label: "Heirs listed", value: "3" },
      { label: "Issued by", value: "Tahsildar" },
    ],
    teaches:
      "A legal heir certificate is not a succession certificate. It identifies heirs; it does not authorise anyone to collect debts or transfer securities.",
  },

  /* ---- Agreements --------------------------------------------------------- */
  {
    slug: "rent-agreement",
    title: "Rent Agreement",
    form: "agreement",
    fields: [
      { label: "Term", value: "11 months" },
      { label: "Monthly rent", value: "₹18,000" },
      { label: "Stamp duty", value: "As per state schedule" },
    ],
    teaches:
      "Eleven months is not a legal limit — it is the point above which registration becomes compulsory in most states, which is why nearly every rent agreement stops there.",
  },
  {
    slug: "leave-license",
    title: "Leave & License Agreement",
    form: "agreement",
    fields: [
      { label: "Term", value: "11 months" },
      { label: "Deposit", value: "₹1,00,000" },
      { label: "Registration", value: "Compulsory in Maharashtra" },
    ],
    teaches:
      "A licence grants permission to occupy, not tenancy rights. That distinction is the whole reason landlords prefer it.",
  },
  {
    slug: "power-of-attorney",
    title: "Power of Attorney",
    form: "agreement",
    fields: [
      { label: "Type", value: "Special" },
      { label: "Granted to", value: "Specimen Attorney" },
      { label: "Scope", value: "One stated transaction" },
    ],
    teaches:
      "A General PoA hands over broad authority; a Special PoA covers one stated act. Sign a General one only when you truly mean it.",
  },
  {
    slug: "will",
    title: "Will",
    form: "agreement",
    fields: [
      { label: "Testator", value: "Specimen Name" },
      { label: "Witnesses", value: "2 required" },
      { label: "Registration", value: "Optional" },
    ],
    teaches:
      "A will needs two witnesses, and neither should be a beneficiary. Registration is optional in India — witnesses are not.",
  },
  {
    slug: "affidavit",
    title: "Affidavit",
    form: "agreement",
    fields: [
      { label: "Deponent", value: "Specimen Name" },
      { label: "Sworn before", value: "Notary / Oath Commissioner" },
      { label: "Stamp paper", value: "As per state" },
    ],
    teaches:
      "An affidavit is sworn evidence, not a form. A false statement in one is punishable — which is exactly why authorities accept it in place of proof.",
  },
  {
    slug: "name-change-affidavit",
    title: "Name Change Affidavit",
    form: "agreement",
    fields: [
      { label: "Old name", value: "Specimen A" },
      { label: "New name", value: "Specimen B" },
      { label: "Next step", value: "Gazette publication" },
    ],
    teaches:
      "The affidavit alone rarely finishes the job. Most authorities want the newspaper notice and the Gazette publication that follow it.",
  },
];

/** Several document slugs can share one specimen. */
const ALIASES: Record<string, string> = {
  "passport-reissue": "passport-application",
  // These four are drawn by hand instead — see ServiceVisual. Listed so the
  // reason they have no entry here is obvious rather than looking forgotten.
  // "pan-application" / "pan-correction" -> PanDecoder
  // "aadhaar" -> AadhaarFlip
  // "gst" -> GstinAssembler
  // "udyam-msme" -> UdyamCertificate
};

export function getSpecimen(slug: string): Specimen | undefined {
  const key = ALIASES[slug] ?? slug;
  return SPECIMENS.find((s) => s.slug === key);
}

/** The identifier as it should be displayed — masked when sensitive. */
export function specimenNumber(s: Specimen): string {
  if (!s.segments) return "";
  const full = s.segments.map((seg) => seg.chars).join("");
  if (!s.sensitive) return full;
  return full.slice(0, -4).replace(/./g, "X") + full.slice(-4);
}
