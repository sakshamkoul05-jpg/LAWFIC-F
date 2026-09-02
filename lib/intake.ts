/**
 * What each document's request form asks for.
 *
 * WHAT THIS IS NOT
 *
 * It is not an application form. LAWFIC runs a request-and-quote flow: the
 * customer says what they need, LAWFIC prices it with the government fee and
 * its own fee shown separately, and only an accepted quote moves money. So
 * these fields exist to make a quote possible and for nothing else.
 *
 * That distinction decides what may be asked. Government fees move with state,
 * turnover, entity type and category, so those are worth asking. A PAN number,
 * an Aadhaar number, a passport number — none of them change the price, so
 * none of them are here.
 *
 * THE RULE ABOUT IDENTIFIERS
 *
 * No field in this file may collect a statutory identifier or an identity
 * document. Not Aadhaar, not PAN, not passport numbers, not scans. Asking for
 * them on an unauthenticated public form would put LAWFIC in possession of
 * exactly the data the DPDP Act and UIDAI's guidance say to avoid holding, in
 * return for information that does not affect the quote. When identity
 * documents are genuinely needed they are collected later, into private
 * storage, against an accepted order.
 *
 * `sensitiveGuard` in the test suite enforces this. If a future field asks for
 * an Aadhaar or PAN number, the build fails.
 */

export type FieldType = "text" | "date" | "select" | "textarea" | "tel";

export type IntakeField = {
  name: string;
  label: string;
  type: FieldType;
  /** Options for a select. */
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /** Why we are asking — shown under the field when it is not obvious. */
  hint?: string;
};

export type Intake = {
  /** Document or service slug. */
  slug: string;
  /** One line above the fields, saying what happens next. */
  intro: string;
  fields: IntakeField[];
};

/* Reused shapes ----------------------------------------------------------- */

const STATE: IntakeField = {
  name: "state",
  label: "State",
  type: "text",
  placeholder: "Maharashtra",
  required: true,
  hint: "Government fees and processing times differ by state.",
};

const APPLICANT: IntakeField = {
  name: "applicant",
  label: "Name of the applicant",
  type: "text",
  placeholder: "As it should appear on the document",
  required: true,
};

const TURNOVER: IntakeField = {
  name: "turnover",
  label: "Annual turnover",
  type: "select",
  options: ["Not trading yet", "Under ₹20 lakh", "₹20 lakh – ₹1 crore", "₹1 – 5 crore", "Over ₹5 crore"],
  required: true,
  hint: "This decides which slab you fall into.",
};

const ENTITY: IntakeField = {
  name: "entity",
  label: "You are filing as",
  type: "select",
  options: ["Individual", "Proprietor", "Partnership firm", "LLP", "Private limited company", "Trust or society"],
  required: true,
};

const URGENCY: IntakeField = {
  name: "urgency",
  label: "How soon do you need it?",
  type: "select",
  options: ["No particular rush", "Within a month", "Within a week", "Urgent — tell me what is possible"],
};

const NOTES: IntakeField = {
  name: "notes",
  label: "Anything else we should know?",
  type: "textarea",
  placeholder: "e.g. an earlier application was rejected, or a name does not match across documents",
};

/* ------------------------------------------------------------------------- */

export const INTAKES: Intake[] = [
  {
    slug: "pan-application",
    intro: "We will confirm the government fee and ours before anything is filed.",
    fields: [
      APPLICANT,
      { name: "dob", label: "Date of birth", type: "date", required: true },
      { name: "father", label: "Father's name", type: "text", required: true, hint: "Required on the PAN form itself." },
      ENTITY,
      URGENCY,
      NOTES,
    ],
  },
  {
    slug: "pan-correction",
    intro: "Tell us what is wrong and we will tell you what it takes to fix it.",
    fields: [
      APPLICANT,
      {
        name: "correction",
        label: "What needs correcting?",
        type: "select",
        options: ["Name spelling", "Date of birth", "Father's name", "Photograph or signature", "Address", "Something else"],
        required: true,
      },
      { name: "correct_value", label: "What should it say instead?", type: "text", required: true },
      NOTES,
    ],
  },
  {
    slug: "aadhaar",
    intro: "We prepare the paperwork and book the appointment. LAWFIC never handles Aadhaar authentication.",
    fields: [
      APPLICANT,
      {
        name: "update",
        label: "What needs updating?",
        type: "select",
        options: ["Name", "Date of birth", "Address", "Mobile number", "Photograph", "First-time enrolment"],
        required: true,
      },
      { name: "city", label: "Which city will you visit the centre in?", type: "text", required: true },
      NOTES,
    ],
  },
  {
    slug: "gst",
    intro: "Registration is free at source. Our fee is for preparing it and answering the department.",
    fields: [
      { name: "business", label: "Business name", type: "text", required: true },
      ENTITY,
      STATE,
      TURNOVER,
      {
        name: "nature",
        label: "What does the business do?",
        type: "text",
        placeholder: "e.g. wholesale of packaged food",
        required: true,
      },
      NOTES,
    ],
  },
  {
    slug: "udyam-msme",
    intro: "Udyam registration is free at source. Our fee is for filing it correctly the first time.",
    fields: [
      { name: "business", label: "Business name", type: "text", required: true },
      ENTITY,
      STATE,
      TURNOVER,
      {
        name: "employees",
        label: "How many people work there?",
        type: "select",
        options: ["Just me", "2 – 10", "11 – 50", "More than 50"],
      },
      NOTES,
    ],
  },
  {
    slug: "fssai",
    intro: "Which licence you need depends on turnover and where you operate.",
    fields: [
      { name: "business", label: "Business name", type: "text", required: true },
      {
        name: "activity",
        label: "What do you do with food?",
        type: "select",
        options: ["Manufacture", "Restaurant or catering", "Retail or grocery", "Wholesale or distribution", "Storage or transport", "Import or export"],
        required: true,
      },
      STATE,
      TURNOVER,
      NOTES,
    ],
  },
  {
    slug: "trademark",
    intro: "A search first, so you know the odds before you spend on filing.",
    fields: [
      { name: "mark", label: "The word or logo you want to register", type: "text", required: true },
      {
        name: "goods",
        label: "What will it be used on?",
        type: "text",
        placeholder: "e.g. packaged snacks, or software services",
        required: true,
        hint: "This decides the class, and a mark is registered per class.",
      },
      ENTITY,
      { name: "in_use", label: "Are you using it already?", type: "select", options: ["Yes, in use", "Not yet"] },
      NOTES,
    ],
  },
  {
    slug: "tan",
    intro: "Needed by anyone who deducts TDS. It is not the same as a PAN.",
    fields: [
      { name: "deductor", label: "Name of the deductor", type: "text", required: true },
      ENTITY,
      STATE,
      NOTES,
    ],
  },
  {
    slug: "passport-application",
    intro: "We prepare the form and documents and book the appointment.",
    fields: [
      APPLICANT,
      { name: "dob", label: "Date of birth", type: "date", required: true },
      { name: "type", label: "Which kind?", type: "select", options: ["Fresh — first passport", "Tatkal — urgent"], required: true },
      STATE,
      NOTES,
    ],
  },
  {
    slug: "passport-reissue",
    intro: "Renewal before expiry, or reissue after a change of details.",
    fields: [
      APPLICANT,
      {
        name: "reason",
        label: "Why is it being reissued?",
        type: "select",
        options: ["Expiring or expired", "Pages exhausted", "Change of name or address", "Lost or damaged"],
        required: true,
      },
      STATE,
      URGENCY,
      NOTES,
    ],
  },
];

/* Certificates and agreements share a shape, so they are generated rather than
   written out twenty times. Each still gets the one or two fields that
   genuinely differ. */

const CERTIFICATE_SLUGS: Array<[string, string, IntakeField[]]> = [
  ["birth-certificate", "Registration or a certified copy of a birth record.", [
    { name: "person", label: "Name on the record", type: "text", required: true },
    { name: "event_date", label: "Date of birth", type: "date", required: true },
    { name: "place", label: "Place of birth", type: "text", placeholder: "Hospital or town", required: true },
  ]],
  ["death-certificate", "Registration and certified copies for succession and claims.", [
    { name: "person", label: "Name of the deceased", type: "text", required: true },
    { name: "event_date", label: "Date of death", type: "date", required: true },
    { name: "copies", label: "How many certified copies?", type: "select", options: ["1", "2 – 3", "4 or more"], hint: "Banks, insurers and the registrar each want their own." },
  ]],
  ["marriage-certificate", "Registration under the Act that fits your situation.", [
    { name: "parties", label: "Names of both parties", type: "text", required: true },
    { name: "event_date", label: "Date of marriage", type: "date" },
    { name: "act", label: "Registering under", type: "select", options: ["Not sure — advise me", "Hindu Marriage Act", "Special Marriage Act", "Other personal law"], required: true },
  ]],
  ["domicile-certificate", "State domicile proof for education and quota benefits.", [
    APPLICANT,
    { name: "years", label: "How long have you lived in the state?", type: "select", options: ["Under 5 years", "5 – 10 years", "10 – 15 years", "Over 15 years", "Since birth"], required: true },
  ]],
  ["income-certificate", "Household income proof for scholarships and welfare schemes.", [
    APPLICANT,
    { name: "purpose", label: "What is it for?", type: "text", placeholder: "e.g. a college scholarship", required: true },
  ]],
  ["caste-certificate", "Caste proof for reservations and welfare benefits.", [
    APPLICANT,
    { name: "category", label: "Category", type: "select", options: ["SC", "ST", "OBC", "Not sure — advise me"], required: true },
  ]],
  ["ews-certificate", "Economically Weaker Sections certificate, valid for one financial year.", [
    APPLICANT,
    { name: "purpose", label: "What is it for?", type: "text", placeholder: "e.g. an exam application", required: true },
  ]],
  ["obc-ncl", "Non-Creamy Layer certificate, re-tested each year.", [
    APPLICANT,
    { name: "purpose", label: "What is it for?", type: "text", placeholder: "e.g. a central government exam", required: true },
  ]],
  ["character-certificate", "Who issues it decides whether it is accepted.", [
    APPLICANT,
    { name: "issuer", label: "Who needs to issue it?", type: "select", options: ["Not sure — advise me", "Police", "College or school", "Employer"], required: true },
  ]],
  ["legal-heir", "Identifies heirs. It is not a succession certificate.", [
    { name: "person", label: "Name of the deceased", type: "text", required: true },
    { name: "heirs", label: "How many heirs?", type: "select", options: ["1", "2 – 3", "4 or more"], required: true },
    { name: "purpose", label: "What is it needed for?", type: "text", placeholder: "e.g. transferring a bank account" },
  ]],
];

const AGREEMENT_SLUGS: Array<[string, string, IntakeField[]]> = [
  ["rent-agreement", "Drafted, stamped and registered where the state requires it.", [
    { name: "parties", label: "Landlord and tenant names", type: "text", required: true },
    { name: "term", label: "Term", type: "select", options: ["11 months", "Longer than 11 months", "Not sure — advise me"], required: true, hint: "Above 11 months registration becomes compulsory in most states." },
    { name: "rent", label: "Monthly rent", type: "text", placeholder: "₹18,000" },
  ]],
  ["leave-license", "A licence to occupy, which is not the same as tenancy.", [
    { name: "parties", label: "Licensor and licensee names", type: "text", required: true },
    { name: "term", label: "Term", type: "select", options: ["11 months", "Longer", "Not sure — advise me"], required: true },
    { name: "deposit", label: "Deposit", type: "text", placeholder: "₹1,00,000" },
  ]],
  ["power-of-attorney", "General hands over broad authority; special covers one act.", [
    { name: "parties", label: "Who is granting it, and to whom?", type: "text", required: true },
    { name: "scope", label: "Which kind?", type: "select", options: ["Special — one stated act", "General — broad authority", "Not sure — advise me"], required: true },
    { name: "purpose", label: "What is it for?", type: "text", placeholder: "e.g. selling a property in another city" },
  ]],
  ["will", "Two witnesses are required. Neither should be a beneficiary.", [
    { name: "person", label: "Name of the testator", type: "text", required: true },
    { name: "assets", label: "Roughly what does it cover?", type: "textarea", placeholder: "e.g. one flat, two bank accounts, some jewellery" },
    { name: "register", label: "Register it as well?", type: "select", options: ["Not sure — advise me", "Yes", "No"] },
  ]],
  ["affidavit", "Sworn evidence, not a form. A false statement in one is punishable.", [
    { name: "person", label: "Name of the deponent", type: "text", required: true },
    { name: "purpose", label: "What does it need to state?", type: "textarea", placeholder: "e.g. that two spellings of my name refer to the same person", required: true },
  ]],
  ["name-change-affidavit", "The affidavit is the first step; the Gazette notice usually follows.", [
    { name: "old_name", label: "Current name", type: "text", required: true },
    { name: "new_name", label: "New name", type: "text", required: true },
    { name: "gazette", label: "Do you need the Gazette publication too?", type: "select", options: ["Not sure — advise me", "Yes", "No"] },
  ]],
];

for (const [slug, intro, fields] of [...CERTIFICATE_SLUGS, ...AGREEMENT_SLUGS]) {
  INTAKES.push({ slug, intro, fields: [...fields, STATE, URGENCY, NOTES] });
}

/**
 * Service slugs and document slugs name the same things differently — the
 * service page is /services/pan, the document is "pan-application". Both must
 * resolve, and the fallback for a miss is a generic textarea that looks fine
 * and quietly asks none of the right questions, so a missing alias here is
 * invisible rather than loud. `intake.test.ts` walks the real service list to
 * make sure that cannot happen again.
 */
const ALIASES: Record<string, string> = {
  "pan": "pan-application",
  "msme-udyam": "udyam-msme",
  "gst-registration": "gst",
  "fssai-registration": "fssai",
  "trademark-registration": "trademark",
};

export function getIntake(slug: string): Intake | undefined {
  const key = ALIASES[slug] ?? slug;
  return INTAKES.find((i) => i.slug === key);
}

/** Every field this form will submit, for building the summary sent to staff. */
export function intakeFieldNames(intake: Intake): string[] {
  return intake.fields.map((f) => f.name);
}
