/**
 * Reading what Supabase Auth means, as opposed to what it says.
 *
 * A couple of its responses are deliberately misleading, for good reasons, and
 * getting them wrong produces bugs that look like infrastructure faults. This
 * file is where that knowledge lives, so it is stated once and tested rather
 * than rediscovered inside a component at midnight.
 */

/** The shape of the user object we care about; deliberately narrow. */
export type SignUpUserLike = {
  identities?: unknown;
  confirmation_sent_at?: string | null;
} | null;

/**
 * Did `signUp` quietly decline because the address is already registered?
 *
 * WHY THIS IS NOT OBVIOUS FROM THE RESPONSE
 *
 * Signing up with an existing email returns **200**, a plausible user object,
 * and a `confirmation_sent_at` timestamp — and sends no email at all. That is
 * intentional: an endpoint that answered "already registered" would let anyone
 * test a list of addresses and learn who has an account on this site.
 *
 * The only honest signal is `identities`. A genuinely new account comes back
 * with one identity; the decoy comes back with an empty array.
 * `confirmation_sent_at` is part of the decoy and means nothing here.
 *
 * WHAT IT COSTS TO GET WRONG
 *
 * Exactly what happened: the form checked for a session, found none, and told
 * the customer "we sent a code" for an email that was never sent. They waited,
 * tried again, got the same reassurance — while the mail provider's log showed
 * no send, because there was none. The bug is indistinguishable from broken
 * email from the outside, and it sends you looking at SMTP, DNS and templates.
 *
 * Absent or non-array identities are treated as NOT existing. Only an empty
 * array is the signal; anything else is either a real new account or a shape
 * we do not recognise, and guessing "already exists" from an unknown shape
 * would block a legitimate sign-up.
 */
export function signUpWasDeclinedAsDuplicate(user: SignUpUserLike): boolean {
  if (!user) return false;
  return Array.isArray(user.identities) && user.identities.length === 0;
}

/**
 * Does this `resend` error mean the address is already confirmed?
 *
 * Unlike the sign-up case, Supabase is plain about this one — there is nothing
 * to re-send, and saying so reveals nothing that the sign-in form does not.
 */
export function isAlreadyConfirmed(message: string): boolean {
  return /already\s+(been\s+)?(confirmed|registered)/i.test(message);
}
