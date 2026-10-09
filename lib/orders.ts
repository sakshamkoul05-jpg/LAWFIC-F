export const ORDER_STATUSES = [
  "submitted",
  "quoted",
  "paid",
  "in_progress",
  "completed",
  "rejected",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ServiceOrder = {
  id: string;
  reference: string;
  user_id: string;
  service_slug: string;
  status: OrderStatus;
  government_fee_paise: number | null;
  professional_fee_paise: number | null;
  details: string | null;
  admin_notes: string | null;
  quoted_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type Meta = {
  label: string;
  /** What the customer should understand is happening. */
  blurb: string;
  tone: "neutral" | "action" | "good" | "bad";
};

export const STATUS_META: Record<OrderStatus, Meta> = {
  submitted: {
    label: "Submitted",
    blurb: "We have your request and are checking what it will cost. Nothing is owed yet.",
    tone: "neutral",
  },
  quoted: {
    label: "Awaiting payment",
    blurb: "Priced and ready. Pay from your wallet and we start work.",
    tone: "action",
  },
  paid: {
    label: "Paid",
    blurb: "Payment received. Your file is queued to be prepared.",
    tone: "neutral",
  },
  in_progress: {
    label: "In progress",
    blurb: "Filed and with the registry. We are tracking it.",
    tone: "neutral",
  },
  completed: {
    label: "Completed",
    blurb: "Done. Your certificate has been issued.",
    tone: "good",
  },
  rejected: {
    label: "Closed",
    blurb: "This could not proceed. Anything you paid has been credited back to your wallet.",
    tone: "bad",
  },
};

/** The steps a customer sees, in order. `rejected` is not on this path. */
export const TIMELINE: OrderStatus[] = ["submitted", "quoted", "paid", "in_progress", "completed"];

export function timelineIndex(status: OrderStatus): number {
  const i = TIMELINE.indexOf(status);
  return i === -1 ? 0 : i;
}

export function orderTotalPaise(order: {
  government_fee_paise: number | null;
  professional_fee_paise: number | null;
}): number {
  return (order.government_fee_paise ?? 0) + (order.professional_fee_paise ?? 0);
}

/**
 * When a paid filing should be done, read from the service's own turnaround
 * line — "7–10 working days", "Same day", "e-PAN in 48 hours".
 *
 * It takes the UPPER end of a range and counts working days as weekdays, so
 * the date is one LAWFIC can keep rather than one that flatters. Government
 * holidays are not modelled; the page says "about". Returns null when the
 * turnaround is not a duration (an appointment, a quote), because a made-up
 * date is worse than none.
 */
export function expectedBy(turnaround: string, fromIso: string): Date | null {
  const t = turnaround.toLowerCase();
  const start = new Date(fromIso);
  if (Number.isNaN(start.getTime())) return null;

  /* "Appointment in 2–4 days" is when the customer visits, not when the
     work is finished — a date here would promise the wrong thing. */
  if (/appointment/.test(t)) return null;
  if (/same day/.test(t)) return start;

  const hours = /(\d+)\s*(?:–|-|to)?\s*(\d+)?\s*hours?/.exec(t);
  if (hours) {
    const h = Number(hours[2] ?? hours[1]);
    return new Date(start.getTime() + h * 3_600_000);
  }

  const days = /(\d+)\s*(?:–|-|to)?\s*(\d+)?\s*(working\s+)?days?/.exec(t);
  if (!days) return null;
  const n = Number(days[2] ?? days[1]);
  const working = Boolean(days[3]);

  const d = new Date(start);
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (!working || (dow !== 0 && dow !== 6)) added++;
  }
  return d;
}
