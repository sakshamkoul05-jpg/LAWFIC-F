/**
 * User profile — the self-description that drives personalisation.
 *
 * This is the single source of truth for what a user tells us about
 * themselves. The onboarding form, the profile API, and the personalised
 * home page all use the same validated shape so that "does this user prepare
 * for UPSC?" has exactly one answer everywhere.
 *
 * The boundary here mirrors wallet-preferences: profile fields are identity,
 * never money. Nothing in the wallet path reads them.
 */

export type UserProfile = {
  fullName: string;
  phone: string;
  city: string;
  qualification: string;
  examsPreparing: string[];
  jobsLooking: string[];
  resumePath: string;
};

export const EMPTY_PROFILE: UserProfile = {
  fullName: "",
  phone: "",
  city: "",
  qualification: "",
  examsPreparing: [],
  jobsLooking: [],
  resumePath: "",
};

/** The exam streams we can recommend against. Free-text is allowed too. */
export const EXAM_OPTIONS = [
  "UPSC Civil Services",
  "State PCS",
  "SSC / Banking",
  "Railways",
  "Defence (NDA/CDS/Agniveer)",
  "CA / CS / CMA",
  "CLAT / Law",
  "NEET / Medical",
  "JEE / Engineering",
  "GATE",
  "MBA (CAT / XAT)",
  "Judiciary",
] as const;

/** The job directions we can tailor the feed for. */
export const JOB_OPTIONS = [
  "Government job",
  "Accounts & Finance",
  "Legal / Paralegal",
  "Teaching",
  "Data entry & Admin",
  "Sales & Marketing",
  "IT & Software",
  "Fresher / First job",
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

export type ProfileValidation = {
  ok: true;
  profile: UserProfile;
} | {
  ok: false;
  error: string;
};

/**
 * Normalise and validate an unknown payload into a UserProfile.
 *
 * Heavier than the wallet-prefs validator because these fields come from a
 * fuller form and feed personalisation — we refuse values that would silently
 * paint the wrong picture (an exam that is not a string, a resume path with a
 * space, etc.).
 */
export function normalizeProfile(input: unknown): ProfileValidation {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid profile." };
  }
  const raw = input as Record<string, unknown>;

  const fullName = typeof raw.fullName === "string" ? raw.fullName.trim() : "";
  if (fullName.length < 2) return { ok: false, error: "Enter your full name." };

  const phone = typeof raw.phone === "string" ? raw.phone.replace(/\D/g, "") : "";
  if (phone !== "" && !PHONE_RE.test(phone)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
  }

  const city = typeof raw.city === "string" ? raw.city.trim() : "";
  const qualification = typeof raw.qualification === "string" ? raw.qualification.trim() : "";
  if (qualification.length < 2) {
    return { ok: false, error: "Tell us your educational qualification." };
  }

  const strArr = (v: unknown): string[] =>
    Array.isArray(v)
      ? v
          .map((x) => (typeof x === "string" ? x.trim() : ""))
          .filter(Boolean)
          .slice(0, 8)
      : [];

  const examsPreparing = strArr(raw.examsPreparing);
  const jobsLooking = strArr(raw.jobsLooking);
  const resumePath = typeof raw.resumePath === "string" ? raw.resumePath.trim() : "";

  return {
    ok: true,
    profile: {
      fullName,
      phone,
      city,
      qualification,
      examsPreparing,
      jobsLooking,
      resumePath,
    },
  };
}

/** An email address in the right shape, for the sign-in step. */
export function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v);
}

/** A 10-digit Indian mobile number. */
export function isValidPhone(v: string): boolean {
  return PHONE_RE.test(v.replace(/\D/g, ""));
}

/**
 * Exam `UPSC Civil Services` or `upsc`/`IAS` all key the personalisation for
 * the civil-services track. Used by the home page to pick what to surface.
 */
export function matchesTrack(exams: string[], track: string): boolean {
  const t = track.toLowerCase();
  return exams.some((e) => {
    const n = e.toLowerCase().replace(/[^a-z0-9]/g, "");
    return n.includes(t) || t.includes(n);
  });
}

/** True when the user gave us any exam or job interest. */
export function hasInterests(p: UserProfile): boolean {
  return p.examsPreparing.length > 0 || p.jobsLooking.length > 0;
}

/**
 * Whether a saved profile is enough to render personalised content: we need a
 * name and at least one signal (exam or job) so the greeting makes sense.
 */
export function isCompleteProfile(p: UserProfile): boolean {
  return p.fullName.trim().length >= 2 && hasInterests(p);
}

/** The single-line headline for the personalised greeting. */
export function personalizeLine(p: UserProfile): string {
  if (matchesTrack(p.examsPreparing, "upsc")) return "Your civil services track";
  if (matchesTrack(p.examsPreparing, "ca")) return "Your chartered accountancy track";
  if (matchesTrack(p.examsPreparing, "clat")) return "Your law entrance track";
  if (matchesTrack(p.examsPreparing, "neet")) return "Your medical track";
  if (matchesTrack(p.examsPreparing, "jee")) return "Your engineering track";
  if (p.jobsLooking.some((j) => j.toLowerCase().includes("legal")))
    return "Your legal career track";
  if (p.jobsLooking.some((j) => j.toLowerCase().includes("account")))
    return "Your finance career track";
  if (p.jobsLooking.some((j) => j.toLowerCase().includes("government")))
    return "Your government career track";
  return "Your personalised LAWFIC";
}

/**
 * The live LAWFIC services that matter most for a user's track, in priority
 * order. Government-exam tracks get the identity stack first (PAN, Aadhaar) —
 * every one of those forms hangs off identity records — while business and
 * finance tracks get the tax/registration stack (GST, MSME, PAN).
 */
export function recommendedServiceSlugs(p: UserProfile): string[] {
  const jobs = p.jobsLooking.map((j) => j.toLowerCase());

  const isGovtTrack =
    matchesTrack(p.examsPreparing, "upsc") ||
    matchesTrack(p.examsPreparing, "banking") ||
    matchesTrack(p.examsPreparing, "railway") ||
    matchesTrack(p.examsPreparing, "defence") ||
    matchesTrack(p.examsPreparing, "judiciary") ||
    jobs.some((j) => j.includes("government"));

  const isFinanceTrack =
    matchesTrack(p.examsPreparing, "ca") || jobs.some((j) => j.includes("account"));

  const isBusinessTrack =
    jobs.some((j) => j.includes("sales")) || jobs.some((j) => j.includes("fresher"));

  if (isFinanceTrack) return ["pan", "gst", "msme-udyam"];
  if (isGovtTrack) return ["pan", "aadhaar"];
  if (isBusinessTrack) return ["gst", "msme-udyam", "pan"];
  return ["pan", "aadhaar"];
}