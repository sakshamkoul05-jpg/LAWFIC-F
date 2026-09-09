import Image from "next/image";
import Link from "next/link";

/**
 * The four homepage ads.
 *
 * ONE IMAGE PER AD, AND NOTHING ON TOP OF IT
 *
 * This is the reference sites' own technique, checked rather than guessed:
 * hairoriginals.com serves a 1280x512 PNG and boat-lifestyle.com a 1600x667
 * one, and in both the slide's HTML text is an EMPTY STRING. Every word —
 * headline, offer, button — is painted into the file. That is precisely why
 * neither needs a scrim: nothing is laid over anything, so nothing has to be
 * darkened for legibility.
 *
 * So there is no overlay here, no gradient and no text layer. The creatives in
 * /public/ads carry their own type, built by assets-src/build-ads.mjs. The only
 * job left for this component is to be the link and to pick the right crop.
 *
 * TWO CROPS, NOT ONE SQUEEZED
 *
 * Also from the reference: hairoriginals ships 2.50:1 for desktop and 0.83:1
 * for mobile — the same campaign recomposed. A `<picture>` swaps them at the
 * breakpoint, so a phone gets type laid out for a portrait frame instead of a
 * wide banner shrunk until the headline is unreadable.
 *
 * Ours is 1.6:1 rather than their 2.50:1, and that is not a disagreement: their
 * banner runs the full width of the page, while these sit two to a row. The
 * same strip at half the width is a letterbox, and the type inside it lands on
 * screen at about nine pixels.
 *
 * The alt text carries the headline, because for a screen reader the words in
 * an image do not exist otherwise. An ad whose entire message is baked into a
 * picture is invisible without it.
 */

type Ad = {
  id: string;
  href: string;
  /** What the creative says, for anyone who cannot see it. */
  alt: string;
};

const ADS: Ad[] = [
  {
    id: "gst",
    href: "/services/gst",
    alt: "Tax and filings: a GSTIN in your name in 7 to 10 days. Start GST registration.",
  },
  {
    id: "identity",
    href: "/services/pan",
    alt: "Identity: PAN, TAN and DSC without the guesswork. See identity services.",
  },
  {
    id: "udyam",
    href: "/services/msme-udyam",
    alt: "Start a business: Udyam, GST and the rest of the file. Register your business.",
  },
  {
    id: "wallet",
    href: "/wallet",
    alt: "LAWFIC wallet: one balance for every filing you make. Open your wallet.",
  },
];

export default function PhotoAds() {
  return (
    <section aria-label="Offers" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {ADS.map((ad, i) => (
          <Link
            key={ad.id}
            href={ad.href}
            className="group block overflow-hidden rounded-xl ring-1 ring-border transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:ring-primary/50"
          >
            {/* The `width`/`height` on the SOURCE, not only on the img.
                Without them the browser reserves a box from the img's 1600x640
                — 1.6:1 — and then snaps to the tall crop's 0.83:1 the moment it
                decodes. On a phone that is a 179px box becoming a 537px one
                under the reader's thumb, for each of the four. With them the
                right ratio is known before a byte arrives. */}
            <picture>
              <source
                media="(max-width: 639px)"
                srcSet={`/ads/${ad.id}-tall.svg`}
                width={900}
                height={1080}
              />
              <Image
                src={`/ads/${ad.id}-wide.svg`}
                alt={ad.alt}
                width={1200}
                height={750}
                priority={i < 2}
                className="h-auto w-full"
              />
            </picture>
          </Link>
        ))}
      </div>
    </section>
  );
}
