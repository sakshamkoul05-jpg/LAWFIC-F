/**
 * The promotional banners on the homepage.
 *
 * Each banner names a `tone` rather than carrying a raw colour. The previous
 * version stored an arbitrary hex per banner — red, blue, green, amber,
 * violet, cyan — which put six unrelated hues on the page and left the gold
 * brand competing with all of them.
 *
 * The tones below are one family: warm, desaturated, dark-panelled, each with
 * a single lifted accent. They read as a set, and the gold still reads as the
 * brand because nothing else is shouting.
 *
 * Banners are deliberately dark in both themes. A dark band on warm paper is a
 * deliberate change of material — the way a product page drops into black for
 * a hero — and it keeps the banners looking identical to every visitor.
 */

export type BannerTone =
  | "ember"
  | "ink"
  | "jade"
  | "azure"
  | "clay"
  | "plum"
  | "moss"
  | "slate"
  | "rust"
  | "teal"
  | "wine";

export type Banner = {
  id: number;
  /**
   * A photograph in /public/banners — OPTIONAL.
   *
   * Absent, the banner renders as a plain colour block built from its tone.
   * That is the current state by request: eleven blocks now, photographs
   * dropped in later one `photo` at a time, with no other change needed. A
   * block is not a placeholder standing in for a missing image either — it is
   * a finished panel, because a banner that looks unfinished on a live site is
   * worse than one that was never going to have a picture.
   *
   * Downloaded from Unsplash rather than hotlinked. The Unsplash Licence
   * permits commercial use of a downloaded image with no attribution; using
   * their *API* to serve images does require crediting the photographer, so
   * the files are committed here and the API is not touched. Serving them
   * ourselves also means a banner cannot break because a third party moved
   * a URL.
   *
   * NO IDENTIFIABLE PEOPLE. This is a rule, not a preference. Unsplash's
   * licence covers copyright but Unsplash does not verify that model releases
   * exist, and its own guidance is never to imply endorsement by someone
   * depicted in a photo. These banners are advertising, so a recognisable
   * face in one is a publicity-rights problem regardless of the licence.
   * Photographs here show premises, desks and paperwork instead — which also
   * happens to say what the service is, where a candid portrait of a stranger
   * did not. Keep it that way.
   *
   * The same caution applies to other people's artwork and branding. A shop
   * photo densely papered with printed posters was replaced for exactly that
   * reason: incidental background in a documentary shot is one thing, the
   * same posters filling an advertising banner is another.
   */
  photo?: string;
  /** Describes the picture for anyone who cannot see it. Only with a photo. */
  photoAlt?: string;
  /** Small uppercase line above the headline. */
  eyebrow: string;
  title: string;
  label: string;
  cta: string;
  href: string;
  tone: BannerTone;
};

/* Eleven now, and still one family. Every `from` sits in the same narrow band
   of lightness and saturation and every `to` is close to black, so the set
   varies by HUE alone — which is what lets eleven panels look like a series
   rather than a paint chart. The accent is the one lifted colour in each and
   is the only thing on the banner bright enough to be a button. */
export const TONES: Record<BannerTone, { from: string; to: string; accent: string }> = {
  ember: { from: "#3B2A14", to: "#1D1710", accent: "#E5C173" },
  ink: { from: "#2C2925", to: "#16140F", accent: "#D0AE55" },
  jade: { from: "#22443B", to: "#13231F", accent: "#86D3AB" },
  azure: { from: "#23313F", to: "#131C25", accent: "#96C2DD" },
  clay: { from: "#402A1F", to: "#1F1512", accent: "#E3A079" },
  plum: { from: "#342440", to: "#1A1220", accent: "#C4A2DD" },
  moss: { from: "#2C3A22", to: "#161D11", accent: "#B4CE85" },
  slate: { from: "#28323A", to: "#12181D", accent: "#A9BCC8" },
  rust: { from: "#452420", to: "#221111", accent: "#E09080" },
  teal: { from: "#1E3C40", to: "#101F21", accent: "#84CBCE" },
  wine: { from: "#3E2029", to: "#1F1015", accent: "#DE9AAC" },
};

export const promotionalBanners: Banner[] = [
  {
    id: 1,
    eyebrow: "Start a business",
    title: "Udyam registration, done properly",
    label:
      "The government charges nothing for it. We charge ₹999 and make sure it is filed right the first time.",
    cta: "Register your MSME",
    href: "/services/msme-udyam",
    tone: "ember",
  },
  {
    id: 2,
    eyebrow: "Tax & filings",
    title: "A GSTIN in your name in 7–10 days",
    label:
      "We prepare the application, answer the department's queries, and explain what all fifteen digits mean.",
    cta: "Start GST registration",
    href: "/services/gst",
    tone: "ink",
  },
  {
    id: 3,
    eyebrow: "Membership",
    title: "Ten percent off every filing",
    label:
      "One membership covers every service on the site, for the whole year. No per-filing subscription.",
    cta: "See what it costs",
    href: "/pricing",
    tone: "jade",
  },
  {
    id: 4,
    eyebrow: "Jobs",
    title: "Openings matched to your city and trade",
    label:
      "Tell us your qualification and where you are, and the feed narrows to work you can actually take. Free, always.",
    cta: "Browse jobs",
    href: "/jobs",
    tone: "azure",
  },
  {
    id: 5,
    eyebrow: "Identity",
    title: "PAN, TAN and DSC without the guesswork",
    label:
      "Government fee and our fee, itemised separately, before you commit to anything.",
    cta: "See identity services",
    href: "/services",
    tone: "clay",
  },
  {
    id: 6,
    eyebrow: "Trademark & brand",
    title: "Your name, protected in the right classes",
    label:
      "A search first, so you find out a mark is taken before you have printed it on anything.",
    cta: "Protect your brand",
    href: "/branding",
    tone: "plum",
  },

  /* SEVEN TO ELEVEN
     Eleven slots by request. Every one of the five added below is a service
     LAWFIC already sells and already has a page for — none is invented to
     fill a slot, because a banner promising something the site cannot do is
     a lie the customer finds out about on the next click. */
  {
    id: 7,
    eyebrow: "Food business",
    title: "The FSSAI licence your kitchen needs",
    label:
      "Basic, State or Central — we work out which tier your turnover puts you in before filing.",
    cta: "Get an FSSAI licence",
    href: "/document/fssai",
    tone: "moss",
  },
  {
    id: 8,
    eyebrow: "Incorporation",
    title: "A private limited company, filed properly",
    label:
      "Incorporation, DIN, MOA and AOA. The wrong structure costs more to unwind than to set up.",
    cta: "Register a company",
    href: "/business",
    tone: "slate",
  },
  {
    id: 9,
    eyebrow: "Income tax",
    title: "Your return, filed by someone who reads it",
    label:
      "Salaried, business or presumptive — the right form, the right schedules, filed on time.",
    cta: "File your return",
    href: "/document/itr",
    tone: "rust",
  },
  {
    id: 10,
    eyebrow: "Agreements",
    title: "A rent agreement that would hold up",
    label:
      "Drafted, stamped and registered — the version most landlords and banks actually ask for.",
    cta: "Draft an agreement",
    href: "/document/rent-agreement",
    tone: "teal",
  },
  {
    id: 11,
    eyebrow: "Travel",
    title: "Passport, without the second appointment",
    label:
      "Form, documents and the police verification — checked before you go, not after.",
    cta: "Start a passport application",
    href: "/document/passport-application",
    tone: "wine",
  },
];
