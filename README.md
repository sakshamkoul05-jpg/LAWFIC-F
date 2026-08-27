# LAWFIC

Registrations, licences and compliance for Indian businesses — a marketing site,
a signed-in account area, and a closed-loop prepaid wallet.

**Status: wired, awaiting credentials.** Auth, the wallet ledger and Razorpay
top-ups are implemented and tested. With no keys set the site runs signed-out
and says so; add the keys and it comes online. See [Going live](#going-live).

---

## Running it

```bash
npm install
cp .env.example .env.local   # then fill it in — see supabase/README.md
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests — money handling and webhook signatures (17) |
| `npm run test:db` | Applies the real schema to an in-process Postgres and attacks it (44) |
| `npm run db:build` | Regenerates `supabase/setup.sql` from the migrations |
| `npx tsc --noEmit` | Typecheck |

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind 4 |
| Motion | `motion` v13 |
| Data & auth | Supabase — Postgres, Auth, RLS |
| Payments | Razorpay (RBI-authorised payment aggregator) |
| Validation | Zod 4 |
| DB tests | PGlite, in-process, no Docker |

## Routes

| Route | |
|---|---|
| `/` `/about` `/services` `/services/[slug]` `/jobs` | Static. Marketing and service content |
| `/login` | Email magic link, or mobile OTP |
| `/wallet` | Balance, top-up and statement. Signed-in only |
| `/orders` `/orders/[id]` | Your filings, with a status timeline and pay-from-wallet |
| `/admin` | Back office. Staff only — quote, advance, close and refund |
| `/api/wallet/topup` | Creates a Razorpay order and records an intent |
| `/api/wallet/balance` | The signed-in user's balance, for post-payment polling |
| `/api/razorpay/webhook` | The only thing that may credit a wallet |
| `/auth/callback` `/auth/signout` | Session handling |

## Layout

```
app/                    routes and API handlers
components/site/        header, footer, wordmark, account chip
components/motion/      the four signature service animations
components/ui/          Reveal — scroll reveal wrapper
lib/services.ts         service copy: fees, documents, steps, FAQs
lib/money.ts            paise ↔ rupees, formatting, amount validation
lib/razorpay.ts         order creation and signature verification
lib/supabase/           client / server / admin clients
supabase/migrations/    the schema, one file per change
supabase/setup.sql      generated — paste into a fresh Supabase project
```

## How the wallet works

**It is a closed prepaid ledger, not a payment instrument.** Money enters only
from a verified Razorpay webhook and leaves only as payment for LAWFIC's own
services. There is no transfer between users and no withdrawal to a bank. That
is what keeps it inside the closed-system PPI exemption — a schema permitting
user-to-user movement would put the business inside RBI authorisation whether
or not the UI exposed it.

**Top-up.** The user picks an amount → the server creates a Razorpay order and
records a `payment_intents` row → Checkout runs in the browser → Razorpay POSTs
the webhook → the handler verifies the HMAC over the **raw** body, and only then
writes a credit keyed by the Razorpay payment id. The browser polls
`/api/wallet/balance` and never asserts a balance of its own.

**The ledger is append-only.** No UPDATE, no DELETE — enforced by triggers *and*
revoked grants. A correction is a new reversing entry. Each row stores the
balance it produced, computed under a per-user advisory lock, so the current
balance is the newest row's value: derived from the ledger, immutable, O(1).

**An overdraft is impossible at the database level.** The balance check lives in
a trigger, not in application code — which matters because the webhook runs with
the service role and bypasses RLS.

Money is **paise, always, as `bigint`**. No float goes near a balance.

## Ground rules baked into the code

Not styling preferences — the constraints the business runs under:

1. **No client role may ever write to `wallet_entries`.** Credits come from the
   webhook (service role, after an HMAC check); debits come from a
   security-definer function that validates the order first.
2. **The wallet never pays out.** No withdrawal, no user-to-user transfer, no
   third-party payment — including employers on the jobs board.
3. **Government fee and professional fee are separate columns and separate
   ledger entries.** The database will not store one blended figure.
4. **Specimen cards carry no Government of India emblem, no UIDAI logo, and no
   usable number format.** They are illustrations, not reproductions.
5. **The Aadhaar page states what LAWFIC does not do** — no authentication, no
   eKYC, no database access, no affiliation with UIDAI.
6. **The jobs board is free** and carries no payment rail.
7. **Motion never runs during a payment decision.** The top-up animation plays
   only after money is confirmed in the ledger, and not at all under
   `prefers-reduced-motion`.

## Going live

In order, because two of these have external lead times:

1. **Supabase project** — create it, run `supabase/setup.sql`, add the three
   keys. Auth and the wallet come online. *(Same day.)*
2. **Razorpay test keys** — issued on signup, before KYC. Add them and the whole
   top-up flow works end to end with test cards. The wallet shows a "Test mode"
   badge. *(Same day.)*
3. **Razorpay webhook** — point it at `/api/razorpay/webhook`, subscribe to
   `payment.captured` and `payment.failed`, set the secret. Without this,
   payments succeed and balances never move.
4. **Legal pages live on the domain** — Terms, Privacy, Refunds, Wallet Terms.
   Razorpay activation requires them. *(Blocks go-live, not development.)*
5. **Razorpay KYC** — needs the entity, GST registration and current account.
   Swap test keys for live ones. *(3–7 days.)*
6. **DLT registration** for mobile OTP — entity ID, sender header and templates
   on a DLT portal, or operators drop the SMS. Email sign-in works throughout
   and stays as the fallback. *(Several days.)*

Before real money moves, work through the live checklist in
`supabase/README.md` — the PGlite suite cannot prove RLS.

## The order flow

A filing is a **request, then a quote, then payment** — not a checkout.
Government fees move with state, turnover and category, so a fixed price behind
a button means either overcharging some customers or absorbing losses on others.

```
submitted ──quote_order──▶ quoted ──pay_order_from_wallet──▶ paid
                                                              │
                                              advance_order   ▼
                                                        in_progress
                                                              │
                                                              ▼
                                                          completed

  reject_order (from any live state) ──▶ rejected, with every rupee
                                          credited back in the same
                                          transaction
```

Every transition is a security-definer function that re-checks who is calling.
There is **no UPDATE policy on `service_orders` for anyone** — not customers,
not staff — so a transition cannot be forged by a hand-crafted request. A
customer cannot quote their own order, pay someone else's, or pay one twice.

Staff membership is a row in `public.staff`, added by hand in the SQL editor.
There is deliberately no UI for granting it.

## Not built yet

Document upload, the real jobs feed, and email/WhatsApp notification on status
change.
