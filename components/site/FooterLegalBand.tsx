"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The closing band of every page: the badge, the copyright, the safety
 * warning, and the five terms documents.
 *
 * Laid out from the client's blueprint — "Lawfic Main Page Last Section" —
 * whose content lives in the drawing layer of the spreadsheet and whose colour
 * lives in the cell fills beneath it. Both were read out rather than guessed:
 *
 *   BACKGROUND  #FEC200, the fill across rows 4-35 of the sheet.
 *   TEXT        Black. The text shapes carry no explicit colour, so they take
 *               the workbook's default dark.
 *   BADGE       xl/media/image1.png, anchored at row 4 — the top of the band.
 *               Extracted, trimmed and saved as /lawfic-badge.webp. It is the
 *               dark-ground version of the mark, not the gold-on-transparent
 *               one used elsewhere, and on this yellow that matters: the gold
 *               badge would nearly vanish.
 *
 * The wording is the client's and is reproduced as written. Tightening
 * somebody's legal prose on their own site uninvited is not a favour.
 *
 * WHERE THIS DEPARTS FROM THE BLUEPRINT, AND WHY
 *
 * 1. The copyright line appears twice in the sheet, once as "© 202-2027" — a
 *    digit short. Only the correct "© 2026-2027" is rendered.
 *
 * 2. The five terms links are #FF0000 in the blueprint. Pure red on #FEC200
 *    measures 2.46:1, which fails WCAG AA for body text by a wide margin and
 *    is genuinely hard to read, not merely non-compliant. They are rendered in
 *    #9A0000 instead: still unmistakably red, and 5.45:1. Black on the same
 *    ground is 12.93:1, so the body copy needed no such adjustment.
 *
 * 3. The blueprint names five terms documents and four exist on the site.
 *    A link with no document behind it renders as plain text rather than
 *    pointing at a 404 — see LEGAL_LINKS.
 */

/** Read from the blueprint's cell fills. */
const BAND = "#FEC200";
const INK = "#1A1208";
/* The blueprint's #FF0000, darkened until it passes on this yellow. */
const LINK = "#9A0000";

type LegalLink = { label: string; href?: string };

/* The five, in the blueprint's order. `href` absent means the document has not
   been written yet. */
const LEGAL_LINKS: LegalLink[] = [
  { label: "Lawfic General Uses Terms & Condition", href: "/legal/terms" },
  { label: "Data & Document Storage Terms & Condition" },
  { label: "All Payment (Customer & Lawfic) Terms & Condition", href: "/legal/refunds" },
  { label: "Lawfic Wallet & Lawfic Pay Later Terms & Condition", href: "/legal/wallet-terms" },
  { label: "Customer Safety & Uses Of Service Terms & Condition" },
];

export default function FooterLegalBand() {
  const { tx } = useLocale();

  return (
    <section
      aria-label={tx("Legal notices")}
      style={{ background: BAND, color: INK }}
    >
      <div className="mx-auto max-w-5xl px-6 py-12 text-center sm:px-10 sm:py-16">
        {/* ── The badge, at the top, as the blueprint anchors it ──────── */}
        <Image
          src="/lawfic-badge.webp"
          alt={tx("LAWFIC")}
          width={112}
          height={112}
          className="mx-auto h-[92px] w-[92px] sm:h-28 sm:w-28"
        />

        {/* ── Copyright ───────────────────────────────────────────────── */}
        <p className="mt-6 text-[24px] font-extrabold leading-tight tracking-tight sm:text-[30px]">
          © 2026–2027 LAWFIC
        </p>
        <p className="mt-2 text-[16px] font-bold sm:text-[20px]">
          {tx("All Rights & Every Content Reserved.")}
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-[14px] font-semibold leading-snug sm:text-[18px]">
          {tx("Unauthorized reproduction or use is strictly prohibited and punishable under law.")}
        </p>

        {/* ── The notice in full ──────────────────────────────────────── */}
        <p className="mx-auto mt-7 max-w-3xl text-[12.5px] leading-relaxed sm:text-[14px]">
          {tx(
            "Unauthorized reproduction, copying, distribution, or use of any content from this website — including, idea, text, images, logos, pattern or design.",
          )}
        </p>
        <p className="mx-auto mt-2.5 max-w-3xl text-[12.5px] font-bold leading-relaxed sm:text-[14px]">
          {tx(
            "Without prior written permission is strictly prohibited. Any such act shall be treated as an offence under Section 63 of the Copyright Act, 1957, which is punishable with imprisonment for a term ranging from six months to three years, along with a fine ranging from ₹50,000 to ₹2,00,000, or both.",
          )}
        </p>

        {/* ── Customer safety warning ─────────────────────────────────── */}
        {/* The one line here that can stop somebody handing an OTP to a
            stranger, so it is given a rule above and below and the largest
            weight after the copyright, as the blueprint gives it. */}
        <div
          className="mx-auto mt-9 max-w-3xl border-y py-6"
          style={{ borderColor: "rgba(26,18,8,0.28)" }}
        >
          <p className="text-[17px] font-extrabold sm:text-[21px]">
            <span aria-hidden>⚠️</span> {tx("Customer Safety Warning")}
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed sm:text-[14px]">
            {tx(
              "Lawfic never asks for OTP, passwords, payment details, or personal banking information via phone calls, SMS, or email. Beware of fraudulent individuals or websites impersonating Lawfic. For any verification or query, please contact us only through our official website or registered contact details.",
            )}
          </p>
        </div>

        {/* ── The five documents ──────────────────────────────────────── */}
        <ul className="mt-8 flex flex-wrap items-stretch justify-center gap-x-6 gap-y-3">
          {LEGAL_LINKS.map((item) => {
            const label = (
              <span className="block text-[11.5px] font-bold leading-snug sm:text-[12.5px]">
                {tx(item.label)}
              </span>
            );

            return (
              <li key={item.label} className="max-w-[210px]">
                {item.href ? (
                  <Link href={item.href} className="legal-link" style={{ color: LINK }}>
                    {label}
                  </Link>
                ) : (
                  /* No document behind it yet. Rendered, but not pretending to
                     be a link — a label that looks clickable and goes nowhere
                     is worse than one that plainly does not. */
                  <span
                    className="block opacity-70"
                    style={{ color: LINK }}
                    title={tx("Coming soon")}
                  >
                    {label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
