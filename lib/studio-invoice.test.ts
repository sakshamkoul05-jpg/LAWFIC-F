import { test } from "node:test";
import assert from "node:assert/strict";
import {
  amountInWords,
  blankInvoice,
  formatINR,
  invoiceFileName,
  nextInvoiceNumber,
  numberToWordsIN,
  SERVICES,
  totals,
} from "./studio-invoice.ts";

test("words follow the Indian system", () => {
  assert.equal(numberToWordsIN(18000), "Eighteen Thousand");
  assert.equal(numberToWordsIN(12000), "Twelve Thousand");
  assert.equal(numberToWordsIN(4500), "Four Thousand Five Hundred");
  assert.equal(numberToWordsIN(125000), "One Lakh Twenty Five Thousand");
  assert.equal(numberToWordsIN(10000000), "One Crore");
  assert.equal(numberToWordsIN(2_35_40_019), "Two Crore Thirty Five Lakh Forty Thousand Nineteen");
  assert.equal(amountInWords(1800000), "Rupees Eighteen Thousand Only");
  assert.equal(amountInWords(450050), "Rupees Four Thousand Five Hundred and Fifty Paise Only");
  assert.equal(amountInWords(0), "Rupees Zero Only");
});

test("rupees are formatted with Indian grouping", () => {
  assert.equal(formatINR(1800000), "₹18,000");
  assert.equal(formatINR(12345678900), "₹12,34,56,789");
  assert.equal(formatINR(450050), "₹4,500.50");
});

test("the MV Homes bill: 18,000 split 50/25/25", () => {
  const d = blankInvoice("LF/INV/2026/1022", "2026-10-22");
  d.items[0].rate = 18000;
  const t = totals(d);
  assert.equal(t.total, 1800000);
  assert.deepEqual(t.milestones, [900000, 450000, 450000]);
});

test("milestones always add up to the total", () => {
  const d = blankInvoice("x", "2026-11-01");
  d.items[0].rate = 10001;
  d.milestones = [
    { id: "a", percent: 33, label: "", note: "" },
    { id: "b", percent: 33, label: "", note: "" },
    { id: "c", percent: 34, label: "", note: "" },
  ];
  const t = totals(d);
  assert.equal(t.milestones.reduce((s, v) => s + v, 0), t.total);
});

test("discount, quantity and 18% GST", () => {
  const d = blankInvoice("x", "2026-11-01");
  d.items = [
    { id: "a", title: "Website", qty: 1, rate: 20000 },
    { id: "b", title: "Extra page", qty: 2, rate: 1500 },
  ];
  d.discount = 3000;
  d.tax = "add18";
  const t = totals(d);
  assert.equal(t.subtotal, 2300000);
  assert.equal(t.taxable, 2000000);
  assert.equal(t.gst, 360000);
  assert.equal(t.total, 2360000);
  /* a discount can never take the bill below zero */
  d.discount = 999999;
  assert.equal(totals(d).total, 0);
  /* excluding GST adds nothing */
  d.discount = 0;
  d.tax = "excluding";
  assert.equal(totals(d).gst, 0);
});

test("numbers run on from the highest of the year", () => {
  assert.equal(nextInvoiceNumber([], 2026), "LF/INV/2026/1001");
  assert.equal(nextInvoiceNumber(["LF/INV/2026/1022", "LF/INV/2026/1009", "LF/INV/2025/1400"], 2026), "LF/INV/2026/1023");
  assert.equal(nextInvoiceNumber(["LF/INV/2025/1400"], 2026), "LF/INV/2026/1001");
  assert.equal(nextInvoiceNumber(["LF/INV/2026/draft"], 2026), "LF/INV/2026/1001");
});

test("every service but Other has a title and what it includes", () => {
  for (const s of SERVICES) {
    if (s.key === "other") continue;
    assert.ok(s.title, s.key);
    assert.ok(s.inclusions.length >= 4, s.key);
  }
});

test("the PDF name is safe to save", () => {
  const d = blankInvoice("LF/INV/2026/1023", "2026-11-01");
  d.client.business = "MV HOMES / Delhi";
  assert.equal(invoiceFileName(d), "Invoice LF-INV-2026-1023 MV HOMES Delhi");
});
