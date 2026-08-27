/**
 * Money is paise everywhere, and an integer everywhere. Rupees exist only at
 * the moment something is displayed or a user types an amount. No float ever
 * touches a balance.
 */

export const MIN_TOPUP_PAISE = 10000; // ₹100
export const MAX_TOPUP_PAISE = 10000000; // ₹1,00,000 — a sanity ceiling, not a policy

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

/** "₹2,000" / "₹1,499.50" — Indian digit grouping, decimals only when needed. */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(rupees);
}

/** Signed, for a statement line. */
export function formatEntry(direction: "credit" | "debit", paise: number): string {
  if (paise === 0) return formatPaise(0);
  return `${direction === "credit" ? "+ " : "− "}${formatPaise(paise)}`;
}

export type TopUpCheck = { ok: true; paise: number } | { ok: false; error: string };

/**
 * The single place a user-supplied amount is validated. Both the API route and
 * the form use it, so the browser cannot be talked into sending something the
 * server would accept but the UI would not.
 */
export function checkTopUpAmount(rupees: unknown): TopUpCheck {
  const n = typeof rupees === "number" ? rupees : Number(rupees);
  if (!Number.isFinite(n)) return { ok: false, error: "Enter an amount." };
  if (!Number.isInteger(n)) return { ok: false, error: "Enter a whole number of rupees." };

  const paise = toPaise(n);
  if (paise < MIN_TOPUP_PAISE) {
    return { ok: false, error: `The minimum top-up is ${formatPaise(MIN_TOPUP_PAISE)}.` };
  }
  if (paise > MAX_TOPUP_PAISE) {
    return { ok: false, error: `The maximum top-up is ${formatPaise(MAX_TOPUP_PAISE)}.` };
  }
  return { ok: true, paise };
}
