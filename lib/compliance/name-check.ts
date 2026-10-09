/**
 * A first look at whether a company, LLP or brand name will get through.
 *
 * WHAT IT IS NOT
 *
 * It is not an availability search. Neither the MCA nor the Trade Marks
 * Registry offers a public API, and a page that says "available!" off a guess
 * is how someone prints a thousand boxes with a name the registrar then
 * refuses. So this does the part that can be done honestly — the naming rules
 * in the Companies (Incorporation) Rules, 2014, rule 8 to 8B, and the LLP
 * Rules — and then sends the customer to the two official searches, or to us.
 */

export type NameKind = "company" | "llp" | "brand";

export type NameIssue = { severity: "block" | "warn"; message: string };

export type NameCheck = {
  cleaned: string;
  issues: NameIssue[];
  /** Words in the name that need a regulator's or the Centre's approval. */
  restricted: string[];
  suggestions: string[];
};

/* Words that need prior approval of the Central Government or a regulator
   (rule 8B and the Emblems and Names Act). Matched as whole words. */
const RESTRICTED: Record<string, string> = {
  bank: "RBI", banking: "RBI", insurance: "IRDAI", assurance: "IRDAI", reinsurance: "IRDAI",
  "mutual fund": "SEBI", "stock exchange": "SEBI", "venture capital": "SEBI", "asset management": "SEBI",
  nidhi: "MCA (Nidhi rules)", "micro finance": "RBI", microfinance: "RBI",
  national: "Central Government", union: "Central Government", central: "Central Government",
  federal: "Central Government", republic: "Central Government", president: "Central Government",
  board: "Central Government", commission: "Central Government", authority: "Central Government",
  undertaking: "Central Government", municipal: "Central Government", panchayat: "Central Government",
  government: "Central Government", ministry: "Central Government", state: "Central Government",
  india: "Central Government", indian: "Central Government", bharat: "Central Government",
  hindustan: "Central Government", chartered: "Central Government", bureau: "Central Government",
  forum: "Central Government", "co-operative": "not permitted for a company", cooperative: "not permitted for a company",
};

const COMPANY_SUFFIX = /\b(private limited|pvt\.? ltd\.?|limited|ltd\.?|opc private limited)\s*$/i;
const LLP_SUFFIX = /\b(llp|limited liability partnership)\s*$/i;

/* Words too generic to be distinctive on their own. */
const GENERIC = new Set([
  "india", "solutions", "services", "enterprises", "traders", "trading", "industries", "global",
  "international", "technologies", "tech", "infotech", "consultants", "consultancy", "ventures",
  "group", "and", "&", "the", "private", "limited", "pvt", "ltd", "llp", "company", "co",
]);

export function checkName(kind: NameKind, raw: string): NameCheck {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const issues: NameIssue[] = [];
  const lower = cleaned.toLowerCase();

  if (cleaned.length < 3) issues.push({ severity: "block", message: "Too short to register." });
  if (cleaned.length > 120) issues.push({ severity: "block", message: "Too long — keep it under 120 characters." });
  if (/[^a-zA-Z0-9 &().,'-]/.test(cleaned)) {
    issues.push({ severity: "block", message: "Only letters, numbers and & ( ) . , ' - are accepted by the registrar." });
  }

  const restricted: string[] = [];
  for (const [word, who] of Object.entries(RESTRICTED)) {
    const re = new RegExp(`(^|[^a-z])${word.replace(/[-\s]/g, "[-\\s]?")}([^a-z]|$)`, "i");
    if (re.test(lower)) restricted.push(`${word} — needs ${who}`);
  }
  if (restricted.length && kind !== "brand") {
    issues.push({
      severity: "warn",
      message: "Contains words the registrar will not accept without a regulator's or the Central Government's approval.",
    });
  }

  const body = lower
    .replace(COMPANY_SUFFIX, "")
    .replace(LLP_SUFFIX, "")
    .split(/[\s,.()'-]+/)
    .filter(Boolean);
  const distinctive = body.filter((w) => !GENERIC.has(w));

  if (body.length && distinctive.length === 0) {
    issues.push({
      severity: "block",
      message: "Every word is generic. The registrar wants at least one distinctive word — a coined word or a proper noun.",
    });
  } else if (distinctive.length === 1 && distinctive[0].length <= 3) {
    issues.push({ severity: "warn", message: "The only distinctive word is very short; short names are usually taken." });
  }

  if (/^\d/.test(cleaned)) issues.push({ severity: "warn", message: "Names starting with a number are often objected to." });

  if (kind === "company" && !COMPANY_SUFFIX.test(cleaned)) {
    issues.push({ severity: "warn", message: 'A private company name must end in "Private Limited". We have added it in the suggestions.' });
  }
  if (kind === "llp" && !LLP_SUFFIX.test(cleaned)) {
    issues.push({ severity: "warn", message: 'An LLP name must end in "LLP" or "Limited Liability Partnership".' });
  }
  if (kind === "brand" && body.length === 1 && /^(best|super|quality|fresh|pure|premium)$/.test(body[0])) {
    issues.push({ severity: "block", message: "A laudatory word alone cannot be registered as a trade mark." });
  }

  const core = cleaned.replace(COMPANY_SUFFIX, "").replace(LLP_SUFFIX, "").trim();
  const suggestions =
    kind === "company"
      ? [`${core} Private Limited`, `${core} Ventures Private Limited`, `${core} Labs Private Limited`]
      : kind === "llp"
        ? [`${core} LLP`, `${core} Associates LLP`, `${core} Partners LLP`]
        : [];

  return { cleaned, issues, restricted, suggestions };
}

export const OFFICIAL_SEARCHES = {
  mca: {
    label: "MCA — check company or LLP name",
    url: "https://www.mca.gov.in/content/mca/global/en/mca/fo-llp-services/check-company-name.html",
  },
  trademark: {
    label: "IP India — public trade mark search",
    url: "https://tmrsearch.ipindia.gov.in/ESEARCH/",
  },
};
