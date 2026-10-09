/**
 * Admission paperwork: which certificates a student needs, how long each takes,
 * and the date to start each one so it is in hand before counselling.
 *
 * ⚠ EXAM AND COUNSELLING MONTHS ARE TYPICAL, NOT ANNOUNCED DATES. Every
 * conducting body publishes its own schedule each year; the page says so and
 * the planner works back from the typical month. Change `needBy` here when a
 * year's schedule is out.
 *
 * The validity rules are the ones that actually cost students seats: EWS and
 * OBC-NCL certificates for central counselling must usually be issued on or
 * after 1 April of the admission year, so one made early is useless.
 */

export type StreamId = "engineering" | "medical" | "management" | "law";
export type CategoryId = "general" | "ews" | "obc" | "scst";

export type Stream = {
  id: StreamId;
  name: string;
  exams: { name: string; when: string }[];
  counselling: string;
  /** Month (1–12) documents are needed by, and whether that falls in the year before the session starts. */
  needBy: { month: number; day: number; yearBefore?: boolean };
  /** Central counselling that applies the 1 April issue rule. */
  aprilRule: boolean;
  blurb: string;
};

export const STREAMS: Stream[] = [
  {
    id: "engineering",
    name: "Engineering",
    exams: [
      { name: "JEE Main", when: "January and April sessions" },
      { name: "JEE Advanced", when: "May" },
      { name: "State entrance tests", when: "April to June" },
    ],
    counselling: "JoSAA counselling, usually June to July",
    needBy: { month: 6, day: 1 },
    aprilRule: true,
    blurb: "IITs, NITs, IIITs and state colleges.",
  },
  {
    id: "medical",
    name: "Medical",
    exams: [
      { name: "NEET-UG", when: "May" },
    ],
    counselling: "MCC and state counselling, usually from July",
    needBy: { month: 7, day: 1 },
    aprilRule: true,
    blurb: "MBBS, BDS and AYUSH seats.",
  },
  {
    id: "management",
    name: "Management (MBA)",
    exams: [
      { name: "CAT", when: "November" },
      { name: "XAT, CMAT and others", when: "December to February" },
    ],
    counselling: "Calls and interviews, usually January to April",
    needBy: { month: 2, day: 1 },
    aprilRule: false,
    blurb: "IIMs and other business schools.",
  },
  {
    id: "law",
    name: "Law",
    exams: [
      { name: "CLAT", when: "December" },
      { name: "AILET and state tests", when: "December to May" },
    ],
    counselling: "Consortium counselling, usually December to January",
    needBy: { month: 12, day: 15, yearBefore: true },
    aprilRule: false,
    blurb: "National Law Universities and others.",
  },
];

export type Doc = {
  id: string;
  name: string;
  why: string;
  /** Typical working time once the papers are ready, in days. */
  leadDays: number;
  /** Document page that prepares it. */
  href?: string;
  /** Issued on or after 1 April of the admission year, for central counselling. */
  aprilWindow?: boolean;
  lasts?: string;
};

const DOCS: Record<string, Doc> = {
  ews: {
    id: "ews",
    name: "EWS certificate",
    why: "Proves family income below the limit for the 10% EWS seats, on the previous financial year's income.",
    leadDays: 21,
    href: "/document/ews-certificate",
    aprilWindow: true,
  },
  obc: {
    id: "obc",
    name: "OBC non-creamy layer certificate",
    why: "Central institutions want it in the central format, and recent — an old one is the most common reason an OBC seat is lost.",
    leadDays: 21,
    href: "/document/obc-ncl",
    aprilWindow: true,
  },
  scst: {
    id: "scst",
    name: "Caste certificate (SC / ST)",
    why: "Issued once by the state, and it does not expire — but the name on it must match your marksheets exactly.",
    leadDays: 30,
    href: "/document/caste-certificate",
    lasts: "Does not expire",
  },
  domicile: {
    id: "domicile",
    name: "Domicile certificate",
    why: "Needed for state-quota seats. Each state sets its own residence rule.",
    leadDays: 21,
    href: "/document/domicile-certificate",
    lasts: "Usually does not expire",
  },
  income: {
    id: "income",
    name: "Income certificate",
    why: "For fee waivers and scholarships, which open alongside admission.",
    leadDays: 15,
    href: "/document/income-certificate",
  },
  gap: {
    id: "gap",
    name: "Gap-year affidavit",
    why: "A sworn statement explaining a year between school and college. Some colleges ask at reporting.",
    leadDays: 2,
    href: "/document/affidavit",
  },
  birth: {
    id: "birth",
    name: "Birth certificate copy",
    why: "When your Class 10 certificate and other records disagree on date of birth, this settles it.",
    leadDays: 10,
    href: "/document/birth-certificate",
  },
};

export function docsFor(category: CategoryId, opts: { stateQuota: boolean; gapYear: boolean; scholarship: boolean; dobMismatch: boolean }): Doc[] {
  const out: Doc[] = [];
  if (category === "ews") out.push(DOCS.ews);
  if (category === "obc") out.push(DOCS.obc);
  if (category === "scst") out.push(DOCS.scst);
  if (opts.stateQuota) out.push(DOCS.domicile);
  if (opts.scholarship) out.push(DOCS.income);
  if (opts.dobMismatch) out.push(DOCS.birth);
  if (opts.gapYear) out.push(DOCS.gap);
  return out;
}

/** Safety margin before the need-by date, for a re-issue if something is wrong. */
export const BUFFER_DAYS = 10;

export function needByDate(stream: Stream, sessionYear: number): Date {
  const y = stream.needBy.yearBefore ? sessionYear - 1 : sessionYear;
  return new Date(Date.UTC(y, stream.needBy.month - 1, stream.needBy.day));
}

/** The first session year whose need-by date is still ahead of `today`. */
export function nextSessionYear(stream: Stream, today: Date): number {
  let y = today.getUTCFullYear();
  while (needByDate(stream, y) <= today) y++;
  return y;
}

export type Planned = Doc & {
  startBy: Date;
  /** Earliest day a valid certificate can be issued, if restricted. */
  opensOn?: Date;
  /** True when the window opens so late that lead time plus buffer does not fit. */
  tight: boolean;
};

export function plan(stream: Stream, sessionYear: number, docs: Doc[]): { needBy: Date; items: Planned[] } {
  const needBy = needByDate(stream, sessionYear);
  const items = docs.map((d) => {
    const startBy = new Date(needBy.getTime() - (d.leadDays + BUFFER_DAYS) * 86_400_000);
    if (d.aprilWindow && stream.aprilRule) {
      const opensOn = new Date(Date.UTC(sessionYear, 3, 1));
      return { ...d, startBy: startBy < opensOn ? opensOn : startBy, opensOn, tight: startBy < opensOn };
    }
    return { ...d, startBy, tight: false };
  });
  items.sort((a, b) => a.startBy.getTime() - b.startBy.getTime());
  return { needBy, items };
}
