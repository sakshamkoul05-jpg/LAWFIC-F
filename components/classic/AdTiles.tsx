"use client";

import Image from "next/image";
import Link from "next/link";
import { useProfile } from "@/components/profile/ProfileProvider";
import { matchesTrack } from "@/lib/profile";

/**
 * The photo tile grid, in the shape a large retail homepage uses: a picture,
 * a heading, a short line, one link out. Several at a time rather than one
 * banner, because a grid is scanned and a carousel is waited on.
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
            className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary/50"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={t.photo}
                alt={t.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading={i < 3 ? "eager" : "lazy"}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
              />
              <p className="type-label absolute left-4 top-4 text-white/85">{t.eyebrow}</p>
            </div>

            <div className="p-4">
              <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                {t.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t.line}</p>
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
