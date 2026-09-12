"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPaise } from "@/lib/money";
import {
  cancellation,
  isEntitled,
  membershipFor,
  paidPlans,
  priceFor,
  type Subscription,
} from "@/lib/subscription";

/**
 * The membership, on the wallet page.
 *
 * IT BELONGS HERE AND NOT ONLY ON A PRICING PAGE
 *
 * A subscription is a recurring debit, and the wallet is where this site
 * explains every rupee that moves. Putting the renewal date anywhere else
 * means the one page a customer opens to ask "what is being taken from me and
 * when" is the one page that does not say.
 *
 * WHAT A SUBSCRIBER SEES FIRST IS THE NEXT DEBIT
 *
 * Not the benefits — those are on the pricing page and they already agreed to
 * them. The thing a member needs from this card is the date and the amount, so
 * that is the line set large. The CCPA's dark-pattern guidelines require the
 * renewal amount and frequency to be disclosed, and a disclosure a customer
 * has to hunt for is the pattern rather than the remedy.
 *
 * CANCELLING IS ONE TAP FROM HERE
 *
 * Also not a courtesy. "Subscription trap" — easy to join, hard to leave — is
 * one of the thirteen named dark patterns, so the way out sits on the same card
 * as the renewal date, with no intermediate offer, no retention screen and
 * nobody to telephone. It asks once for confirmation, because cancelling by
 * mis-tap is its own kind of bad.
 */

type State =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "member"; sub: Subscription }
  | { kind: "off" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MembershipCard() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { subscription: Subscription | null }) => {
        if (!alive) return;
        setState(body.subscription ? { kind: "member", sub: body.subscription } : { kind: "none" });
      })
      .catch(() => alive && setState({ kind: "off" }));
    return () => {
      alive = false;
    };
  }, []);

  async function cancel() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      if (!res.ok) {
        setError("We could not cancel that just now. Try again, or contact us.");
        return;
      }
      const body = (await res.json()) as { subscription: Subscription | null };
      setState(body.subscription ? { kind: "member", sub: body.subscription } : { kind: "none" });
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  /* Nothing at all when the backend has no opinion — a card that says
     "could not load your membership" on a page about money is alarming out of
     proportion to what it means. */
  if (state.kind === "loading" || state.kind === "off") return null;

  if (state.kind === "none") return <Offer />;

  const { sub } = state;
  const plan = paidPlans().find((p) => p.id === sub.planId);
  const member = membershipFor(sub.planId);
  if (!plan || !member) return null;

  const price = priceFor(plan.monthlyPaise, sub.period);
  const leaving = sub.status === "cancelling";
  const late = sub.status === "past_due";

  return (
    <section aria-labelledby="membership-heading" className="cred-slab p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="cred-label">Membership</p>
          <h2 id="membership-heading" className="mt-2 text-[19px] font-semibold text-foreground">
            {plan.name}
          </h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            late
              ? "bg-destructive/15 text-destructive"
              : leaving
                ? "bg-surface-3 text-muted-foreground"
                : "bg-success/15 text-success"
          }`}
        >
          {late ? "Payment failed" : leaving ? "Ending" : "Active"}
        </span>
      </div>

      {/* THE NUMBER AND THE DATE, TOGETHER AND LARGE.
          A renewal disclosed as "renews monthly" somewhere in a paragraph is
          not disclosed. The amount is the one that will actually be debited —
          fee plus GST — because that is what appears on the statement. */}
      <p className="mt-5 text-[13.5px] leading-relaxed text-muted-foreground">
        {late ? (
          <>
            Your last renewal did not go through. Your benefits are paused until
            it clears — nothing has been cancelled.
          </>
        ) : leaving ? (
          <>
            Ends on <span className="text-foreground">{formatDate(sub.currentPeriodEnd)}</span>.
            Your benefits stay on until then and you will not be charged again.
          </>
        ) : (
          <>
            Renews on <span className="text-foreground">{formatDate(sub.currentPeriodEnd)}</span>{" "}
            for <span className="type-data text-foreground">{formatPaise(price.totalPaise)}</span>{" "}
            ({formatPaise(price.feePaise)} + {formatPaise(price.gstPaise)} GST)
            {sub.period === "monthly" ? ", then every month" : ", then every year"}.
          </>
        )}
      </p>

      <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-border pt-5 sm:grid-cols-2">
        <div>
          <dt className="cred-label">Off every service</dt>
          <dd className="type-data mt-1 text-[15px] text-foreground">
            {member.discountPercent}%
          </dd>
        </div>
        <div>
          <dt className="cred-label">Included each month</dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-foreground">
            {member.includedMonthly.map((i) => i.label).join(", ")}
          </dd>
        </div>
      </dl>

      {isEntitled(sub) && !leaving && (
        <div className="mt-6 border-t border-border pt-5">
          {confirming ? (
            <>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Cancel your membership? You keep {plan.name} until{" "}
                {formatDate(sub.currentPeriodEnd)}, and filings already in progress
                are finished either way.
              </p>
              {error && (
                <p role="alert" className="mt-3 text-[12.5px] text-destructive">
                  {error}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={busy}
                  className="rounded-full bg-surface-3 px-5 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-60"
                >
                  {busy ? "Cancelling…" : "Yes, cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-full px-5 py-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Keep it
                </button>
              </div>
            </>
          ) : (
            /* One tap to start, one to confirm, and no offer in between. */
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-[12.5px] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Cancel membership
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** For somebody who is not a member: the case, briefly, and the terms. */
function Offer() {
  const cheapest = paidPlans()[0];
  if (!cheapest) return null;
  const member = membershipFor(cheapest.id);
  const price = priceFor(cheapest.monthlyPaise, "monthly");

  return (
    <section aria-labelledby="membership-offer" className="cred-slab p-6 sm:p-7">
      <p className="cred-label">Membership</p>
      <h2 id="membership-offer" className="mt-2 text-[19px] font-semibold text-foreground">
        {member?.discountPercent}% off every filing
      </h2>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
        From {formatPaise(price.totalPaise)} a month including GST, with your GST
        returns already covered. Cancel in one tap whenever you like.
      </p>
      <Link
        href="/pricing"
        className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-[12.5px] font-medium text-background transition-colors hover:bg-primary-hover"
      >
        See what is included
      </Link>
      <p className="mt-4 text-[11.5px] leading-relaxed text-subtle">
        {cancellation.points[0]}
      </p>
    </section>
  );
}
