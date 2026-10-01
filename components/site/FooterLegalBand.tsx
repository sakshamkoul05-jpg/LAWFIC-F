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
 *
 * 4. The links are not underlined. They are not underlined in the blueprint
 *    either, and at this size five underlined phrases across one row read as
 *    a scribble rather than as navigation. The underline appears on hover and
 *    focus instead, so the affordance is still there when it is wanted.
 *
 * ON THE SIZE
 *
 * The first version of this band was 842px tall against a 900px viewport —
 * almost a full screen of legal small print before anybody reached the end of
 * the page. Everything here is deliberately tight: the measure is wide so the
 * paragraphs wrap into fewer lines, the badge is small, and the type steps
 * down rather than shouting. It is a notice, not a section.
 */

/* 2026 revision, at the owner's request: half the height, every line bold,
   and the yellow replaced with the site's own navy and champagne gold so the
   band reads as part of the page rather than a sticker on the end of it.
   Cream on this navy is about 14:1 and the gold links about 9:1. */
const BAND = "linear-gradient(180deg, #0B1D4A 0%, #071331 100%)";
const INK = "#F3EEE2";
const GOLD = "#E6C36B";
const LINK = "#F2C94C";

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
      className="border-t"
      style={{ background: BAND, color: INK, borderColor: "rgba(230,195,107,0.35)" }}
    >
      <div className="mx-auto max-w-6xl px-5 py-3 text-center font-bold sm:px-8">
        {/* ── Badge and copyright on one line ─────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          <Image
            src="/lawfic-badge.webp"
            alt={tx("LAWFIC")}
            width={72}
            height={72}
            className="h-[24px] w-[24px] rounded-full ring-1 ring-[#E6C36B]/60"
          />
          <p className="text-[12.5px] font-extrabold leading-tight tracking-tight" style={{ color: GOLD }}>
            © 2026–2027 LAWFIC
          </p>
          <span aria-hidden className="opacity-40">·</span>
          <p className="text-[11px] leading-tight">{tx("All Rights & Every Content Reserved.")}</p>
          <span aria-hidden className="hidden opacity-40 sm:inline">·</span>
          <p className="text-[11px] leading-tight">
            {tx("Unauthorized reproduction or use is strictly prohibited and punishable under law.")}
          </p>
        </div>

        {/* ── The notice in full, as one paragraph ────────────────────── */}
        <p className="mx-auto mt-1.5 max-w-6xl text-[9.5px] leading-snug opacity-85">
          {tx(
            "Unauthorized reproduction, copying, distribution, or use of any content from this website — including, idea, text, images, logos, pattern or design.",
          )}{" "}
          {tx(
            "Without prior written permission is strictly prohibited. Any such act shall be treated as an offence under Section 63 of the Copyright Act, 1957, which is punishable with imprisonment for a term ranging from six months to three years, along with a fine ranging from ₹50,000 to ₹2,00,000, or both.",
          )}
        </p>

        {/* ── Customer safety warning ─────────────────────────────────── */}
        {/* Still ruled off above and below: it is the one line here that can
            stop somebody handing an OTP to a stranger. */}
        <p
          className="mx-auto mt-2 max-w-6xl border-y py-1.5 text-[9.5px] leading-snug"
          style={{ borderColor: "rgba(230,195,107,0.25)" }}
        >
          <span className="text-[11px] font-extrabold" style={{ color: GOLD }}>
            <span aria-hidden>⚠️</span> {tx("Customer Safety Warning")}:
          </span>{" "}
          <span className="opacity-90">
            {tx(
              "Lawfic never asks for OTP, passwords, payment details, or personal banking information via phone calls, SMS, or email. Beware of fraudulent individuals or websites impersonating Lawfic. For any verification or query, please contact us only through our official website or registered contact details.",
            )}
          </span>
        </p>

        {/* ── The five documents ──────────────────────────────────────── */}
        {/* ONE ROW, NOT FOUR-PLUS-ONE.
            As a wrapping flex row the fifth always dropped underneath: five
            items at max-w-[230px] plus gaps needed ~1246px and only ~1072px
            was going. A five-column grid makes the row structural rather than
            something the browser arrives at — each column is an equal share of
            whatever width there is, so it cannot fall over. Two columns on a
            phone, where five across would be unreadable. */}
        <ul className="mx-auto mt-2 grid max-w-5xl grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-5 sm:gap-x-4">
          {LEGAL_LINKS.map((item) => {
            const label = (
              <span className="block text-[9.5px] font-bold leading-snug">
                {tx(item.label)}
              </span>
            );

            return (
              <li key={item.label}>
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
