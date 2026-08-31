export type DocGroup =
  | "Identity & PAN"
  | "Government Certificates"
  | "Legal & Agreements"
  | "Business & Tax";

export type DocumentItem = {
  slug: string;
  label: string;
  group: DocGroup;
  href: string;
  /** short description for the listing page */
  blurb: string;
  /** true when a full service page exists */
  live: boolean;
};

const serviceHref = (slug: string) => `/services/${slug}`;

/**
 * The complete LAWFIC Document catalogue — every identity card, certificate,
 * agreement and registration we prepare, checked and filed.
 */
export const documents: DocumentItem[] = [
  // Identity & PAN
  { slug: "pan-application", label: "PAN Card Application", group: "Identity & PAN", href: serviceHref("pan"), live: true, blurb: "A new PAN, filed and issued as an e-PAN in about two days." },
  { slug: "pan-correction", label: "PAN Card Correction", group: "Identity & PAN", href: serviceHref("pan"), live: true, blurb: "Fixing a name, date of birth or address mismatch on an existing PAN." },
  { slug: "aadhaar", label: "Aadhaar Card Services", group: "Identity & PAN", href: serviceHref("aadhaar"), live: true, blurb: "Corrections, updates and appointments, prepared so the visit works first time." },
  { slug: "passport-application", label: "Passport Application", group: "Identity & PAN", href: "/document#passport-application", live: false, blurb: "Fresh passport applications — form, documents and appointments." },
  { slug: "passport-reissue", label: "Passport Reissue", group: "Identity & PAN", href: "/document#passport-reissue", live: false, blurb: "Renewal and reissue before expiry so your travel plans stay intact." },

  // Government Certificates
  { slug: "birth-certificate", label: "Birth Certificate", group: "Government Certificates", href: "/document#birth-certificate", live: false, blurb: "Registration and copies to prove identity, age and parentage." },
  { slug: "death-certificate", label: "Death Certificate", group: "Government Certificates", href: "/document#death-certificate", live: false, blurb: "Registration and certified copies for succession and insurance claims." },
  { slug: "marriage-certificate", label: "Marriage Certificate", group: "Government Certificates", href: "/document#marriage-certificate", live: false, blurb: "Court or registrar marriage certificate for official use." },
  { slug: "domicile-certificate", label: "Domicile Certificate", group: "Government Certificates", href: "/document#domicile-certificate", live: false, blurb: "State domicile proof for education and quota benefits." },
  { slug: "income-certificate", label: "Income Certificate", group: "Government Certificates", href: "/document#income-certificate", live: false, blurb: "Household income proof used for scholarships and welfare schemes." },
  { slug: "caste-certificate", label: "Caste Certificate", group: "Government Certificates", href: "/document#caste-certificate", live: false, blurb: "Caste proof for reservations and welfare benefits." },
  { slug: "ews-certificate", label: "EWS Certificate", group: "Government Certificates", href: "/document#ews-certificate", live: false, blurb: "Economically Weaker Sections certificate for 10% reservation." },
  { slug: "obc-ncl", label: "OBC Non-Creamy Layer Certificate", group: "Government Certificates", href: "/document#obc-ncl", live: false, blurb: "Non-Creamy Layer certificate for OBC reservations." },
  { slug: "character-certificate", label: "Character Certificate", group: "Government Certificates", href: "/document#character-certificate", live: false, blurb: "Verification of conduct, often needed for jobs and abroad admissions." },
  { slug: "legal-heir", label: "Legal Heir Certificate", group: "Government Certificates", href: "/document#legal-heir", live: false, blurb: "Succession proof used to transfer assets after death." },

  // Legal & Agreements
  { slug: "affidavit", label: "Affidavit Preparation", group: "Legal & Agreements", href: "/document#affidavit", live: false, blurb: "Sworn statements for name change, income and residence." },
  { slug: "name-change-affidavit", label: "Name Change Affidavit", group: "Legal & Agreements", href: "/document#name-change-affidavit", live: false, blurb: "The affidavit that begins a legal name-change process." },
  { slug: "rent-agreement", label: "Rent Agreement", group: "Legal & Agreements", href: "/document#rent-agreement", live: false, blurb: "Drafted, stamped and registered for tenancies." },
  { slug: "leave-license", label: "Leave & License Agreement", group: "Legal & Agreements", href: "/document#leave-license", live: false, blurb: "A licence agreement for renting without a tenancy." },
  { slug: "power-of-attorney", label: "Power of Attorney", group: "Legal & Agreements", href: "/document#power-of-attorney", live: false, blurb: "General and special authority drafted and notarised." },
  { slug: "will", label: "Will Preparation", group: "Legal & Agreements", href: "/document#will", live: false, blurb: "A simple, valid will that says what you meant." },

  // Business & Tax
  { slug: "gst", label: "GST Registration", group: "Business & Tax", href: serviceHref("gst"), live: true, blurb: "A GSTIN in your name, start to finish." },
  { slug: "udyam-msme", label: "Udyam/MSME Registration", group: "Business & Tax", href: serviceHref("msme-udyam"), live: true, blurb: "The certificate for collateral-free loans and tenders." },
  { slug: "fssai", label: "FSSAI Registration", group: "Business & Tax", href: "/document#fssai", live: false, blurb: "Food business licence — Basic, State and Central." },
  { slug: "trademark", label: "Trademark Registration", group: "Business & Tax", href: "/document#trademark", live: false, blurb: "Brand name and logo protected across the correct classes." },
];

export function getDocumentsByGroup(group: DocGroup): DocumentItem[] {
  return documents.filter((d) => d.group === group);
}
