/**
 * Checking a GSTIN, PAN, TAN, CIN, LLPIN or Udyam number for shape and
 * checksum.
 *
 * WHAT THIS CAN AND CANNOT TELL YOU
 *
 * It catches typing errors and fakes made by someone who did not know the
 * GSTIN carries a check digit — which, in practice, is most fakes on an
 * invoice. It cannot tell you a number is ACTIVE: a cancelled GSTIN passes
 * every test here. That needs the GST portal, which offers no free public API,
 * so the page links straight to the government search for the live status
 * rather than pretending to know it.
 */

import { REGIONS } from "../states.ts";

export type IdKind = "gstin" | "pan" | "tan" | "cin" | "llpin" | "udyam";

export type IdCheck = {
  kind: IdKind;
  value: string;
  valid: boolean;
  /** What failed, in plain words, or what the number tells you if it passed. */
  facts: { label: string; value: string }[];
  problems: string[];
  /** Where to check the live status. */
  officialCheck?: { label: string; url: string };
};

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** GSTIN state codes (first two digits) → state name. */
export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
  "97": "Other territory", "99": "Centre jurisdiction",
};

/** The fourth character of a PAN says what kind of holder it belongs to. */
export const PAN_HOLDER: Record<string, string> = {
  P: "Individual", C: "Company", H: "Hindu Undivided Family", F: "Firm or LLP",
  A: "Association of persons", T: "Trust", B: "Body of individuals",
  L: "Local authority", J: "Artificial juridical person", G: "Government", E: "LLP",
};

/** The GSTIN check digit, per the CBIC algorithm (Luhn mod 36). */
export function gstinCheckDigit(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = CHARSET.indexOf(first14[i]);
    const p = v * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 36) + (p % 36);
  }
  return CHARSET[(36 - (sum % 36)) % 36];
}

const clean = (s: string) => s.toUpperCase().replace(/\s+/g, "");

function checkPanShape(pan: string, problems: string[], facts: IdCheck["facts"]) {
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    problems.push("A PAN is five letters, four digits and a letter — ABCDE1234F.");
    return;
  }
  const holder = PAN_HOLDER[pan[3]];
  if (!holder) problems.push(`The fourth character, "${pan[3]}", is not a holder type the Income Tax Department issues.`);
  else facts.push({ label: "Holder type", value: holder });
}

export function checkId(kind: IdKind, raw: string): IdCheck {
  const value = clean(raw);
  const problems: string[] = [];
  const facts: IdCheck["facts"] = [];
  let officialCheck: IdCheck["officialCheck"];

  switch (kind) {
    case "gstin": {
      officialCheck = { label: "Search taxpayer on the GST portal", url: "https://services.gst.gov.in/services/searchtp" };
      if (value.length !== 15) {
        problems.push(`A GSTIN has 15 characters; this has ${value.length}.`);
        break;
      }
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][A-Z0-9][0-9A-Z]$/.test(value)) {
        problems.push("The characters are not in the GSTIN pattern: 2 digits, a PAN, an entity number, Z, and a check character.");
        break;
      }
      const state = GST_STATE_CODES[value.slice(0, 2)];
      if (!state) problems.push(`"${value.slice(0, 2)}" is not a GST state code.`);
      else facts.push({ label: "Registered in", value: state });
      checkPanShape(value.slice(2, 12), problems, facts);
      facts.push({ label: "PAN inside it", value: value.slice(2, 12) });
      facts.push({ label: "Registration number under this PAN in the state", value: value[12] });
      const expected = gstinCheckDigit(value.slice(0, 14));
      if (expected !== value[14]) problems.push(`The check character should be "${expected}", not "${value[14]}" — the number has a typo or was made up.`);
      break;
    }
    case "pan": {
      officialCheck = { label: "Verify PAN on the e-filing portal", url: "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/verifyYourPAN" };
      checkPanShape(value, problems, facts);
      break;
    }
    case "tan": {
      if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(value)) problems.push("A TAN is four letters, five digits and a letter — DELA12345B.");
      else facts.push({ label: "Issued by", value: `Assessing officer area code ${value.slice(0, 3)}` });
      officialCheck = { label: "Know your TAN", url: "https://eportal.incometax.gov.in/iec/foservices/#/pre-login/knowYourTAN" };
      break;
    }
    case "cin": {
      officialCheck = { label: "Company master data on MCA", url: "https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html" };
      const m = /^([LU])([0-9]{5})([A-Z]{2})([0-9]{4})([A-Z]{3})([0-9]{6})$/.exec(value);
      if (!m) {
        problems.push("A CIN is 21 characters: L or U, 5 digits, state, year, type, and a 6-digit number.");
        break;
      }
      facts.push({ label: "Listed", value: m[1] === "L" ? "Yes" : "No (unlisted)" });
      const region = REGIONS.find((r) => r.code === m[3]);
      facts.push({ label: "State of registration", value: region?.name ?? m[3] });
      facts.push({ label: "Year incorporated", value: m[4] });
      const types: Record<string, string> = {
        PTC: "Private limited company", PLC: "Public limited company", OPC: "One Person Company",
        NPL: "Section 8 (not-for-profit)", GOI: "Government of India company", SGC: "State government company",
        FLC: "Foreign company (public)", FTC: "Foreign company (private)", ULL: "Unlimited public", ULT: "Unlimited private",
      };
      facts.push({ label: "Company type", value: types[m[5]] ?? m[5] });
      const year = Number(m[4]);
      if (year < 1850 || year > new Date().getFullYear()) problems.push(`${year} is not a possible year of incorporation.`);
      break;
    }
    case "llpin": {
      officialCheck = { label: "LLP master data on MCA", url: "https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html" };
      if (!/^[A-Z]{3}-[0-9]{4}$/.test(value)) problems.push("An LLPIN is three letters, a hyphen and four digits — AAB-1234.");
      break;
    }
    case "udyam": {
      officialCheck = { label: "Verify on the Udyam portal", url: "https://udyamregistration.gov.in/Udyam_Verify.aspx" };
      const m = /^UDYAM-([A-Z]{2})-([0-9]{2})-([0-9]{7})$/.exec(value);
      if (!m) {
        problems.push("A Udyam number looks like UDYAM-HP-02-0001234.");
        break;
      }
      const region = REGIONS.find((r) => r.code === m[1]);
      facts.push({ label: "State", value: region?.name ?? m[1] });
      facts.push({ label: "District code", value: m[2] });
      break;
    }
  }

  return { kind, value, valid: problems.length === 0, facts, problems, officialCheck };
}
