"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The closing band of every page: copyright, the safety warning, and the five
 * terms documents.
 *
 * Laid out from the client's blueprint — "Lawfic Main Page Last Section" —
 * which specifies the order, the relative weight of each line and the row of
 * five links at the bottom. The wording is theirs and is reproduced as written
 * rather than edited: it is a legal notice on their own site, and tightening
 * somebody's legal prose without being asked is not a favour.
 *
 * TWO THINGS WERE CHANGED, BOTH DELIBERATE
 *
 * The blueprint carries the copyright line twice, once as "© 202-2027" — a
 * digit short. Only the correct "© 2026–2027" is rendered.
 *
 * The blueprint's link row names five documents and only four exist on the
 * site. Rather than point two of them at a page that would 404, a link with no
 * document behind it renders as plain text — present, readable, not clickable.
 * See LEGAL_LINKS: give one an `href` and it becomes a link, with no other
 * change here.
 */

type LegalLink = { label: string; href?: string };

/* The five, in the blueprint's order. `href` absent means the document has not
   been written yet — see the note above. */
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
      style={{
        borderColor: "var(--band-edge, rgba(230,195,107,0.22))",
        background: "var(--band-deep, #060E22)",
        color: "var(--band-ink, #F2EEE4)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        {/* ── Copyright ───────────────────────────────────────────────── */}
        <div className="text-center">
          <p className="text-[22px] font-semibold leading-tight sm:text-[26px]">
            © 2026–2027 LAWFIC
          </p>
          <p
            className="mt-2 text-[15px] sm:text-[17px]"
            style={{ color: "var(--band-gold, #E6C36B)" }}
          >
            {tx("All Rights & Every Content Reserved.")}
          </p>
          <p
            className="mx-auto mt-3 max-w-3xl text-[13.5px] leading-relaxed sm:text-[15px]"
            style={{ color: "var(--band-ink-dim, rgba(242,238,228,0.78))" }}
          >
            {tx("Unauthorized reproduction or use is strictly prohibited and punishable under law.")}
          </p>
        </div>

        {/* ── The notice in full ──────────────────────────────────────── */}
        <div
          className="mx-auto mt-8 max-w-4xl rounded-2xl px-5 py-6 text-center sm:px-8"
          style={{
            background: "rgba(255,255,255,0.035)",
            border: "1px solid var(--band-edge, rgba(230,195,107,0.22))",
          }}
        >
          <p
            className="text-[12.5px] leading-relaxed sm:text-[13.5px]"
            style={{ color: "var(--band-ink-dim, rgba(242,238,228,0.78))" }}
          >
            {tx(
              "Unauthorized reproduction, copying, distribution, or use of any content from this website — including, idea, text, images, logos, pattern or design.",
            )}
          </p>
          <p className="mt-3 text-[12.5px] font-medium leading-relaxed sm:text-[13.5px]">
            {tx(
              "Without prior written permission is strictly prohibited. Any such act shall be treated as an offence under Section 63 of the Copyright Act, 1957, which is punishable with imprisonment for a term ranging from six months to three years, along with a fine ranging from ₹50,000 to ₹2,00,000, or both.",
            )}
          </p>
        </div>

        {/* ── Customer safety warning ─────────────────────────────────── */}
        {/* Loud on purpose. This is the line that stops somebody handing an
            OTP to a stranger, so it is given the warning colour and its own
            panel rather than being folded into the small print above. */}
        <div
          className="mx-auto mt-8 max-w-4xl rounded-2xl px-5 py-6 sm:px-8"
          style={{
            background: "rgba(230,120,80,0.09)",
            border: "1px solid rgba(230,150,110,0.35)",
          }}
        >
          <p className="flex items-center justify-center gap-2.5 text-[16px] font-semibold sm:text-[19px]">
            <ShieldAlert
              aria-hidden
              size={22}
              strokeWidth={2}
              style={{ color: "#FFB08A" }}
              className="shrink-0"
            />
            {tx("Customer Safety Warning")}
          </p>
          <p
            className="mt-3 text-center text-[12.5px] leading-relaxed sm:text-[13.5px]"
            style={{ color: "var(--band-ink-dim, rgba(242,238,228,0.78))" }}
          >
            {tx(
              "Lawfic never asks for OTP, passwords, payment details, or personal banking information via phone calls, SMS, or email. Beware of fraudulent individuals or websites impersonating Lawfic. For any verification or query, please contact us only through our official website or registered contact details.",
            )}
          </p>
        </div>

        {/* ── The five documents ──────────────────────────────────────── */}
        <ul className="mt-10 flex flex-wrap items-stretch justify-center gap-2.5">
          {LEGAL_LINKS.map((item) => {
            const content = (
              <span className="block text-center text-[11.5px] font-semibold leading-snug sm:text-[12.5px]">
                {tx(item.label)}
              </span>
            );

            return (
              <li key={item.label} className="min-w-[150px] flex-1 basis-[150px] sm:basis-[180px]">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="legal-chip flex h-full items-center justify-center rounded-xl px-3 py-3"
                  >
                    {content}
                  </Link>
                ) : (
                  /* No document behind it yet. Rendered, but not pretending to
                     be a link — a chip that looks clickable and goes nowhere is
                     worse than one that plainly does not. */
                  <span
                    className="flex h-full cursor-default items-center justify-center rounded-xl px-3 py-3 opacity-55"
                    style={{
                      border: "1px solid var(--band-edge, rgba(230,195,107,0.22))",
                      background: "rgba(255,255,255,0.02)",
                    }}
                    title={tx("Coming soon")}
                  >
                    {content}
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
