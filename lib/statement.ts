import type { WalletEntry } from "./wallet-entries";

/**
 * The wallet statement as a CSV a spreadsheet will open without complaint.
 *
 * "Download Wallet Statement" in the client's blueprint. A statement is a
 * record someone may file, forward to an accountant or reconcile against a bank
 * line, so the details below are the whole job — a table that looks right on
 * screen and corrupts in Excel is not a statement.
 *
 * WHAT MAKES THIS CORRECT RATHER THAN JUST PRESENT
 *
 *   - AMOUNTS ARE SIGNED AND UNFORMATTED. A credit is 5000.00 and a debit is
 *     -1499.00: plain decimals with no ₹, no grouping commas and no unicode
 *     minus. A column full of "₹1,499" is text to a spreadsheet, and the first
 *     thing anyone does with a statement is sum it;
 *   - EVERY FIELD IS QUOTED AND ITS QUOTES DOUBLED. A reason containing a
 *     comma — "GST Registration, Delhi" — silently splits into two columns
 *     otherwise, shifting every field after it by one for that row only, which
 *     is the kind of corruption nobody notices until the totals disagree;
 *   - DATES ARE ISO, plus a separate human column. ISO sorts correctly as text
 *     and is unambiguous about day and month; 03/04/2026 is two different days
 *     depending on who opens it;
 *   - CRLF LINE ENDINGS, because that is what RFC 4180 says and what Excel
 *     expects;
 *   - A BOM. Without one, Excel on Windows reads the file as the local
 *     codepage and a rupee sign or a name with an accent arrives as mojibake.
 */

const HEADERS = [
  "Date (ISO)",
  "Date",
  "Direction",
  "Amount (INR)",
  "Reason",
  "Reference",
  "Order",
  "Entry ID",
] as const;

/** One field, quoted, with any quotes inside it doubled. */
function cell(value: string | null | undefined): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/** Paise to a signed plain decimal: 149900 debit becomes -1499.00. */
function amount(entry: WalletEntry): string {
  const rupees = entry.amount_paise / 100;
  const signed = entry.direction === "credit" ? rupees : -rupees;
  return signed.toFixed(2);
}

function human(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statementCsv(rows: WalletEntry[]): string {
  const lines = [HEADERS.map(cell).join(",")];

  /* Oldest first. A statement is read forwards — the screen shows newest at the
     top because that is the question a balance answers, but a downloaded ledger
     that runs backwards cannot have a running total put beside it. */
  const ordered = [...rows].reverse();

  for (const r of ordered) {
    lines.push(
      [
        cell(r.created_at),
        cell(human(r.created_at)),
        cell(r.direction),
        /* Deliberately unquoted: this column has to arrive as a number. */
        amount(r),
        cell(r.reason),
        cell(r.razorpay_payment_id ?? ""),
        cell(r.order_id ?? ""),
        cell(r.id),
      ].join(","),
    );
  }

  return `﻿${lines.join("\r\n")}\r\n`;
}

/** `lawfic-wallet-statement-2026-09-08.csv` — sortable, and says what it is. */
export function statementFilename(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `lawfic-wallet-statement-${stamp}.csv`;
}
