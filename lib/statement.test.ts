import { test } from "node:test";
import assert from "node:assert/strict";
import { statementCsv, statementFilename } from "./statement.ts";
import type { WalletEntry } from "./wallet-entries.ts";

/**
 * A statement is a record someone files, forwards to an accountant or
 * reconciles against a bank line. Every failure mode of a hand-rolled CSV is
 * silent — the file opens, it looks like a table, and the numbers are wrong —
 * so the escaping and the number format are worth pinning down.
 */

const entry = (over: Partial<WalletEntry> = {}): WalletEntry => ({
  id: "e1",
  direction: "credit",
  amount_paise: 500000,
  reason: "Wallet top-up",
  created_at: "2026-09-01T04:30:00.000Z",
  razorpay_payment_id: null,
  order_id: null,
  ...over,
});

test("a debit is negative and a credit is positive, as plain decimals", () => {
  const csv = statementCsv([
    entry({ id: "a", direction: "credit", amount_paise: 500000 }),
    entry({ id: "b", direction: "debit", amount_paise: 149900 }),
  ]);
  const rows = csv.trimEnd().split("\r\n").slice(1);
  assert.ok(rows.some((r) => r.includes(",5000.00,")), "credit is +5000.00");
  assert.ok(rows.some((r) => r.includes(",-1499.00,")), "debit is -1499.00");
  assert.ok(!csv.includes("₹"), "no currency symbol — the column must be numeric");
  assert.ok(!/\d,\d{3}\.\d\d/.test(csv), "no grouping commas inside an amount");
});

test("a comma in the reason cannot shift the row", () => {
  /* The failure this prevents: one row silently gains a column, so every field
     after it lands in the wrong place for that row and no other. */
  const csv = statementCsv([entry({ reason: "GST Registration, Delhi" })]);
  const header = csv.split("\r\n")[0].split(",").length;
  const row = csv.split("\r\n")[1];
  const fields = row.match(/("([^"]|"")*"|[^,]*)/g)!.filter((f) => f !== "");
  assert.equal(fields.length, header, "the row still has the header's field count");
  assert.ok(csv.includes('"GST Registration, Delhi"'));
});

test("a quote in the reason is doubled, not dropped", () => {
  const csv = statementCsv([entry({ reason: 'Fee for "urgent" filing' })]);
  assert.ok(csv.includes('"Fee for ""urgent"" filing"'));
});

test("the file opens as UTF-8 in Excel and uses CRLF", () => {
  const csv = statementCsv([entry()]);
  assert.equal(csv[0], "﻿", "leading BOM");
  assert.ok(csv.includes("\r\n"), "CRLF line endings, per RFC 4180");
  assert.ok(!/[^\r]\n/.test(csv), "no bare LF anywhere");
});

test("the statement runs oldest first, so a running total can be added", () => {
  /* The screen shows newest first because that is the question a balance
     answers. A downloaded ledger has to run the other way. */
  const csv = statementCsv([
    entry({ id: "new", created_at: "2026-09-05T00:00:00.000Z" }),
    entry({ id: "old", created_at: "2026-09-01T00:00:00.000Z" }),
  ]);
  assert.ok(csv.indexOf('"old"') < csv.indexOf('"new"'));
});

test("an empty wallet still produces a valid file with its header", () => {
  const csv = statementCsv([]);
  const lines = csv.trimEnd().split("\r\n");
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes('"Amount (INR)"'));
});

test("the filename sorts and says what it is", () => {
  assert.equal(
    statementFilename(new Date("2026-09-08T10:00:00Z")),
    "lawfic-wallet-statement-2026-09-08.csv",
  );
});
