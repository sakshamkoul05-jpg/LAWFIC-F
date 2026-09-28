import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * The wallet lock: what it protects, and what it would be worth without this
 * file.
 *
 * WHY THE UNLOCK IS SERVER-SIDE
 *
 * A lock screen that only hides a React component is theatre. The balance and
 * the statement come from the server, so anybody who can open the page can
 * also call the API that fed it, and the padlock is decoration over an open
 * door. So "unlocked" is a signed token this server issued and only this
 * server can verify, and the page reads it before it fetches anything worth
 * hiding.
 *
 * THE COOKIE IS SIGNED, NOT ENCRYPTED, AND THAT IS FINE
 *
 * It carries a user id and an expiry — neither secret, both already known to
 * whoever holds the session. What must not be possible is FORGING one, and an
 * HMAC over a server-held secret is exactly that. It is httpOnly so script on
 * the page cannot read it, sameSite=strict so another site cannot cause it to
 * be sent, and short-lived so a borrowed laptop stops being unlocked quickly.
 *
 * IT IS BOUND TO THE USER
 *
 * The token names the account it unlocked. Signing out and back in as somebody
 * else does not inherit it, because the id inside will not match.
 *
 * NO SECRET, NO LOCK
 *
 * If WALLET_LOCK_SECRET is unset the lock is unavailable and says so, rather
 * than falling back to an empty key and pretending. A lock whose secret is ""
 * is a lock every visitor already has the key to, and the failure is invisible.
 */

const COOKIE = "lawfic_wallet_unlock";

/** Ten minutes. Long enough to add money and read a statement; not a session. */
export const UNLOCK_TTL_SECONDS = 600;

function secret(): string | null {
  const s = process.env.WALLET_LOCK_SECRET;
  return s && s.length >= 32 ? s : null;
}

/** Whether the lock can work at all on this deployment. */
export function lockConfigured(): boolean {
  return secret() !== null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

/* ══════════════════════════════════════════════════════════════════════════
   THE TOKEN FORMAT — pure, so it can be tested
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Mint and check are kept free of cookies() and headers() deliberately.
 *
 * This pair is the whole security boundary: everything else in this file is
 * plumbing that decides where the string is put. Entangled with the request,
 * it could only be tested by standing up a server and holding a session —
 * which in practice means it would not be tested, and an HMAC check nobody has
 * tried to break is a guess.
 */
export function mintToken(userId: string, expiresAt: number, key: string): string {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload, key)}`;
}

export function checkToken(
  raw: string | undefined | null,
  userId: string,
  key: string,
  now = Date.now(),
): boolean {
  if (!raw) return false;

  const cut = raw.lastIndexOf(".");
  if (cut < 1) return false;

  const payload = raw.slice(0, cut);
  const given = raw.slice(cut + 1);
  const wanted = sign(payload, key);

  /* Constant time. A byte-by-byte compare on an HMAC leaks, through timing,
     how much of a forged signature was right — which is enough to build the
     rest of it one byte at a time. */
  const a = Buffer.from(given);
  const b = Buffer.from(wanted);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  /* Split at the LAST dot, not the first. The expiry is a millisecond integer
     and can never contain one, so everything before it is the id — which keeps
     an id that does contain a dot working, and keeps the split unambiguous
     either way. Splitting at the first dot instead silently mis-parses such an
     id and refuses its own owner; splitting naively on every dot would let
     `a.b` and `a` + `b` collide, and one account could present as another.
     Supabase ids are uuids today. A check that only holds while that stays
     true is not a check. */
  const dot = payload.lastIndexOf(".");
  if (dot < 1) return false;
  const owner = payload.slice(0, dot);
  const expires = Number(payload.slice(dot + 1));

  if (owner !== userId) return false;
  return Number.isFinite(expires) && expires > now;
}

/**
 * The relying party.
 *
 * WebAuthn binds a credential to a DOMAIN. Verifying against the wrong one is
 * how a credential registered on the real site gets accepted from somewhere
 * else, so both are derived from the request rather than configured — a
 * hard-coded rpID that disagrees with the host silently refuses every
 * credential on preview deployments, and a configured origin that drifts is
 * worse than that.
 */
export async function relyingParty(): Promise<{ rpID: string; origin: string }> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { rpID: host.split(":")[0]!, origin: `${proto}://${host}` };
}

/* ══════════════════════════════════════════════════════════════════════════
   THE CHALLENGE
   ══════════════════════════════════════════════════════════════════════════ */

const CHALLENGE_COOKIE = "lawfic_wallet_challenge";

/**
 * A challenge must be unpredictable, single-use, and the server's own.
 *
 * Kept in an httpOnly cookie rather than a table: it lives for one round trip,
 * it is already bound to the browser making the request, and a table would mean
 * a row written and deleted on every tap of the unlock button.
 */
export async function issueChallenge(): Promise<string> {
  const challenge = randomBytes(32).toString("base64url");
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 300,
  });
  return challenge;
}

/** Reads and immediately burns it. A replayed challenge is not a challenge. */
export async function takeChallenge(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(CHALLENGE_COOKIE)?.value ?? null;
  jar.delete(CHALLENGE_COOKIE);
  return value;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE UNLOCK TOKEN
   ══════════════════════════════════════════════════════════════════════════ */

export async function grantUnlock(userId: string): Promise<boolean> {
  const key = secret();
  if (!key) return false;

  const jar = await cookies();

  jar.set(COOKIE, mintToken(userId, Date.now() + UNLOCK_TTL_SECONDS * 1000, key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: UNLOCK_TTL_SECONDS,
  });
  return true;
}

export async function revokeUnlock(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Is this user's wallet unlocked right now?
 *
 * Every failure is the same answer — false — and none of them say why. A lock
 * that distinguishes "no token" from "expired" from "bad signature" is a lock
 * that helps somebody work out which part they got wrong.
 */
export async function isUnlocked(userId: string): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  return checkToken((await cookies()).get(COOKIE)?.value, userId, key);
}
