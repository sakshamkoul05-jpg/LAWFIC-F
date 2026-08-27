# Database

## What is proven, and what is not

`npm run test:db` applies the real `setup.sql` to a Postgres 16 (PGlite,
in-process — no Docker, no cloud) and attacks it: **30 checks** covering the
balance trigger, the overdraft guard, append-only enforcement, idempotency, the
order guard, and every failure path of `pay_order_from_wallet`.

So the schema definitely applies, and these guarantees definitely bite:

- a debit larger than the balance is refused, and leaves no trace
- a replayed webhook cannot credit twice
- a ledger row cannot be updated or deleted
- `balance_after_paise` cannot be forged by the caller
- a user cannot quote their own order, pay someone else's, or pay one twice
- government fee and professional fee are debited as two separate entries

**The RLS policies are not covered by that.** PGlite runs everything as
superuser, and superusers bypass row security — so the policies are proven to
*parse*, not to grant the right things to the right roles. Nor has any request
made a real HTTP round trip through PostgREST and Supabase Auth. Those need a
live project; there is a checklist at the bottom of this file.

## Setting up a fresh project

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → paste the whole of `supabase/setup.sql` → Run. Once.
3. Project Settings → API → copy the URL, the anon key and the service role key
   into `.env.local` (see `.env.example`).
4. Authentication → Providers → enable **Email**. Turn on "Confirm email" if you
   want, but magic links work either way.
5. Authentication → URL Configuration → add `http://localhost:3000/auth/callback`
   and your production callback to the redirect allow-list. Without this, magic
   links bounce.

Phone OTP needs one more thing: an SMS provider (MSG91) **and** TRAI DLT
registration for the entity ID, sender header and template. Operators drop
unregistered messages before they reach the provider, so budget several days.
Email sign-in works immediately and is the fallback channel afterwards.

## Changing the schema

Edit or add a file in `migrations/`, then:

```bash
npm run db:build   # regenerates setup.sql
npm run test:db    # re-runs the checks
```

Never edit `setup.sql` by hand — it is generated.

`setup.sql` is **not re-runnable**: everything is created without guards, so a
second run fails with "already exists". On a project with no data you care
about, reset with `drop schema public cascade; create schema public;` then
re-grant usage to `anon, authenticated, service_role`. Never run that against a
database holding real balances.

## Live checks, before real money

Do these once against the real project. The PGlite suite cannot.

- [ ] Sign in as user A. In the SQL editor, note A's `auth.users.id`.
- [ ] As A, in the browser console:
      `await supabase.from('wallet_entries').insert({...})` → **must fail.**
      An `authenticated` role that can insert here can mint balance.
- [ ] As A, try to read user B's entries by id → **must return nothing.**
- [ ] As A, `update` your own `service_orders` row to `status='paid'` →
      **must fail** (there is no update policy).
- [ ] Call `/api/wallet/topup` while signed out → **401.**
- [ ] POST a body to `/api/razorpay/webhook` with a wrong signature → **401**,
      and no ledger row appears.
- [ ] Do a real ₹1 test-mode top-up. Confirm: one `payment_intents` row moves to
      `paid`, exactly one `wallet_entries` credit appears, and the balance moves.
- [ ] Replay that same webhook delivery from the Razorpay dashboard → the
      balance must **not** move again.
- [ ] Quote an order for more than the balance and try to pay it → refused, and
      the order stays `quoted`.
