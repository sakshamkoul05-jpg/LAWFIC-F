/**
 * Every offer the home page advertises, in one file.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  READ THIS BEFORE THE PAGE GOES TO PRODUCTION
 *
 *  These are the client's designs from "Saksham Sir Home Page Work.xlsx" —
 *  the coupon posters, the first-purchase strip and the wallet recharge
 *  bonuses — copied exactly. NONE OF THEM IS HONOURED BY THE BACKEND YET:
 *  there is no coupon field at checkout, and a wallet top-up credits exactly
 *  what was paid, never a bonus.
 *
 *  Advertising an offer that checkout does not give is a misleading claim to
 *  a customer. So either the codes and bonuses get built into checkout, or
 *  `OFFERS_LIVE` is set to false — which removes every poster, strip and bonus
 *  card below from the home page in one change and leaves the rest of it
 *  standing.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const OFFERS_LIVE = true;

export type Poster = {
  id: string;
  /** Small chip above the headline. */
  kicker: string;
  headline: string;
  /** The line under it — usually the code. */
  line: string;
  code?: string;
  fine: string;
  tone: "navy" | "black" | "blue" | "gold" | "deep";
  href: string;
  /** The ₹100 poster carries the app QR and a button instead of a code. */
  app?: boolean;
  /** The ₹500 / 30% poster has a round seal on the right. */
  seal?: { top: string; big: string; bottom: string };
};

/**
 * The eleven scrolling posters. The first five are the client's coupon designs,
 * word for word. The other six advertise services the website already sells,
 * from the copy in lib/promotional.ts — no discount is invented for them.
 */
export const POSTERS: Poster[] = [
  {
    id: "app-100",
    kicker: "Hello Lawfic Member,",
    headline: "₹100 CASH BACK",
    line: "Lawfic services are now available on our app too.",
    fine: "Download now & get ₹100 cash back in your wallet.",
    tone: "navy",
    href: "/wallet",
    app: true,
  },
  {
    id: "welcome-500",
    kicker: "FOR NEW USERS",
    headline: "FLAT ₹500 GUARANTEED CASHBACK",
    line: "Use Code",
    code: "LAWWEL500",
    fine: "For New Users • First Purchase Only",
    tone: "black",
    href: "/services",
  },
  {
    id: "wallet-20",
    kicker: "WALLET RECHARGE OFFER",
    headline: "FLAT 20% OFF",
    line: "ADD MONEY IN LAWFIC WALLET",
    code: "LAWWAL20",
    fine: "Valid for All Users • Instant Wallet Credit",
    tone: "blue",
    href: "/wallet/topup",
  },
  {
    id: "referral-5000",
    kicker: "FOR NEW USERS",
    headline: "FLAT ₹5000 REFERRAL CASHBACK",
    line: "Use Code",
    code: "LAWREF50NEW",
    fine: "For New Users • First Purchase Only",
    tone: "gold",
    href: "/partner",
  },
  {
    id: "doc-30",
    kicker: "DOCUMENT REGISTRATION OFFER",
    headline: "Flat 30% Off",
    line: "Upto ₹500 discount on the registration of any document.",
    code: "LAREG30",
    fine: "Valid for All Users • Instant Discount",
    tone: "deep",
    href: "/document",
    seal: { top: "UPTO", big: "₹500", bottom: "INSTANT DISCOUNT" },
  },
  { id: "udyam", kicker: "START A BUSINESS", headline: "UDYAM REGISTRATION, DONE PROPERLY", line: "Collateral-free loans and tender access", fine: "Same day • ₹499 professional fee", tone: "black", href: "/services/msme-udyam" },
  { id: "gst", kicker: "TAX AND FILINGS", headline: "A GSTIN IN YOUR NAME IN 7–10 DAYS", line: "Start GST registration", fine: "Government fee nil • ₹1,499 professional fee", tone: "navy", href: "/services/gst" },
  { id: "pan", kicker: "IDENTITY", headline: "PAN WITHOUT THE GUESSWORK", line: "New cards, corrections and Aadhaar linking", fine: "e-PAN in 48 hours", tone: "blue", href: "/services/pan" },
  { id: "aadhaar", kicker: "IDENTITY", headline: "AADHAAR, RIGHT FIRST TIME", line: "Corrections, updates and appointments", fine: "Appointment in 2–4 days", tone: "gold", href: "/services/aadhaar" },
  { id: "trademark", kicker: "YOUR BRAND", headline: "YOUR NAME, PROTECTED", line: "Trademark search and filing in the right classes", fine: "Quoted before you commit", tone: "deep", href: "/document/trademark" },
  { id: "rent", kicker: "LEGAL DOCUMENTS", headline: "A RENT AGREEMENT THAT WOULD HOLD UP", line: "Drafted, stamped and registered", fine: "Quoted before you commit", tone: "black", href: "/document/rent-agreement" },
];

/** The orange first-purchase strip under the posters. */
export const FIRST_PURCHASE = {
  headline: "FLAT ₹300 OFF",
  line: "On Your 1st Purchase",
  via: "Via LAWFIC App!",
  href: "/services",
};

/** The fixed wallet card in the welcome section. */
export const WALLET_RECHARGE = [
  { pay: 1000, get: 1100 },
  { pay: 2000, get: 2500 },
  { pay: 5000, get: 6500 },
  { pay: 10000, get: 12500, best: true },
];
