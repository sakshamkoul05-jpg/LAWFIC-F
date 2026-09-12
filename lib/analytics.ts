/**
 * Turning the wallet ledger into the numbers a dashboard shows.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DAYS ARE IST DAYS, NOT UTC DAYS
 *
 * The single most important thing in this file. Postgres stores timestamptz in
 * UTC, and the obvious `created_at.slice(0, 10)` buckets by UTC date — which
 * puts every payment made between midnight and 5:30am India time onto the
 * PREVIOUS day. That is not a rounding error; it is a business in Chandigarh
 * being told Monday's takings were Sunday's, every night, for the busiest five
 * and a half hours of nobody's day but reliably enough to make a weekly total
 * wrong at both ends.
 *
 * So every bucket here is computed after shifting into IST. The offset is fixed
 * at +05:30 — India has no daylight saving and has not had since 1945, which is
 * why a constant is honest here where it would be a bug almost anywhere else.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REVENUE IS DEBITS, NOT CREDITS
 *
 * A credit is money arriving in a customer's wallet. It is not LAWFIC's money —
 * it is a liability, spendable only on LAWFIC services and owed back until it
 * is spent. A DEBIT is the moment work was paid for, and that is the only thing
 * counted as revenue here. Summing credits would report a top-up of ₹10,000 as
 * ten thousand rupees of income on a day when nothing was sold.
 */

/** +05:30, in milliseconds. India has had no daylight saving since 1945. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export type LedgerRow = {
  user_id: string;
  direction: "credit" | "debit";
  amount_paise: number;
  created_at: string;
};

export type Bucket = {
  /** `YYYY-MM-DD` for a day, `YYYY-MM` for a month. Both in IST. */
  key: string;
  /** What to print under the bar. */
  label: string;
  paise: number;
  /** How many debits landed in this bucket. */
  count: number;
};

/** The IST calendar date of an instant, as `YYYY-MM-DD`. */
export function istDay(iso: string): string {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The IST calendar month of an instant, as `YYYY-MM`. */
export function istMonth(iso: string): string {
  return istDay(iso).slice(0, 7);
}

/** `2026-09-13` → `13 Sep`. */
function dayLabel(key: string): string {
  const [, m, d] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(d)} ${months[Number(m) - 1]}`;
}

/** `2026-09` → `Sep 26`. */
function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[Number(m) - 1]} ${y.slice(2)}`;
}

/** The IST day `n` days before the IST day containing `now`. */
function shiftDay(now: Date, days: number): string {
  return new Date(now.getTime() + IST_OFFSET_MS - days * 86400000).toISOString().slice(0, 10);
}

/**
 * Revenue per IST day, for the last `days` days, oldest first.
 *
 * EVERY DAY IS PRESENT, INCLUDING THE EMPTY ONES
 *
 * Grouping the rows alone yields only days that had a sale, and a bar chart
 * built from that silently closes the gaps — six bars evenly spaced across a
 * month reads as steady daily trade when it was six sales in thirty days. The
 * zero days are the information. So the axis is generated first and the totals
 * are dropped into it.
 */
export function revenueByDay(rows: LedgerRow[], days = 30, now = new Date()): Bucket[] {
  const buckets = new Map<string, Bucket>();

  for (let i = days - 1; i >= 0; i--) {
    const key = shiftDay(now, i);
    buckets.set(key, { key, label: dayLabel(key), paise: 0, count: 0 });
  }

  for (const row of rows) {
    if (row.direction !== "debit") continue;
    const bucket = buckets.get(istDay(row.created_at));
    if (!bucket) continue; // Older than the window.
    bucket.paise += row.amount_paise;
    bucket.count += 1;
  }

  return [...buckets.values()];
}

/** Revenue per IST month, for the last `months` months, oldest first. */
export function revenueByMonth(rows: LedgerRow[], months = 12, now = new Date()): Bucket[] {
  const buckets = new Map<string, Bucket>();

  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  let year = ist.getUTCFullYear();
  let month = ist.getUTCMonth();

  const keys: string[] = [];
  for (let i = 0; i < months; i++) {
    keys.push(`${year}-${String(month + 1).padStart(2, "0")}`);
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  for (const key of keys.reverse()) {
    buckets.set(key, { key, label: monthLabel(key), paise: 0, count: 0 });
  }

  for (const row of rows) {
    if (row.direction !== "debit") continue;
    const bucket = buckets.get(istMonth(row.created_at));
    if (!bucket) continue;
    bucket.paise += row.amount_paise;
    bucket.count += 1;
  }

  return [...buckets.values()];
}

export type CustomerSpend = {
  userId: string;
  paise: number;
  orders: number;
  /** Most recent debit, ISO. */
  lastAt: string | null;
};

/**
 * What each customer has spent, biggest first.
 *
 * Spend, not balance. A customer holding ₹50,000 they have never used is not a
 * big customer — they are a big liability, and a "top customers" list sorted by
 * balance would put the people who have bought the least at the top of it.
 */
export function spendByCustomer(rows: LedgerRow[], limit = 10): CustomerSpend[] {
  const totals = new Map<string, CustomerSpend>();

  for (const row of rows) {
    if (row.direction !== "debit") continue;
    const found = totals.get(row.user_id) ?? {
      userId: row.user_id,
      paise: 0,
      orders: 0,
      lastAt: null,
    };
    found.paise += row.amount_paise;
    found.orders += 1;
    if (!found.lastAt || row.created_at > found.lastAt) found.lastAt = row.created_at;
    totals.set(row.user_id, found);
  }

  return [...totals.values()].sort((a, b) => b.paise - a.paise).slice(0, limit);
}

/** Headline figures, all from the same pass over the ledger. */
export function totals(rows: LedgerRow[], now = new Date()) {
  const today = shiftDay(now, 0);
  const thisMonth = today.slice(0, 7);

  let allTime = 0;
  let todayPaise = 0;
  let monthPaise = 0;
  let orders = 0;
  const customers = new Set<string>();

  for (const row of rows) {
    if (row.direction !== "debit") continue;
    const day = istDay(row.created_at);
    allTime += row.amount_paise;
    orders += 1;
    customers.add(row.user_id);
    if (day === today) todayPaise += row.amount_paise;
    if (day.startsWith(thisMonth)) monthPaise += row.amount_paise;
  }

  return {
    allTime,
    today: todayPaise,
    month: monthPaise,
    orders,
    payingCustomers: customers.size,
    /* Guarded rather than allowed to be NaN. A dashboard that prints "₹NaN" on
       its first day is a dashboard nobody trusts on its second. */
    averageOrder: orders > 0 ? Math.round(allTime / orders) : 0,
  };
}
