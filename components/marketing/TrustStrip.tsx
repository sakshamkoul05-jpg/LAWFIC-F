import { company } from "@/lib/company";

/**
 * Objection-killers, placed next to the conversion point rather than in the
 * footer — a trust signal below the fold is one most visitors never see.
 *
 * Every line here is a verifiable statement about how the system actually
 * works, enforced in the schema or the payment flow. Nothing is a badge we
 * awarded ourselves, and there is no third-party logo we have not earned.
 */

const signals = [
  {
    title: "Nothing charged until you are quoted",
    body: "Send a request, see the number, then decide.",
    icon: (
      <>
        <circle cx="10" cy="10" r="7.2" />
        <path d="M10 6.4v3.8l2.4 1.6" />
      </>
    ),
  },
  {
    title: "Payments handled by Razorpay",
    body: "An RBI-authorised payment aggregator. We never see your card.",
    icon: (
      <>
        <rect x="2.4" y="4.6" width="15.2" height="10.8" rx="2" />
        <path d="M2.4 8.4h15.2" />
        <path d="M5.6 12.4h3" />
      </>
    ),
  },
  {
    title: "Refunds land back the same day",
    body: "Credited to your wallet as a visible entry, not a promise to process.",
    icon: (
      <>
        <path d="M3.4 10a6.6 6.6 0 1 0 1.9-4.6" />
        <path d="M3 3.2v3.6h3.6" />
      </>
    ),
  },
  {
    title: "We never store Aadhaar photocopies",
    body: "Masked identifiers only, in a private store with short retention.",
    icon: (
      <>
        <path d="M10 2.8 16 5v4.6c0 3.3-2.3 5.9-6 7.1-3.7-1.2-6-3.8-6-7.1V5l6-2.2Z" />
        <path d="m7.6 10 1.8 1.8 3.2-3.4" />
      </>
    ),
  },
];

/**
 * `inline` is the version that belongs inside the hero, above the fold.
 * The full card is for pages where the reader has already committed to
 * scrolling — a pricing page, say.
 */
export function TrustRow() {
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
      {signals.slice(0, 3).map((s) => (
        <li key={s.title} className="flex items-center gap-2 text-[13px] text-muted">
          <svg
            width="15"
            height="15"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-primary"
            aria-hidden
          >
            {s.icon}
          </svg>
          {s.title}
        </li>
      ))}
    </ul>
  );
}

export default function TrustStrip() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <ul className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {signals.map((s) => (
          <li key={s.title} className="flex gap-3.5 bg-surface px-5 py-5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0 text-primary"
              aria-hidden
            >
              {s.icon}
            </svg>
            <div className="min-w-0">
              <p className="text-[13.5px] leading-snug text-foreground">{s.title}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ul>

      {(company.supportPhone || company.whatsapp || company.supportEmail) && (
        <p className="border-t border-border bg-surface-2 px-5 py-3 text-[12.5px] text-muted">
          Stuck on any of it? {company.supportHours}.{" "}
          {company.supportPhone && <span className="text-foreground">{company.supportPhone}</span>}
        </p>
      )}
    </div>
  );
}
