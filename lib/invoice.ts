import { company, formatAddress } from "./company.ts";
import { formatPaise } from "./money.ts";

/**
 * Invoices and receipts, as the customer sees them.
 *
 * The documents themselves are ISSUED BY THE DATABASE — a trigger on
 * wallet_entries, so no code path can forget and no retry can double-issue.
 * This file is the reading end: what a document is called, whether it is
 * legally a tax invoice, and how it renders.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  A TAX INVOICE IS A LEGAL DOCUMENT AND THIS COMPANY CANNOT YET ISSUE ONE
 *
 *  Rule 46 of the CGST Rules requires a tax invoice to carry the supplier's
 *  NAME, ADDRESS and GSTIN, among other things. lib/company.ts has all three
 *  as `null`, and inventing them would mean generating a false tax document —
 *  which is a considerably worse problem than not having one.
 *
 *  So until those facts exist, every document is issued and shown as a
 *  PAYMENT RECEIPT, clearly marked as not valid for input tax credit. The
 *  money is still recorded, the customer still gets paperwork, and nobody is
 *  handed a document that claims a GST registration the company does not have.
 *
 *  Fill in company.ts and the same rows render as tax invoices, with no
 *  migration and no reissue. `taxDocumentBlockers()` lists what is missing.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type InvoiceKind = "receipt" | "tax_invoice";

export type Invoice = {
  id: string;
  number: string;
  kind: InvoiceKind;
  issued_at: string;
  total_paise: number;
  taxable_paise: number;
  tax_paise: number;
  tax_rate_bp: number;
  narration: string;
};

/** What a tax invoice legally requires and this company does not yet have. */
export function taxDocumentBlockers(): string[] {
  const missing: string[] = [];
  if (!company.gstin) missing.push("GSTIN");
  if (!company.legalName) missing.push("registered legal name");
  if (!company.registeredAddress) missing.push("registered address");
  return missing;
}

/**
 * Can this company issue a document that calls itself a tax invoice?
 *
 * Deliberately a function of the company's facts and NOT of the row's `kind`.
 * The database labels a debit `tax_invoice` because that is what the movement
 * IS — a supply of services — and that labelling stays correct for ever. What
 * changes is whether we may print the words on a piece of paper, and that
 * depends on a GST registration existing.
 */
export function canIssueTaxInvoices(): boolean {
  return taxDocumentBlockers().length === 0;
}

/** What to print at the top of the document. */
export function documentTitle(invoice: Invoice): string {
  if (invoice.kind === "receipt") return "Payment receipt";
  return canIssueTaxInvoices() ? "Tax invoice" : "Payment receipt";
}

/**
 * The line that has to appear when a document is NOT a valid tax invoice.
 *
 * Silence here would be the dishonest option: a customer's accountant seeing
 * an 18% line would reasonably assume the tax is claimable, and it is not
 * claimable against a supplier with no GSTIN. Saying so is not an apology, it
 * is the single most useful sentence on the page.
 */
export function taxDisclaimer(invoice: Invoice): string | null {
  if (invoice.kind === "receipt") {
    return "A receipt for money added to your LAWFIC wallet. No service has been supplied yet, so no GST is charged here — the tax invoice is issued when you pay for a filing.";
  }
  if (canIssueTaxInvoices()) return null;
  return "This is a payment receipt, not a tax invoice, and it cannot be used to claim input tax credit. A GST-compliant tax invoice will be issued once LAWFIC's GST registration is in place.";
}

export type Party = { name: string; lines: string[] };

/** The supplier block, built only from facts that exist. */
export function supplierParty(): Party {
  const lines: string[] = [];
  if (company.registeredAddress) lines.push(formatAddress(company.registeredAddress));
  if (company.gstin) lines.push(`GSTIN: ${company.gstin}`);
  if (company.cin) lines.push(`CIN: ${company.cin}`);
  if (company.supportEmail) lines.push(company.supportEmail);
  return { name: company.legalName ?? company.brand, lines };
}

/** Rows for the money table. Tax is only ever shown when it was charged. */
export function amountRows(invoice: Invoice): { label: string; value: string }[] {
  if (invoice.tax_paise === 0) {
    return [{ label: "Amount", value: formatPaise(invoice.total_paise) }];
  }
  const rate = invoice.tax_rate_bp / 100;
  return [
    { label: "Taxable value", value: formatPaise(invoice.taxable_paise) },
    { label: `GST @ ${rate}%`, value: formatPaise(invoice.tax_paise) },
    { label: "Total paid", value: formatPaise(invoice.total_paise) },
  ];
}

/** "17 September 2026" — unambiguous, which a numeric date is not across borders. */
export function issuedOn(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
