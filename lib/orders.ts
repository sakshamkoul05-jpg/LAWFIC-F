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
