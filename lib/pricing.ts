/**
 * Plans.
 *
 * ⚠ The figures below are INDICATIVE and need LAWFIC's sign-off before launch.
 * They are shaped on what comparable Indian compliance platforms charge, not
 * on LAWFIC's costs, which only LAWFIC knows. Change them here and every
 * surface follows — the pricing page, the home teaser and the plan comparison
 * all read from this file.
 *
 * The structure, though, is deliberate and should survive a price change:
 *
 *   1. PAY PER FILING IS FIRST AND IS FREE TO JOIN. The most common complaint
 *      about this category is being charged for things the customer did not
 *      expect. Leading with "you owe nothing until we quote" answers that
 *      before it is asked.
 *   2. THE GOVERNMENT FEE IS NEVER INSIDE A PLAN PRICE. Plans buy LAWFIC's
 *      work. Statutory fees are passed through at cost, always on their own
 *      line. A plan that bundled them would make the pass-through unverifiable.
 *   3. THREE TIERS, NOT FIVE. Past four, a pricing page stops helping people
 *      choose and starts making them leave.
 */

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  /** null means "no recurring fee" rather than "free of charge". */
  monthlyPaise: number | null;
  priceNote: string;
  featured?: boolean;
  bestFor: string;
  includes: string[];
  excludes?: string[];
  cta: { label: string; href: string };
};

export const PRICING_IS_PROVISIONAL = true;

export const plans: Plan[] = [
  {
    id: "per-filing",
    name: "Pay per filing",
    tagline: "No subscription. Pay only when you file something.",
    monthlyPaise: null,
    priceNote: "Free to join",
    bestFor: "Anyone with a one-off registration or licence to get done.",
    includes: [
      "Every service in the catalogue, at its listed fee",
      "A quote before anything is charged — decline and pay nothing",
      "Government fee and our fee always on separate lines",
      "Wallet, order tracking and receipts",
      "Support by email and WhatsApp",
    ],
    cta: { label: "Browse services", href: "/services" },
  },
  {
    id: "compliance",
    name: "Compliance",
    tagline: "For a registered business with recurring filings.",
    monthlyPaise: 199900,
    priceNote: "per month, billed monthly",
    featured: true,
    bestFor: "Businesses already registered for GST that would rather not think about due dates.",
    includes: [
      "Everything in Pay per filing",
      "GST returns — GSTR-1 and 3B, filed monthly",
      "Annual income tax return for the business",
      "A due-date calendar, with reminders before the deadline",
      "10% off any one-off service in the catalogue",
      "Named point of contact",
    ],
    excludes: ["Government fees, which are always passed through at cost"],
    cta: { label: "Talk to us", href: "/contact" },
  },
  {
    id: "business",
    name: "Business",
    tagline: "For companies with payroll, statutory audits and a board.",
    monthlyPaise: 499900,
    priceNote: "per month, billed monthly",
    bestFor: "Private limited companies and LLPs carrying full ROC and payroll compliance.",
    includes: [
      "Everything in Compliance",
      "ROC annual filings — AOC-4, MGT-7 and director KYC",
      "TDS returns and Form 16 issuance",
      "PF and ESI monthly filings",
      "Payroll processing up to 25 employees",
      "Priority turnaround and a dedicated compliance manager",
    ],
    excludes: ["Government fees, which are always passed through at cost"],
    cta: { label: "Talk to us", href: "/contact" },
  },
];

/** The differentiator, stated as commitments rather than adjectives. */
export const pricingCommitments = [
  {
    title: "The government fee is never inside our fee",
    body: "Udyam registration is free at source. So is GST registration. We show you what the government charges and what we charge as two separate lines, on the quote and on the invoice.",
  },
  {
    title: "Nothing is charged until you have seen the number",
    body: "You send a request, we look at your file, and we quote. Declining costs you nothing, because nothing has been taken.",
  },
  {
    title: "No charge for a filing we cannot complete",
    body: "If a filing cannot proceed, every rupee goes back to your wallet the same day — as a credit you can see on your statement, not a promise to process a refund.",
  },
  {
    title: "The wallet is not a lock-in",
    body: "Your balance pays for LAWFIC services and nothing else. We do not expire it, and we do not charge to hold it.",
  },
];

export const pricingFaq = [
  {
    q: "Is there a joining fee or a minimum commitment?",
    a: "No. Pay per filing costs nothing to join and has no minimum. The monthly plans are billed month to month and you can stop at the end of any month.",
  },
  {
    q: "What exactly is a 'government fee'?",
    a: "The amount the department itself charges — ₹107 for a new PAN, ₹1,000 for late Aadhaar–PAN linking, and so on. Several of the most common services, including Udyam and GST registration, have no government fee at all. We pass these through at cost and show them separately every time.",
  },
  {
    q: "Why do you quote instead of showing one fixed price?",
    a: "Because government fees move with state, turnover and category. A single fixed price behind a checkout button means either overcharging some customers or absorbing losses on others. We would rather look at your file and tell you the real number.",
  },
  {
    q: "What happens if my application is rejected?",
    a: "If it is something we can fix — a document query, a clarification from the officer — we handle it at no extra charge, because that is the work you paid for. If it cannot proceed at all, we close the order and credit everything back to your wallet.",
  },
  {
    q: "Can I switch plans or cancel?",
    a: "Yes, at the end of any billing month. Filings already in progress are completed either way.",
  },
  {
    q: "Do plan prices include GST?",
    a: "GST is charged on our professional fee at the applicable rate and is shown separately on the invoice, like every other statutory amount.",
  },
];
