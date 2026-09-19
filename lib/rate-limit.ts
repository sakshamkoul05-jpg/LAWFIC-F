/**
 * A small in-process rate limiter.
 *
 * WHY THIS EXISTS AT ALL
 *
 * /api/panda spends real money on every call. It is a public endpoint with no
 * sign-in in front of it, which is what the client asked for, and that means
 * the bill is bounded only by whatever we bound it with. An unlimited public
 * LLM endpoint is a way to have somebody else empty your account overnight.
 *
 * WHAT IT DOES NOT DO — READ THIS BEFORE TRUSTING IT
 *
 * The counters live in this process's memory. On Vercel that means PER LAMBDA
 * INSTANCE: a burst spread across several cold starts gets several buckets,
 * and a deploy or a scale-to-zero resets everything. So this stops a single
 * impatient visitor and a naive script; it does not stop a determined attacker
 * with a few IPs.
 *
 * The durable version is a Postgres counter keyed by IP and minute, written
 * with the service role. That needs a migration and a round trip per message,
 * so it is deliberately not here yet — but it is what "production-hardened"
 * would mean, and the ceiling below is the thing standing in for it. Between
 * that ceiling and the per-request max_tokens cap, the worst case is bounded
 * in dollars per instance rather than unbounded.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Cheap sweep so a long-lived instance does not accumulate dead keys. */
function sweep(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateVerdict = { ok: true } | { ok: false; retryAfterSeconds: number };

export function takeToken(opts: {
  key: string;
  /** How many requests are allowed inside the window. */
  limit: number;
  windowSeconds: number;
}): RateVerdict {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(opts.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowSeconds * 1000 });
    return { ok: true };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true };
}

/**
 * Best-effort client address.
 *
 * x-forwarded-for is trivially spoofed in general, but on Vercel the platform
 * sets it and the app is not reachable except through it, so the FIRST entry is
 * the real client. Taking the first rather than the last matters: the last is
 * whatever the caller appended.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}
