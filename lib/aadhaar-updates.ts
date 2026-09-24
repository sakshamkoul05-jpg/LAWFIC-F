/**
 * Aadhaar updates: what can be changed, how often, and what the centre will
 * accept as proof.
 *
 * WHAT THIS PAGE IS AND IS NOT
 *
 * LAWFIC cannot update anybody's Aadhaar. Nobody outside an authorised
 * enrolment centre can — an update takes biometrics, in person. The service is
 * preparing a file that will not bounce and booking the appointment, and the
 * form built on this data has to say so on its face rather than in a footnote.
 * A form that looks like it submits an Aadhaar update is a form that will be
 * believed.
 *
 * THE LIFETIME LIMITS ARE THE WHOLE POINT OF ASKING FIRST
 *
 * Name can be changed twice in a lifetime. Date of birth once. Gender once.
 * Address as often as needed. Somebody who has already used their two name
 * changes cannot have a third, and finding that out at the counter — after
 * taking a day off work — is the failure this service exists to prevent. So
 * the form asks up front, and says plainly when the answer is no.
 *
 * ⚠ These limits and the accepted-proof lists are facts about UIDAI policy and
 * they move. Verify against uidai.gov.in before this goes live, and re-check
 * when UIDAI publishes a revised document list.
 */

export type UpdateFieldId = "name" | "dob" | "gender" | "address" | "mobile" | "email";

export type UpdateField = {
  id: UpdateFieldId;
  label: string;
  /** Null where there is no lifetime cap. */
  lifetimeLimit: number | null;
  /** One line, shown under the choice. */
  note: string;
  /** What an enrolment centre will accept. Indicative, not exhaustive. */
  proofs: string[];
  /** True where the change can only be done in person with biometrics. */
  centreOnly: boolean;
};

export const UPDATE_FIELDS: UpdateField[] = [
  {
    id: "name",
    label: "Name",
    lifetimeLimit: 2,
    note: "Spelling corrections, a changed surname after marriage, or an initial expanded.",
    proofs: [
      "Passport, PAN card or voter ID in the corrected name",
      "Marriage certificate, for a change of surname",
      "Gazette notification, for a formal change of name",
    ],
    centreOnly: true,
  },
  {
    id: "dob",
    label: "Date of birth",
    lifetimeLimit: 1,
    note: "Once only, and the proof has to be a document issued at or near birth.",
    proofs: [
      "Birth certificate",
      "SSLC or Class 10 marksheet showing the date",
      "Passport",
    ],
    centreOnly: true,
  },
  {
    id: "gender",
    label: "Gender",
    lifetimeLimit: 1,
    note: "Once only.",
    proofs: ["A self-declaration, plus any supporting document you hold"],
    centreOnly: true,
  },
  {
    id: "address",
    label: "Address",
    lifetimeLimit: null,
    note: "No lifetime limit — this one can be changed whenever it needs to be.",
    proofs: [
      "Electricity, water, gas or telephone bill not older than three months",
      "Passbook or bank statement with the address",
      "Registered rent agreement",
      "Passport",
    ],
    centreOnly: false,
  },
  {
    id: "mobile",
    label: "Mobile number",
    lifetimeLimit: null,
    note: "Needed for every OTP UIDAI will ever send you. Biometrics at the centre.",
    proofs: ["No document — the number is verified by OTP at the centre"],
    centreOnly: true,
  },
  {
    id: "email",
    label: "Email",
    lifetimeLimit: null,
    note: "Optional, but useful for update receipts.",
    proofs: ["No document — verified by OTP"],
    centreOnly: true,
  },
];

export function getUpdateField(id: string): UpdateField | undefined {
  return UPDATE_FIELDS.find((f) => f.id === id);
}

/**
 * The government's own charge, which LAWFIC does not take and does not mark up.
 * It is paid at the counter, and saying so on the form is the difference
 * between a fee and a surprise.
 */
export const CENTRE_FEE_NOTE =
  "₹50 per update, paid in cash at the enrolment centre. That is UIDAI's charge, not ours — we never collect it and we never add to it.";

/**
 * Why we ask for four digits and not twelve.
 *
 * A full Aadhaar number is the one piece of data on this site that is worth
 * stealing on its own, and we have no use for it: an appointment is booked
 * against a person, and the centre reads the real number off the card in front
 * of them. Four digits is enough for us to match a file to a customer. Asking
 * for twelve would mean storing twelve, and the safest way to hold an Aadhaar
 * number is not to have one.
 */
export const MASKED_ONLY_NOTE =
  "Last four digits only. We do not ask for your full Aadhaar number and we do not store Aadhaar photocopies — the centre reads the real number off your card when you attend.";

/* ══════════════════════════════════════════════════════════════════════════
   NEW ENROLMENT — a different process, not a variation on an update
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Applying for an Aadhaar you do not have yet.
 *
 * WHY THIS COULD NOT BE A FLAG ON THE UPDATE FLOW
 *
 * Almost nothing carries across. A first enrolment is FREE where an update is
 * ₹50. It has no lifetime allowance to check, because there is nothing to have
 * used. It cannot ask for the last four digits of a number the person does not
 * have. And it turns on documents — one proof of identity, one of address —
 * where an update turns on proof of the single detail being changed.
 *
 * The one thing they share is the honest part: neither can be done by LAWFIC.
 * Both end at an enrolment centre, in person, with biometrics.
 *
 * ⚠ The document lists and the rules below are UIDAI policy and they move.
 * Verify against uidai.gov.in before this goes live.
 */

export type EnrolFor = "adult" | "child-under-5" | "child-5-to-15" | "nri";

export type EnrolPath = {
  id: EnrolFor;
  label: string;
  blurb: string;
  /** What actually happens at the centre. The bit people do not expect. */
  biometrics: string;
  /** Extra things this path needs beyond the standard proofs. */
  extras: string[];
};

export const ENROL_PATHS: EnrolPath[] = [
  {
    id: "adult",
    label: "An adult",
    blurb: "Anyone 18 or over who has never been issued an Aadhaar.",
    biometrics: "Ten fingerprints, both irises and a photograph, captured at the centre.",
    extras: [],
  },
  {
    id: "child-under-5",
    label: "A child under 5",
    blurb: "Enrolled against a parent's Aadhaar. Often called a Bal Aadhaar.",
    biometrics:
      "A photograph only — no fingerprints or iris scans are taken under 5. They become mandatory at 5 and again at 15.",
    extras: [
      "One parent's or guardian's Aadhaar",
      "A document proving the relationship, usually the birth certificate",
    ],
  },
  {
    id: "child-5-to-15",
    label: "A child aged 5 to 15",
    blurb: "Full biometrics are captured, and must be given again at 15.",
    biometrics:
      "Fingerprints, irises and a photograph. A further mandatory biometric update falls due at 15.",
    extras: ["One parent's or guardian's Aadhaar", "A document proving the relationship"],
  },
  {
    id: "nri",
    label: "A non-resident Indian",
    blurb: "An Indian passport is mandatory, and it is the proof of identity.",
    biometrics: "Ten fingerprints, both irises and a photograph, captured at the centre in India.",
    extras: ["A valid Indian passport — no substitute is accepted on this route"],
  },
];

export function getEnrolPath(id: string): EnrolPath | undefined {
  return ENROL_PATHS.find((p) => p.id === id);
}

/** One from this list. A passport satisfies identity and address at once. */
export const POI_DOCS = [
  "Passport",
  "PAN card",
  "Voter ID",
  "Driving licence",
  "Ration or PDS photo card",
  "Government or PSU service photo identity card",
];

/** One from this list, dated recently enough for the centre to accept it. */
export const POA_DOCS = [
  "Passport",
  "Bank passbook or statement",
  "Electricity, water, gas or telephone bill not older than three months",
  "Registered rent agreement",
  "Voter ID",
  "Driving licence",
];

/**
 * The fee, which is the single most common surprise in either direction.
 *
 * A first enrolment costs nothing at all. People routinely expect to pay and
 * are sometimes charged anyway, so the form says it plainly — a customer who
 * knows the government charge is zero is a customer an operator cannot quietly
 * add one for.
 */
export const ENROLMENT_FEE_NOTE =
  "A first Aadhaar enrolment is free. UIDAI charges nothing for it, and nobody at the centre should ask you for a fee. If they do, that is worth telling us about.";

/**
 * For somebody with no document of their own.
 *
 * Genuinely common — a spouse who has never held a bill, an adult child at the
 * family address — and the route out of it is not widely known, which is
 * exactly the sort of thing this service is for.
 */
export const HEAD_OF_FAMILY_NOTE =
  "No proof of address in your own name? A family member who already has an Aadhaar can enrol you against theirs, with a document showing the relationship. Tell us and we will prepare that route instead.";
