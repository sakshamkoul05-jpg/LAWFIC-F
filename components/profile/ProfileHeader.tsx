import Link from "next/link";
import { Camera, User } from "lucide-react";

/**
 * The top of the account page: the cover band, the picture, the greeting.
 *
 * "Hi <name> / Welcome to the LAWFIC family" is the client's own line from the
 * blueprint, and it sits where they put it — under the customer's own face.
 *
 * WHEN THERE IS NO PICTURE
 *
 * The band and the circle are still drawn, in the surface colour, with a camera
 * badge on the circle that links to the studio. An empty state that quietly
 * omits the whole header teaches nobody that a picture can be added; one that
 * shows the shape of the thing with an obvious way to fill it teaches everybody.
 *
 * A generated pattern was the other option — the site already has DiceBear for
 * the wallet avatar. It is deliberately not used here: a generated face in the
 * place a real one goes looks, at a glance, like the account already has a
 * photo, and the customer never goes looking for the button.
 */
export function ProfileHeader({
  fullName,
  avatarUrl,
  coverUrl,
  signedIn,
}: {
  fullName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  signedIn: boolean;
}) {
  return (
    <header className="mb-10">
      {/* ── the cover ── */}
      <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-border bg-surface-2 sm:h-36">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a signed URL that
          // expires; the image optimizer would cache it past its own lifetime.
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            aria-hidden
            className="h-full w-full bg-[linear-gradient(135deg,var(--surface-2),var(--surface-3))]"
          />
        )}

        {signedIn && (
          <Link
            href="/profile/photos"
            aria-label={coverUrl ? "Change your cover picture" : "Add a cover picture"}
            className="absolute bottom-3 right-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 text-[12px] font-medium text-foreground backdrop-blur transition-colors hover:bg-background"
          >
            <Camera size={13} aria-hidden />
            {coverUrl ? "Change cover" : "Add cover"}
          </Link>
        )}
      </div>

      {/* ── the picture, overlapping the band ── */}
      <div className="-mt-10 flex items-end gap-4 px-1 sm:-mt-12">
        <div className="relative shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-surface-2 sm:h-24 sm:w-24">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- as above.
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <User size={26} className="text-subtle" aria-hidden />
              </div>
            )}
          </div>

          {signedIn && (
            <Link
              href="/profile/photos"
              aria-label={avatarUrl ? "Change your profile picture" : "Add a profile picture"}
              className="absolute -bottom-0.5 -right-0.5 grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary text-background transition-colors hover:bg-primary-hover"
            >
              <Camera size={14} aria-hidden />
            </Link>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-1">
          <h1 className="type-h1 truncate text-foreground">
            {fullName ? `Hi ${fullName}` : "Your account"}
          </h1>
        </div>
      </div>

      <p className="mt-3 px-1 text-[14px] text-muted-foreground">
        Welcome to the LAWFIC family.
      </p>
    </header>
  );
}
