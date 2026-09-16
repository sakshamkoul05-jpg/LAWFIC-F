import assert from "node:assert/strict";
import { test } from "node:test";
import {
  amountRows,
  canIssueTaxInvoices,
  documentTitle,
  taxDisclaimer,
  taxDocumentBlockers,
  type Invoice,
} from "./invoice.ts";
import { company } from "./company.ts";

const base = {
  id: "i1",
  issued_at: "2026-09-17T06:00:00.000Z",
  narration: "GST Registration",
};

const receipt: Invoice = {
  ...base,
  number: "LF/2627/000001",
  kind: "receipt",
  total_paise: 100000,
  taxable_paise: 100000,
  tax_paise: 0,
  tax_rate_bp: 0,
};

const taxInvoice: Invoice = {
  ...base,
  number: "LF/2627/000002",
  kind: "tax_invoice",
  total_paise: 99900,
  taxable_paise: 84661,
  tax_paise: 15239,
  tax_rate_bp: 1800,
};

test("a top-up is a receipt and says why no GST appears on it", () => {
  /* Loading a closed-loop wallet is not a supply, so charging GST on it would
     be wrong. The document has to explain that rather than leave a customer
     wondering where the tax line went. */
  assert.equal(documentTitle(receipt), "Payment receipt");
  assert.match(taxDisclaimer(receipt)!, /no service has been supplied yet/i);
});

test("a receipt shows one amount and no tax line", () => {
  const rows = amountRows(receipt);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].label, "Amount");
});

test("a taxed document itemises taxable value, GST and total", () => {
  const rows = amountRows(taxInvoice);
  assert.deepEqual(
    rows.map((r) => r.label),
    ["Taxable value", "GST @ 18%", "Total paid"],
  );
});

/* ------------------------------------------------- the legal safety net -- */

test("without a GSTIN, nothing may call itself a tax invoice", () => {
  /* THE ASSERTION THAT MATTERS. Rule 46 CGST requires the supplier's GSTIN,
     legal name and address on a tax invoice. company.ts has none of them, and
     printing the words anyway would put a false tax document in a customer's
     hands — a worse outcome than having no invoice at all. */
  if (canIssueTaxInvoices()) {
    /* If somebody has filled company.ts in, the opposite must hold. */
    assert.equal(documentTitle(taxInvoice), "Tax invoice");
    assert.equal(taxDisclaimer(taxInvoice), null);
    return;
  }
  assert.equal(documentTitle(taxInvoice), "Payment receipt");
  assert.match(taxDisclaimer(taxInvoice)!, /not a tax invoice/i);
  assert.match(taxDisclaimer(taxInvoice)!, /input tax credit/i);
});

test("the blockers name exactly what is missing", () => {
  const blockers = taxDocumentBlockers();
  assert.equal(blockers.includes("GSTIN"), !company.gstin);
  assert.equal(blockers.includes("registered legal name"), !company.legalName);
  assert.equal(blockers.includes("registered address"), !company.registeredAddress);
});

test("the row's kind stays honest even when the wording cannot", () => {
  /* The database labels a debit `tax_invoice` because that is what the
     movement IS. Whether the words may be printed is a separate question about
     a GST registration. Conflating the two would mean losing the record of
     which movements were supplies once the registration arrives. */
  assert.equal(taxInvoice.kind, "tax_invoice");
  assert.equal(taxInvoice.tax_paise > 0, true);
});
