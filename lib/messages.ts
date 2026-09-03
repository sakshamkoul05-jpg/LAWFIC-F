/**
 * Messages on a filing.
 *
 * The same thread is shown to the customer on their order and to staff in the
 * back office, deliberately: one record of what was said, read identically by
 * both sides. A back office that keeps its own private notes alongside a
 * separate customer-facing message is two versions of events waiting to
 * disagree — `service_orders.admin_notes` already exists for anything genuinely
 * internal, and the distinction is worth keeping sharp.
 */

export type OrderMessage = {
  id: string;
  order_id: string;
  author_id: string;
  from_staff: boolean;
  body: string;
  read_at: string | null;
  created_at: string;
};

export const MESSAGE_MAX = 4000;

/**
 * Whether a body is worth sending.
 *
 * Matches the CHECK on the column, so the button disables for the same reason
 * the database would refuse — a validation that disagrees with the constraint
 * behind it just moves the error somewhere less helpful.
 */
export function isSendable(body: string): boolean {
  const t = body.trim();
  return t.length >= 1 && t.length <= MESSAGE_MAX;
}

/** "2:15 pm · 4 Sep" — enough to place a message without a full timestamp. */
export function messageTime(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const day = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${time} · ${day}`;
}
