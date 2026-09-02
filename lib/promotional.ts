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

export type BannerTone = "ember" | "ink" | "jade" | "azure" | "clay";

export type Banner = {
  id: number;
  /**
   * A photograph in /public/banners.
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
  photo: string;
  /** Describes the picture for anyone who cannot see it. */
  photoAlt: string;
  /** Small uppercase line above the headline. */
  eyebrow: string;
  title: string;
  label: string;
  cta: string;
  href: string;
  tone: BannerTone;
};

export const TONES: Record<BannerTone, { from: string; to: string; accent: string }> = {
  ember: { from: "#3B2A14", to: "#1D1710", accent: "#E5C173" },
  ink: { from: "#2C2925", to: "#16140F", accent: "#D0AE55" },
  jade: { from: "#22443B", to: "#13231F", accent: "#86D3AB" },
  azure: { from: "#23313F", to: "#131C25", accent: "#96C2DD" },
  clay: { from: "#402A1F", to: "#1F1512", accent: "#E3A079" },
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
    photo: "/banners/msme.jpg",
    photoAlt: "The glass display counter of a small shop",
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
    photo: "/banners/gst.jpg",
    photoAlt: "A desk with a calculator, reading glasses and printed statements",
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
    photo: "/banners/membership.jpg",
    photoAlt: "An empty meeting table in a quiet office",
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
    photo: "/banners/jobs.jpg",
    photoAlt: "Rows of empty desks in an open-plan workplace",
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
    photo: "/banners/identity.jpg",
    photoAlt: "A stack of documents squared up on a wooden table",
    tone: "clay",
  },
];
