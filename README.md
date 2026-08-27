# LAWFIC

Registrations, licences and compliance for Indian businesses — a marketing site,
a signed-in account area, and a closed-loop prepaid wallet.

The database and the Razorpay webhook live in **[LAWFIC-B](https://github.com/sakshamkoul05-jpg/LAWFIC-B)**.
Run its migrations before this app will do anything past the signed-out state.

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
| `npm test` | Unit tests — money handling, catalogue and Razorpay config (23) |
| `npm run doctor` | Checks this app is actually wired to a live backend |
| `npx tsc --noEmit` | Typecheck |

Schema and webhook tests live in the backend repo (`npm test` there — 52 checks).

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
| `/auth/callback` `/auth/signout` | Session handling |

The webhook is **not** here. It is a Supabase Edge Function in the backend repo:
it has no user session, is authenticated by an HMAC rather than a cookie, and
needs a public URL that exists before this app is deployed. These two routes
stay because they read the session cookie.

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

## Connecting to the backend

```bash
# in the backend repo (LAWFIC-B)
npx supabase login                                 # opens a browser, once
npm run deploy -- --project-ref YOUR-PROJECT-REF

# back here
cp .env.example .env.local                         # paste the three keys
npm run doctor
```

`npm run doctor` talks to the real project over HTTP and asserts what matters:
that the migrations ran, that an anonymous visitor **cannot** read or write the
wallet ledger, that the webhook function is deployed with `verify_jwt` off and
its HMAC check working, and that no secret has been given a `NEXT_PUBLIC_`
prefix.

Those RLS checks are the reason it exists. The backend's test suite runs on
PGlite as superuser, which **bypasses row security** — it can prove the policies
parse but never that they grant correctly. Only a real round trip through
PostgREST can, and that is what `doctor` is.

## Going live

In order, because two of these have external lead times:

1. **Supabase project** — create it, then from the backend repo run
   `npm run deploy -- --project-ref YOUR-REF`. Add the three keys here and run
   `npm run doctor`. Auth and the wallet come online. *(Same day.)*
2. **Razorpay test keys** — issued on signup, before KYC. Add them and the whole
   top-up flow works end to end with test cards. The wallet shows a "Test mode"
   badge. *(Same day.)*
3. **Razorpay webhook** — deploy it from the backend repo
   (`npx supabase functions deploy razorpay-webhook`) and point Razorpay at
   `https://YOUR-PROJECT-REF.supabase.co/functions/v1/razorpay-webhook`.
   Without this, payments succeed and balances never move. This step does not
   need this app deployed anywhere.
4. **Legal pages live on the domain** — Terms, Privacy, Refunds, Wallet Terms.
   Razorpay activation requires them. *(Blocks go-live, not development.)*
5. **Razorpay KYC** — needs the entity, GST registration and current account.
   Swap test keys for live ones. *(3–7 days.)*
6. **DLT registration** for mobile OTP — entity ID, sender header and templates
   on a DLT portal, or operators drop the SMS. Email sign-in works throughout
   and stays as the fallback. *(Several days.)*

Before real money moves, work through the live checklist in the backend repo's
README — no test suite can prove RLS.

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
