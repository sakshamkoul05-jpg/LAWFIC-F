/**
 * States and union territories, and why the site asks which one you are in.
 *
 * This is the "deliver to" of a filings business, and it is not cosmetic. A
 * great deal of Indian compliance is administered by the state rather than the
 * centre, and the answer genuinely differs:
 *
 *   - Shops & Establishment registration is a state Act, with its own fee,
 *     its own renewal cycle and its own portal in every state;
 *   - Professional Tax exists in some states and not at all in others —
 *     Maharashtra and Karnataka levy it, Delhi and Haryana do not;
 *   - Trade licences are issued by the municipal body;
 *   - GST registration is state-wise: a business operating in three states
 *     holds three GSTINs;
 *   - stamp duty on the same agreement varies severalfold across states.
 *
 * So "which state" changes what a customer needs, what it costs and how long it
 * takes. Asking once in the chrome and remembering the answer is worth more
 * here than a postcode is to a retailer.
 *
 * Stored locally only. This is a preference for tailoring what is shown, not a
 * declaration of residence, and it is not sent anywhere or attached to an
 * account — a state is a weak identifier but an identifier nonetheless, and
 * there is no reason to collect it.
 */

export type Region = { code: string; name: string; union?: true };

export const REGIONS: Region[] = [
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
  { code: "AN", name: "Andaman & Nicobar Islands", union: true },
  { code: "CH", name: "Chandigarh", union: true },
  { code: "DH", name: "Dadra & Nagar Haveli and Daman & Diu", union: true },
  { code: "DL", name: "Delhi", union: true },
  { code: "JK", name: "Jammu & Kashmir", union: true },
  { code: "LA", name: "Ladakh", union: true },
  { code: "LD", name: "Lakshadweep", union: true },
  { code: "PY", name: "Puducherry", union: true },
];

export const REGION_KEY = "lawfic.region";

export function getRegion(code: string | null): Region | undefined {
  return REGIONS.find((r) => r.code === code);
}
