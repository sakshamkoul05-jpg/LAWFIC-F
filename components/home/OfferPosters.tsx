"use client";

import Link from "next/link";
import { FIRST_PURCHASE, OFFERS_LIVE, POSTERS, type Poster } from "@/lib/home-offers";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "11 Scroll Advertisment Poster" and "Special discount offer poster for new
 * customer" — items 5 and 6 of the client's running order.
 *
 * Eleven ticket-shaped posters run across the page, each separated by a
 * barcode stub as in the sheet, on a slow loop that stops while the pointer is
 * over it. Under them, the orange first-purchase strip.
 *
 * The posters are drawn in markup rather than pasted in as images, so the
 * type stays sharp at every size, the codes can be selected and copied, and a
 * screen reader can read every offer.
 */
export default function OfferPosters() {
  const { tx } = useLocale();
  if (!OFFERS_LIVE) return null;

  return (
    <section id="offers" aria-label={tx("Offers")} className="home-posters">
      <div className="classic-marquee-group home-posters-rail relative overflow-hidden py-8">
        <div className="classic-marquee-track home-posters-track flex w-max items-stretch">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex items-stretch" aria-hidden={copy === 1 || undefined}>
              {POSTERS.map((p) => (
                <li key={p.id} className="flex items-stretch">
                  <PosterCard poster={p} tabbable={copy === 0} />
                  <Barcode />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="home-wrap pb-10 pt-2">
        <Link href={FIRST_PURCHASE.href} className="home-first-strip">
          <span className="home-first-strip-big">{tx(FIRST_PURCHASE.headline)}</span>
          <span aria-hidden className="home-first-strip-cut" />
          <span className="home-first-strip-small">
            <span className="block">{tx(FIRST_PURCHASE.line)}</span>
            <span className="block font-semibold">{tx(FIRST_PURCHASE.via)}</span>
          </span>
        </Link>
      </div>
    </section>
  );
}

function PosterCard({ poster: p, tabbable }: { poster: Poster; tabbable: boolean }) {
  const { tx } = useLocale();
  return (
    <Link href={p.href} tabIndex={tabbable ? undefined : -1} className={`home-poster tone-${p.tone}`} aria-label={`${p.headline}${p.code ? ` — code ${p.code}` : ""}`}>
      <span aria-hidden className="home-poster-perf" />
      {p.app ? (
        <span className="flex h-full items-center gap-4">
          <span className="home-poster-coin">
            <span className="text-[22px] font-bold leading-none">₹100</span>
            <span className="mt-1 text-[8px] font-semibold uppercase leading-tight">Cash back<br />in your wallet</span>
          </span>
          <span className="min-w-0 flex-1 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lawfic-logo.png" alt="" className="mx-auto h-11 w-11 object-contain" />
            <span className="home-poster-brand">LAWFIC</span>
            <span className="mt-1 block text-[13px] font-semibold">{tx(p.kicker)}</span>
            <span className="mt-0.5 block text-[10px] leading-snug opacity-85">{tx(p.line)}</span>
            <span className="mt-0.5 block text-[10px] leading-snug text-[#F2C94C]">{tx(p.fine)}</span>
            <span className="home-poster-btn">{tx("DOWNLOAD NOW")} →</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app-download-qr.png" alt="" className="h-[74px] w-[74px] shrink-0 rounded-md bg-white p-1" />
        </span>
      ) : p.seal ? (
        <span className="flex h-full items-center gap-4">
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] opacity-80">{tx(p.kicker)}</span>
            <span className="home-poster-serif mt-1 block text-[30px] leading-none">{tx(p.headline)}</span>
            <span className="mt-2 block max-w-[200px] text-[10px] leading-snug opacity-80">{tx(p.line)}</span>
            <span className="mt-3 flex gap-2 text-[8.5px]">
              <span className="rounded-full border border-current/40 px-2 py-0.5 opacity-90">✓ {tx("Valid for All Users")}</span>
              <span className="rounded-full border border-current/40 px-2 py-0.5 opacity-90">✓ {tx("Instant Discount")}</span>
            </span>
            {p.code && (
              <span className="mt-3 inline-flex items-center gap-2 rounded bg-[#E6C36B] px-2 py-1 text-[#0B1D4A]">
                <span className="text-[8px] font-semibold uppercase">{tx("Use code")}</span>
                <span className="home-poster-serif text-[15px] font-bold tracking-wide">{p.code}</span>
              </span>
            )}
            <span className="mt-2 block text-[8.5px] font-semibold">{tx("Only on Lawfic")}</span>
          </span>
          <span className="home-poster-seal">
            <span className="text-[9px] tracking-[0.2em]">{p.seal.top}</span>
            <span className="home-poster-serif text-[30px] font-bold leading-none">{p.seal.big}</span>
            <span className="text-[7px] tracking-[0.18em]">{p.seal.bottom}</span>
          </span>
        </span>
      ) : (
        <span className="flex h-full flex-col items-center justify-center text-center">
          <span className="home-poster-chip">{tx(p.kicker)}</span>
          <span className="home-poster-display mt-3">{tx(p.headline)}</span>
          <span className="home-poster-display-sub mt-1">
            {tx(p.line)}
            {p.code && (
              <>
                {" "}
                <span className="home-poster-code">{p.code}</span> <span className="opacity-90">— {tx("Only on Lawfic")}</span>
              </>
            )}
          </span>
          <span className="mt-3 text-[9.5px] opacity-70">{tx(p.fine)}</span>
        </span>
      )}
    </Link>
  );
}

/** The stub between tickets — a decorative barcode, as drawn in the sheet. */
function Barcode() {
  const bars = [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1];
  return (
    <span aria-hidden className="home-barcode">
      {bars.map((w, i) => (
        <span key={i} style={{ height: w }} />
      ))}
    </span>
  );
}
