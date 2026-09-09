"use client";

import Image from "next/image";
import Link from "next/link";
import { useProfile } from "@/components/profile/ProfileProvider";
import { matchesTrack } from "@/lib/profile";

/**
 * The photo tile grid, in the shape a large retail homepage uses — the client's
 * reference is hairoriginals.com, where the words sit ON the picture and the
 * picture is left alone.
 *
 * TEXT ON THE PHOTO, AND WHAT THAT ACTUALLY COSTS
 *
 * These used to be a photo with a card of text underneath it. Moving the words
 * onto the image is what was asked and it does look better, but it trades a
 * guarantee for a gamble: a headline on a photograph is legible over the dark
 * parts and gone over the bright ones, and these are photographs of daylight
 * offices and paperwork. Covering the whole frame to fix that is the scrim the
 * client is objecting to, so the answer is neither of the two obvious ones.
 *
 * What is here instead:
 *
 *   - the text is anchored to the BOTTOM of the frame, always, so there is one
 *     region to protect rather than a different one per photograph;
 *   - the gradient over it is short. It is opaque under the words and gone by
 *     just under halfway up, so the top half of every picture is untouched —
 *     which is the difference between a shadow and a scrim;
 *   - a text-shadow underneath as the backstop, for the photo that turns out
 *     to be pale right where the headline lands. It costs nothing and it is
 *     the thing that stops a tile ever being unreadable.
 *
 * Several at a time rather than one banner, because a grid is scanned and a
 * carousel is waited on.
 *
 * The tiles reorder for a signed-in customer. Someone preparing for an exam
 * sees Education first; a business owner sees registrations first. Nothing is
 * hidden by that ordering — everyone sees every tile, and a signed-out visitor
 * gets the order written below. Reordering is the honest form of
 * personalisation here: hiding tiles would make the site look emptier for the
 * people it knows most about.
 *
 * Photographs carry no identifiable people, for the reason recorded in
 * lib/promotional.ts: these are advertising, and Unsplash does not verify
 * model releases.
 */

type Tile = {
  id: string;
  eyebrow: string;
  title: string;
  line: string;
  href: string;
  photo: string;
  alt: string;
  /** The words on the button. */
  cta: string;
  /** Which kind of reader this tile is for, used only for ordering. */
  audience: "business" | "student" | "everyone";
};

const TILES: Tile[] = [
  {
    id: "startup",
    eyebrow: "Start a business",
    title: "Udyam, GST and the rest",
    line: "Registrations that are free at source, filed right the first time.",
    href: "/services/msme-udyam",
    photo: "/banners/msme.jpg",
    alt: "The glass display counter of a small shop",
    cta: "Start now",
    audience: "business",
  },
  {
    id: "tax",
    eyebrow: "Tax & filings",
    title: "GST, TDS and returns",
    line: "Prepared, filed, and defended when the department asks questions.",
    href: "/services/gst",
    photo: "/banners/gst.jpg",
    alt: "A desk with a calculator, reading glasses and printed statements",
    cta: "File a return",
    audience: "business",
  },
  {
    id: "education",
    eyebrow: "Students",
    title: "Certificates exams ask for",
    line: "Domicile, income, EWS and OBC-NCL — before the deadline, not after.",
    href: "/document/domicile-certificate",
    photo: "/banners/education.jpg",
    alt: "A stack of books on a wooden table",
    cta: "See courses",
    audience: "student",
  },
  {
    id: "jobs",
    eyebrow: "Jobs",
    title: "Work matched to your trade",
    line: "Tell us your city and qualification and the feed narrows. Free, always.",
    href: "/jobs",
    photo: "/banners/jobs.jpg",
    alt: "Rows of empty desks in an open-plan workplace",
    cta: "Browse jobs",
    audience: "student",
  },
  {
    id: "food",
    eyebrow: "Licences",
    title: "FSSAI for food businesses",
    line: "Which licence you need depends on turnover and where you operate.",
    href: "/document/fssai",
    photo: "/banners/food.jpg",
    alt: "A stainless steel commercial kitchen",
    cta: "Get branded",
    audience: "business",
  },
  {
    id: "legal",
    eyebrow: "Legal documents",
    title: "Agreements, drafted properly",
    line: "Rent, leave and licence, power of attorney, wills.",
    href: "/document/rent-agreement",
    photo: "/banners/legal.jpg",
    alt: "Ring binders lined up on an office shelf",
    cta: "Explore",
    audience: "everyone",
  },
];

export default function AdTiles() {
  const { profile, personalised } = useProfile();

  /* A student track is the clearest signal we hold: someone preparing for an
     exam wants certificates and jobs, not GST. Everything still shows. */
  const studentFirst =
    personalised &&
    profile !== null &&
    (profile.examsPreparing.length > 0 ||
      matchesTrack(profile.examsPreparing, "upsc") ||
      profile.jobsLooking.length > 0);

  const tiles = studentFirst
    ? [...TILES].sort((a, b) => rank(a.audience) - rank(b.audience))
    : TILES;

  return (
    <section aria-label="Browse LAWFIC" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="type-h2 text-foreground">
          {studentFirst && profile
            ? `Picked for ${profile.fullName.split(" ")[0]}`
            : "Where people start"}
        </h2>
        <Link
          href="/services"
          className="type-label text-primary transition-colors hover:text-primary-hover"
        >
          All services
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t, i) => (
          <Link
            key={t.id}
            href={t.href}
            className="group relative block aspect-[4/5] overflow-hidden rounded-xl sm:aspect-[5/6]"
          >
            <Image
              src={t.photo}
              alt={t.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading={i < 3 ? "eager" : "lazy"}
              className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
            />

            {/* Short, and only under the words. Opaque at the foot, gone by
                46% — the top half of the photograph is never touched. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,9,7,0.88) 0%, rgba(10,9,7,0.62) 22%, rgba(10,9,7,0.16) 38%, transparent 46%)",
              }}
            />

            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p
                className="type-label text-white/80"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}
              >
                {t.eyebrow}
              </p>
              <h3
                className="mt-1.5 text-[19px] font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-[21px]"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
              >
                {t.title}
              </h3>
              <p
                className="mt-1.5 max-w-[34ch] text-[12.5px] leading-relaxed text-white/85"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}
              >
                {t.line}
              </p>

              {/* A solid button, as the reference has it. On a photograph a
                  filled shape is the only control that reads instantly —
                  an outline or a bare word takes on whatever is behind it. */}
              <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-[#12100C] transition-colors group-hover:bg-primary group-hover:text-background">
                {t.cta}
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2 6h7M6 3l3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function rank(audience: Tile["audience"]): number {
  if (audience === "student") return 0;
  if (audience === "everyone") return 1;
  return 2;
}
