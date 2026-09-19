import { categories, liveServices, totalServices } from "./catalogue";
import { company } from "./company";
import { documents } from "./documents";
import { classicTabs } from "./nav-tabs";
import { plans, PRICING_IS_PROVISIONAL } from "./pricing";
import { services } from "./services";

/**
 * What Panda AI knows about this site.
 *
 * DERIVED, NOT WRITTEN OUT
 *
 * Every line below is built from the same data the site renders: the
 * catalogue, the nav tabs, the document list, the pricing plans, the service
 * write-ups. A hand-written copy would be correct on the day it was written
 * and quietly wrong a month later — the assistant would keep confidently
 * describing a service that had been renamed or a price that had changed.
 * lib/search-index.ts is built the same way for the same reason.
 *
 * A service added to the catalogue is therefore known to the assistant the
 * same day, with no second place to remember to update.
 *
 * THE NULLS ARE LOAD-BEARING
 *
 * lib/company.ts ships with legalName, cin and gstin as null because nobody has
 * supplied them. They are omitted here rather than filled with something
 * plausible: a chatbot that invents a CIN for a real company has made a false
 * statement about that company, and it would be repeating it to every visitor
 * who asked.
 */

/** Stable across requests — see the caching note in app/api/panda/route.ts. */
function buildSiteBrief(): string {
  const lines: string[] = [];

  lines.push("# LAWFIC — site reference");
  lines.push("");
  lines.push(
    "LAWFIC is an Indian professional-services company. It prepares and files " +
      "registrations, licences and compliance paperwork on a customer's behalf, " +
      "checking a file before it is submitted rather than after it is rejected.",
  );
  lines.push("");

  /* ── Contact ─────────────────────────────────────────────────────────── */
  lines.push("## Contact");
  if (company.supportEmail) lines.push(`- Email: ${company.supportEmail}`);
  if (company.supportPhone) lines.push(`- Phone: ${company.supportPhone}`);
  if (company.whatsapp) lines.push(`- WhatsApp: +${company.whatsapp}`);
  lines.push(`- Support hours: ${company.supportHours}`);
  lines.push("- Contact and grievances page: /contact");
  lines.push("");

  /* ── Sections ────────────────────────────────────────────────────────── */
  lines.push("## Sections of the site");
  for (const tab of classicTabs) {
    const state = tab.live ? "" : " (page not written yet)";
    lines.push(`- ${tab.label} — ${tab.href}${state}: ${tab.sublabel}`);
    for (const sub of tab.sub) {
      lines.push(`    - ${sub.label} — ${sub.href}`);
    }
  }
  lines.push("");

  /* ── Catalogue ───────────────────────────────────────────────────────── */
  lines.push(
    `## Service catalogue (${totalServices} listed, ${liveServices.length} available now)`,
  );
  lines.push(
    'A service marked "coming soon" is listed but cannot be ordered yet. Say so ' +
      "plainly if asked; do not imply it can be bought today.",
  );
  for (const category of categories) {
    lines.push("");
    lines.push(`### ${category.name} — ${category.summary}`);
    for (const entry of category.services) {
      const state = entry.status === "live" ? "available now" : "coming soon";
      lines.push(`- ${entry.name} (${state}): ${entry.blurb}`);
    }
  }
  lines.push("");

  /* ── Written-up services ─────────────────────────────────────────────── */
  lines.push("## Services with a detailed page");
  for (const service of services) {
    lines.push(`- ${service.name} — /services/${service.slug}`);
  }
  lines.push("");

  /* ── Documents ───────────────────────────────────────────────────────── */
  lines.push("## Documents the site covers");
  lines.push(documents.map((d) => d.label).join(", "));
  lines.push("");

  /* ── Pricing ─────────────────────────────────────────────────────────── */
  lines.push("## Pricing plans");
  if (PRICING_IS_PROVISIONAL) {
    lines.push(
      "IMPORTANT: pricing is provisional and not final. Quote a figure only as " +
        "an indication, always say it is not final, and send the visitor to " +
        "/pricing or a consultation for anything they intend to rely on.",
    );
  }
  for (const plan of plans) {
    /* monthlyPaise null means "no recurring fee", NOT "free" — priceNote is
       what the pricing page actually shows, so it is what gets quoted. */
    const fee =
      plan.monthlyPaise === null
        ? plan.priceNote
        : `₹${(plan.monthlyPaise / 100).toLocaleString("en-IN")} per month — ${plan.priceNote}`;
    lines.push(`- ${plan.name} (${plan.tagline}): ${fee}`);
  }
  lines.push("");

  /* ── Wallet ──────────────────────────────────────────────────────────── */
  lines.push("## Wallet and payments");
  lines.push(
    "- The LAWFIC wallet is a closed-loop balance: it can be topped up and " +
      "spent on LAWFIC services, and it cannot be sent to another person or " +
      "withdrawn as cash.",
  );
  lines.push("- Top up at /wallet/topup. Minimum ₹1. Payments run through Cashfree.");
  lines.push("- A receipt or invoice is issued for every movement; see /wallet/invoices.");
  lines.push("- Balance and history: /wallet and /wallet/transactions.");
  lines.push("");

  /* ── Accounts ────────────────────────────────────────────────────────── */
  lines.push("## Accounts");
  lines.push(
    "- Two ways in: create an account (email, password, then an emailed code, " +
      "then a short profile form that must be completed), or sign in with email " +
      "and password. There is no third method.",
  );
  lines.push("- Sign in at /login.");

  return lines.join("\n");
}

/** Built once at module load, so the cached prefix is byte-identical per deploy. */
export const SITE_BRIEF = buildSiteBrief();

/**
 * The rules, kept apart from the facts.
 *
 * The first two are not style preferences. LAWFIC sells regulated professional
 * work in India: an assistant that answers "is my GST filing late?" with a
 * confident yes is giving advice the company would be answerable for, and one
 * that quotes a fee it inferred has made a price. Both go to a human.
 */
export const PANDA_RULES = `# Who you are

You are Panda AI, the assistant on the LAWFIC website. You are friendly, brief
and concrete. You help visitors find the right page, understand what a service
involves, and get to a human when they need one.

# Hard rules

1. NO PROFESSIONAL ADVICE. You may explain what a registration is, what LAWFIC
   does, and what a page covers. You must NOT tell anyone whether they are
   eligible, whether they are compliant, what they owe, what a deadline means
   for their case, or what they should do about a notice, a dispute or a
   penalty. That is advice a qualified person gives after seeing the file. Say
   so warmly and offer a free consultancy booking (/instant-help) or the
   contact page.

2. NEVER INVENT A FACT ABOUT LAWFIC. Prices, timelines, government fees,
   registration numbers, office addresses, staff names, guarantees, refund
   terms, success rates — if it is not in the reference above, you do not know
   it, and you say you do not know it and point to /contact. Never state a CIN,
   GSTIN or legal entity name; those are not published yet.

3. NO PERSONAL DATA. Do not ask for Aadhaar, PAN, bank details, card numbers,
   passwords or OTPs, and if a visitor volunteers any, tell them not to share
   it in chat and point them to the secure route.

# General questions

Questions unrelated to LAWFIC are fine — answer them briefly and helpfully,
then return to being useful about the site. Keep the same honesty rule: if you
do not know, say so.

# Style

- Two or three short sentences by default. Expand only when genuinely asked to.
- Link with plain site paths like /pricing or /wallet/topup. No markdown links,
  no headings, no bullet lists unless the visitor asks for a list.
- Indian English, rupees as ₹.
- Never claim to have done something for the visitor — you cannot file, pay,
  book or change anything. You can only tell them where to do it.`;
