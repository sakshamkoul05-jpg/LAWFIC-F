import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfilePhotos } from "@/lib/profile-photos.server";
import { PhotoStudio } from "@/components/profile/PhotoStudio";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";

/**
 * "Change Profile & Cover Pics" — the one row in the blueprint's Profile group
 * that had nothing behind it.
 *
 * Two studios on one page rather than two pages, because a customer who has
 * come here to sort out how their account looks is going to do both, and
 * sending them back to the hub in between is a step for nobody's benefit.
 */

export const metadata: Metadata = {
  title: "Profile & cover pictures",
  description: "Add or change the pictures on your LAWFIC account.",
  robots: PRIVATE_PAGE_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function ProfilePhotosPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <Shell>
        <p className="text-[14px] text-foreground">Your account is not connected yet.</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Photo storage needs the site&rsquo;s database. Nothing here will work until it is
          switched on.
        </p>
      </Shell>
    );
  }

  const { data: auth } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!auth?.user) redirect("/login?next=/profile/photos");

  const photos = await getProfilePhotos(supabase, auth.user.id);

  return (
    <Shell>
      <section className="rounded-2xl border border-border bg-surface px-5 py-7">
        <h2 className="type-label mb-1 text-subtle">Profile picture</h2>
        <p className="mb-6 text-[12.5px] leading-relaxed text-muted-foreground">
          Shown as a circle, so anything near the corners gets cut.
        </p>
        <PhotoStudio kind="avatar" initialUrl={photos.avatarUrl} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface px-5 py-7">
        <h2 className="type-label mb-1 text-subtle">Cover picture</h2>
        <p className="mb-6 text-[12.5px] leading-relaxed text-muted-foreground">
          The wide band across the top of your account. Landscape works best.
        </p>
        <PhotoStudio kind="cover" initialUrl={photos.coverUrl} />
      </section>

      {/* The honest account of what happens to the file, on the page where the
          file is chosen. Nobody reads a privacy policy at the moment they are
          uploading a photograph of their own face. */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border px-5 py-5">
        <ShieldCheck size={17} className="mt-0.5 shrink-0 text-subtle" aria-hidden />
        <div className="text-[12px] leading-relaxed text-muted-foreground">
          <p>
            Your pictures are private. LAWFIC has no public profiles, so nobody else can look
            you up or see them, and they are stored where only your own signed-in session can
            fetch them.
          </p>
          <p className="mt-2">
            Cropping happens on your device before anything is sent, which also strips the
            hidden data a phone writes into every photo &mdash; including where it was taken.
            Removing a picture deletes the file, not just the link to it.
          </p>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-5 py-12 sm:px-8">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft size={15} aria-hidden />
        Your account
      </Link>

      <header className="mb-8">
        <h1 className="type-h1 text-foreground">Profile &amp; cover pictures</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          Take one with your camera or choose one from your files, then drag to frame it.
        </p>
      </header>

      {children}
    </div>
  );
}
