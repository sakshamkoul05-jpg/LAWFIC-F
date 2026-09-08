/**
 * The home page as the client set it out.
 *
 * Transcribed from "Lawfic Main Page Blue Print.xlsx" — sheet 1 rows 116–133
 * for the categories, sheet 2 column D for the order the sections run in. The
 * headings and the item names are theirs, spelling included; nothing here is
 * reworded and nothing is invented.
 *
 * FOUR CATEGORIES ARE DELIBERATELY EMPTY
 *
 * The sheet names nine categories but fills the twelve item rows for only five
 * of them: Investment, Social, Partner and Entertainment are numbered 1 to 12
 * with nothing written against the numbers. Those four render as a heading and
 * an honest "still being written" rather than with services invented to fill
 * the space. Made-up service names on a real consultancy's page are a promise
 * to sell something, and the client is the only one who can say what those
 * twelve lines are.
 *
 * WHERE THE LINKS GO
 *
 * An item points at a real page when one exists, and at its section otherwise.
 * Nothing links into a 404: a category list whose rows go nowhere is worse than
 * a shorter list.
 */

export type BlueprintItem = {
  /** The client's wording. */
  label: string;
  href: string;
  /** A page that is actually written, as opposed to a section landing page. */
  live?: boolean;
};

export type BlueprintCategory = {
  /** "CATEGORY 1" … "CATEGORY 9" in the sheet. */
  n: number;
  /** Their heading, verbatim. */
  title: string;
  /** Where the whole category goes. */
  href: string;
  items: BlueprintItem[];
};

export const SERVICE_CATEGORIES: BlueprintCategory[] = [
  {
    n: 1,
    title: "Identification Document Service",
    href: "/document",
    items: [
      { label: "Aadhaar Card", href: "/services/aadhaar", live: true },
      { label: "Pan Card", href: "/services/pan", live: true },
      { label: "Voter ID Card", href: "/document/voter-id" },
      { label: "Indian Passport", href: "/document/passport-application" },
      { label: "Driving Licence", href: "/document/driving-licence" },
      { label: "Labour Card", href: "/document/labour-card" },
      { label: "Birth Certificate", href: "/document/birth-certificate" },
      { label: "Death Certificate", href: "/document/death-certificate" },
      { label: "Income Certificate", href: "/document/income-certificate" },
      { label: "EWS Certificate", href: "/document/ews-certificate" },
      { label: "Caste Certificate", href: "/document/caste-certificate" },
      { label: "Request Document (Not In List)", href: "/contact" },
    ],
  },
  {
    n: 2,
    title: "Business Document Service",
    href: "/business",
    items: [
      { label: "GST Registration", href: "/services/gst", live: true },
      { label: "Income Tax Return (ITR)", href: "/document/itr" },
      { label: "Udyam Registration (MSME)", href: "/services/msme-udyam", live: true },
    ],
  },
  {
    n: 3,
    title: "Your Start Up Service",
    href: "/startup",
    items: [
      { label: "Free Talk To Start Up Expert", href: "/contact" },
      { label: "Government Fund For Start Up", href: "/startup#funding" },
      { label: "Document Required For Start Up", href: "/startup#documents" },
      { label: "Online Start Up Business Guide", href: "/startup#guide" },
    ],
  },
  {
    n: 4,
    title: "Your Job Service Blog",
    href: "/jobs",
    items: [
      { label: "Top Tranding Government Job", href: "/jobs#government" },
      { label: "Top Tranding Private Job", href: "/jobs#private" },
      { label: "Top Local Job In Your Area", href: "/jobs#local" },
      { label: "Make Beautiful CV / Resume For Your Job", href: "/jobs#resume" },
      { label: "Learn Online / Offline Skill 4 Your Job", href: "/education" },
      { label: "Do Internship In Your Field", href: "/jobs#internship" },
      { label: "Best Work From Home Job", href: "/jobs#wfh" },
      { label: "Free Lancer / Part Time Job", href: "/jobs#freelance" },
      { label: "Abroad / Out Of India Job", href: "/jobs#abroad" },
      { label: "Learn AI By Expert 4 Your job", href: "/education#ai" },
      { label: "Motivational Class / Video 4 Your Job", href: "/jobs#motivation" },
      { label: "Request Your Own Choice Job (Not In List)", href: "/contact" },
    ],
  },
  {
    n: 5,
    title: "Feel Like You Are A Brand",
    href: "/branding",
    items: [
      { label: "Make Your Personal Attractive Website", href: "/branding#personal-site" },
      { label: "Business Static Website", href: "/branding#static-site" },
      { label: "Business Dynamic Website", href: "/branding#dynamic-site" },
      { label: "Mobile Application (Android / iOS)", href: "/branding#apps" },
      { label: "Brand Advertisment Online / Local", href: "/branding#advertising" },
    ],
  },
  { n: 6, title: "Best Investment Service", href: "/investment", items: [] },
  {
    n: 7,
    title: "Real Social Work For Smile & Love India",
    href: "/social",
    items: [],
  },
  { n: 8, title: "Partner With LAWFIC", href: "/partner", items: [] },
  { n: 9, title: "Entertainment Service", href: "/entertainment", items: [] },
];

/**
 * "Top trending me top 10 do isko link se click krke page par redirect karo" —
 * ten trending services, each one clicking through to its page.
 *
 * Ordered from what LAWFIC actually sells rather than from invented demand:
 * the four with written pages lead, because those are the ones a customer can
 * finish today.
 */
export type Trend = {
  rank: number;
  label: string;
  section: string;
  href: string;
  live?: boolean;
};

export const TRENDING: Trend[] = [
  { rank: 1, label: "GST Registration", section: "Tax & filings", href: "/services/gst", live: true },
  { rank: 2, label: "Aadhaar Card Services", section: "Identity", href: "/services/aadhaar", live: true },
  { rank: 3, label: "PAN Card Application", section: "Identity", href: "/services/pan", live: true },
  { rank: 4, label: "Udyam / MSME Registration", section: "Business", href: "/services/msme-udyam", live: true },
  { rank: 5, label: "Income Tax Return", section: "Tax & filings", href: "/document/itr" },
  { rank: 6, label: "Trademark Registration", section: "Branding", href: "/document/trademark" },
  { rank: 7, label: "Indian Passport", section: "Travel", href: "/document/passport-application" },
  { rank: 8, label: "Rent Agreement", section: "Legal", href: "/document/rent-agreement" },
  { rank: 9, label: "FSSAI Registration", section: "Business", href: "/document/fssai" },
  { rank: 10, label: "Birth Certificate", section: "Certificates", href: "/document/birth-certificate" },
];

/**
 * "Yaha pr short me Why chosse LAWFIC Service write karo… Read more pr About
 * LAWFIC Page pr redirect kar dena" — a short case here, Read more to /about.
 *
 * Four reasons, each one a fact about how the work is done rather than an
 * adjective. "Trusted" and "professional" are what every listing site claims;
 * an itemised fee and a named person are checkable.
 */
export const WHY_LAWFIC: { title: string; body: string }[] = [
  {
    title: "The fee is itemised before you commit",
    body: "Government fee and our fee, listed separately, on the page — not after a call.",
  },
  {
    title: "A person owns your file",
    body: "One name, reachable, who knows what stage your application is at.",
  },
  {
    title: "We say no when it will not work",
    body: "If the papers do not support the application we tell you first, rather than filing it and billing you.",
  },
  {
    title: "Everything in one place",
    body: "Documents, filings, receipts and the balance that paid for them, in one account.",
  },
];
