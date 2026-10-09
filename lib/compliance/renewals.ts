/**
 * Licences that expire, and how far ahead to warn about each.
 *
 * Lead times are generous on purpose: a trademark renewal can be filed six
 * months ahead, an FSSAI renewal is due 30 days before expiry (after which a
 * daily late fee runs), and a DSC that lapses the week a tender closes is a
 * lost tender. Warning early costs nothing.
 */

import { daysBetween } from "./calendar.ts";

export type LicenceKind =
  | "fssai"
  | "trademark"
  | "dsc"
  | "trade_licence"
  | "shop_establishment"
  | "drug_licence"
  | "iso"
  | "dir3kyc"
  | "other";

export const LICENCE_KINDS: { id: LicenceKind; label: string; warnDays: number; renewSlug?: string; note: string }[] = [
  { id: "fssai", label: "FSSAI licence / registration", warnDays: 60, renewSlug: "fssai", note: "Renew at least 30 days before expiry; ₹100 a day after." },
  { id: "trademark", label: "Trademark", warnDays: 180, renewSlug: "trademark", note: "Valid 10 years. Renewable up to six months early." },
  { id: "dsc", label: "Digital signature (DSC)", warnDays: 30, renewSlug: "digital-signature", note: "Class 3 tokens run one, two or three years." },
  { id: "trade_licence", label: "Trade licence", warnDays: 45, renewSlug: "trade-licence", note: "Usually yearly, from the municipal body." },
  { id: "shop_establishment", label: "Shop & Establishment", warnDays: 45, renewSlug: "shop-establishment", note: "Renewal cycle depends on your state; some are lifetime." },
  { id: "drug_licence", label: "Drug licence", warnDays: 90, renewSlug: "drug-licence", note: "Retention fee is due before expiry." },
  { id: "iso", label: "ISO certificate", warnDays: 90, renewSlug: "iso-certification", note: "Surveillance audits fall due every year." },
  { id: "dir3kyc", label: "Director KYC (DIR-3 KYC)", warnDays: 60, renewSlug: "roc-filings", note: "Once every three years, by 30 June. Enter that 30 June as the date." },
  { id: "other", label: "Something else", warnDays: 30, note: "" },
];

export function licenceMeta(kind: string) {
  return LICENCE_KINDS.find((k) => k.id === kind) ?? LICENCE_KINDS[LICENCE_KINDS.length - 1];
}

export type RenewalState = "expired" | "renew-now" | "ok";

export function renewalState(kind: string, expiresOn: string, today: string): { state: RenewalState; daysLeft: number } {
  const daysLeft = daysBetween(today, expiresOn);
  if (daysLeft < 0) return { state: "expired", daysLeft };
  if (daysLeft <= licenceMeta(kind).warnDays) return { state: "renew-now", daysLeft };
  return { state: "ok", daysLeft };
}
