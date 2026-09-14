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

## Email: sign-in codes go out through Resend

Auth mail is sent by **Supabase**, not by this app. That is worth saying first
because of what follows from it: the Resend API key belongs in the Supabase
dashboard and **nowhere in this repository** — not in `.env.local`, not in the
deployment's environment, not in `.env.example`. Nothing here imports it, and
there is no `RESEND_API_KEY` to add. One copy, in one place, revocable from one
screen.

Resend speaks SMTP, so it drops straight into the settings Supabase already
has. Authentication → Emails → SMTP Settings:

| Field | Value |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` (implicit TLS) — or `587` for STARTTLS |
| Username | `resend` — the literal word, not an address |
| Password | the Resend API key |
| Sender email | `no-reply@lawfic.pro` |
| Sender name | `LAWFIC` |

The username catches people out: every other SMTP provider wants the mailbox
address there, and Resend wants the fixed string `resend` with the API key as
the password.

### The domain has to be verified first

Resend will not send from `@lawfic.pro` until the domain is verified, and until
then it only delivers to the address that owns the Resend account — which looks
exactly like a working setup right up to the moment a real customer tries to
sign in. Add the domain in Resend → Domains and publish the records it shows
you. There are four:

- **MX** on `send.lawfic.pro` — the bounce path
- **TXT** on `send.lawfic.pro` — SPF
- **TXT** on `resend._domainkey.lawfic.pro` — DKIM
- **TXT** on `_dmarc.lawfic.pro` — DMARC, optional but do it anyway

Copy the values from Resend rather than from anywhere else; the DKIM key is
generated per domain. If the DNS for lawfic.pro is at Hostinger, they go in
Hostinger's DNS zone editor.

Do not skip DMARC. Without it, a receiving provider that dislikes something
about the message has no policy to fall back on, and the usual outcome is the
code landing in spam rather than bouncing — which is the failure mode you find
out about from a customer rather than from a log.

### The template has to carry the code

Supabase sends whatever the template says, and a link cannot be typed into a
six-digit box. `{{ .Token }}` must appear in **both**:

- **Magic link or OTP** — used when the address already has an account;
- **Confirm signup** — used the first time an address is seen, which is the
  one that gets missed, because it is the template a new customer meets.

Keep `{{ .ConfirmationURL }}` alongside it. The code and the link both work —
the link lands on `/auth/callback` — so whichever a customer reaches for, they
get in.

**Reset password stays link-only.** `/auth/reset` needs the link to establish a
session before it will show the new-password form; a code there would give
someone something to type with nowhere to type it.

### Redirect URLs

Authentication → URL Configuration. Site URL and Redirect URLs both need to
know about the new domain:

- `http://localhost:3000/**` (dev)
- `https://lawfic.pro/**` and `https://www.lawfic.pro/**`

Supabase falls back to the Site URL for anything not on that list, so a missing
entry does not error — it drops a successful sign-in on the home page, signed
out.

### Limits

Resend's free tier is 100 emails a day and 3,000 a month, which is a lot of
sign-ins at this stage and not a lot during a launch week. The sign-in form
already says so plainly when a send is refused rather than failing quietly, so
hitting the ceiling is visible; the fix is a paid plan, not a code change.

### When codes land in spam

Almost never the wording of the email. Almost always one of three DNS records,
and a mailbox provider that cannot verify who sent a message has exactly one
safe place to put it.

| Record | Where | What it does |
|---|---|---|
| SPF | `send.lawfic.pro` | says which servers may send — this is the one sign-in codes are checked against |
| DKIM | `resend._domainkey.lawfic.pro` | signs the message so it cannot be forged or altered |
| **DMARC** | `_dmarc.lawfic.pro` | tells a receiver what to do when the other two disagree |

**DMARC is the one that sends codes to spam by being absent.** Since February
2024 Gmail and Yahoo treat a missing DMARC record as a reason in itself, and it
is the only one of the three checked against the address a human actually sees
in the From line. Add a TXT record at `_dmarc`:

```
v=DMARC1; p=none; rua=mailto:dmarc@lawfic.pro
```

`p=none` only watches. It changes nothing about how mail is delivered, which is
exactly why it is where to start — a domain that jumps straight to `p=reject`
before knowing what sends on its behalf can cut off its own invoices. Leave it
a few weeks, read the reports, then move to `p=quarantine`.

There is a second, separate hole: **there is no SPF at the apex.** Sign-in codes
do not care — they authenticate through the `send.` subdomain — but mail a
person sends from Hostinger webmail goes out as the bare domain and is
unauthenticated. A domain can pass every automated test and still have every
hand-written message from the company treated as suspicious. Add a TXT record
at `@`:

```
v=spf1 include:_spf.mail.hostinger.com ~all
```

`npm run doctor` checks all four and says which are missing. Both records go in
at Hostinger under **Domains → DNS Zone**; add new records rather than editing
the existing ones, and give DNS an hour before re-testing.

Two things worth knowing so the result is not mistaken for a failure. A domain
with no sending history has no reputation, so the first days of mail are
treated cautiously whatever the records say — it settles. And a code already
sitting in your own spam folder stays there: the fix applies to new mail, so
test with a fresh address, and marking one "not spam" teaches that mailbox
faster than anything in DNS.

## Search engines: what they see, and where it comes from

Everything a crawler or a chat app reads is built from `lib/seo.ts`. The title,
the description, the share card, the sitemap, robots.txt and the structured
data all take their facts from that one file, so a change lands everywhere at
once instead of in four of the five places.

**One environment variable decides whether any of it works.**

```
NEXT_PUBLIC_SITE_URL=https://lawfic.pro
```

Open Graph tags and canonical URLs are only valid as absolute URLs — a relative
one is discarded without an error by everything that reads them. This variable
is what they are built from. It is the same variable the sign-in emails already
use, so setting it fixes both.

Unset, the site falls back to `localhost:3000`, and the fallback is deliberately
loud: `robots.txt` becomes `Disallow: /`, every page carries `noindex`, and the
sitemap is empty. A preview deployment cannot accidentally get itself indexed
and compete with the real site for its own content.

### www or bare — pick one, and make BOTH ends agree

`lawfic.pro` and `www.lawfic.pro` are two different sites to a search engine.
Exactly one of them is the real one, and two separate things have to name the
same one:

1. **The host** picks a primary domain and 308-redirects the other to it.
2. **This app** takes `NEXT_PUBLIC_SITE_URL` and writes it into every canonical
   tag, every `og:url`, every `<loc>` in the sitemap, and the `Sitemap:` line
   in `robots.txt`.

When those disagree, *nothing breaks*. Every page loads, every link works, and
the site looks perfect in a browser. What actually happens is invisible from
here:

- Search Console reports **"Couldn't fetch"** on the sitemap, because the URL
  submitted redirects to a different hostname.
- Every URL inside the sitemap is a redirect, so none of them get indexed.
- Each page carries a canonical pointing at a URL that redirects straight back
  to the page it was served from.

`npm run doctor` now makes one HTTP request to catch this — it fetches
`$NEXT_PUBLIC_SITE_URL/sitemap.xml` with redirects turned off and fails if the
answer is a redirect to another host. It is the only check in that script that
tests the deployment rather than the backend, and it is there because this
failure is found weeks later in a report rather than by looking at the site.

**If you change which domain is primary, change `NEXT_PUBLIC_SITE_URL` in the
same sitting** — and remember the same value is in the Supabase redirect
allow-list and in the sign-in email links.

### Making the logo appear in search

There are two different logos, doing two different jobs, and only one of them is
the favicon.

| Where | File | How it is declared |
|---|---|---|
| Beside a blue link in Google | `app/icon.png` (512×512) | Next emits `<link rel="icon">` from the filename |
| Browser tab | `app/favicon.ico` | already existed; Next serves it automatically |
| iOS home screen | `app/apple-icon.png` (180×180) | filename convention |
| Knowledge panel | `public/lawfic-logo-square.png` (600×600) | `logo` in the Organization JSON-LD |
| WhatsApp, LinkedIn, Slack, X | `app/opengraph-image.tsx` (1200×630) | drawn at build time |

The favicon and the apple icon are the **monogram only**, on the dark ground —
not the full badge. The badge is a ring, a wordmark, a ribbon and a row of
stars, and all four collapse into one gold smudge by the time the image is 16px
across. The stacked bars survive. They were lifted out of the source PNG by
flood fill rather than by cropping, because the mark's own corners sit further
from the centre than the ring's inner circle does — every rectangle tight enough
to miss the ring also cuts the bottom off the mark.

To regenerate them after a logo change, the source is `public/lawfic-logo.png`
and the recipe is in the commit that added them; `sharp` is already present as a
Next dependency.

Google decides for itself whether to show either image. What this does is make
the site eligible, which it was not before — there was nothing on the page
saying which of its many images was the company's mark.

### What is deliberately kept OUT of the index

- **The 21 "coming soon" placeholders** carry `comingSoonMetadata()`, which sets
  `noindex, follow`. Twenty-one pages of the same forty words is thin,
  near-duplicate content, and a site judged on the average of its pages should
  not offer twenty-one copies of "coming soon". **When one of them gets real
  content: delete the `comingSoonMetadata` call, write a real description, and
  add the route to `app/sitemap.ts`.** That is the whole checklist.
- **Personal pages** — wallet, cart, orders, profile, saved services — set
  `robots: PRIVATE_PAGE_ROBOTS` in their own metadata.
- **The back office, `/api` and `/auth`** are blocked in `robots.txt`.

Those last two are handled differently on purpose. `Disallow` in robots.txt
stops a crawler *fetching* a path; it does not remove it from an index, and a
page blocked there is a page whose `noindex` is never read — because reading it
needs the fetch that was just forbidden. So each private area is in exactly one
of the two places, never both.

None of this is access control. `robots.txt` is a public file that asks
politely. What protects customer data is RLS and the auth checks on each page.

### After the first deploy

0. Run `npm run doctor` against the deployed domain first. If it reports a
   hostname mismatch, fix that BEFORE submitting anything — a sitemap submitted
   at the wrong hostname comes back "Couldn't fetch" and has to be resubmitted.
1. Add the property in [Google Search Console](https://search.google.com/search-console)
   for **whichever hostname `NEXT_PUBLIC_SITE_URL` names**, and submit
   `<that host>/sitemap.xml`.
2. Check the Organization record with the
   [Rich Results Test](https://search.google.com/test/rich-results) — it is the
   only way to see what Google actually parsed.
3. Paste a link into WhatsApp to see the share card.
4. Fill in `lib/company.ts`. The legal name, address, CIN and support contact
   are required on the site anyway, and the moment they are set they are added
   to the Organization record automatically. The `reviewProfiles` list becomes
   `sameAs`, which is the strongest available signal tying this site to the
   company — worth adding the social profiles as soon as they exist.

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
6. **Verify lawfic.pro in Resend** — four DNS records, then sign-in codes
   reach real customers rather than only the account owner. Until it is
   verified, email sign-in works for you and silently fails for everybody else.
   *(Minutes to publish, up to a few hours to propagate.)*
7. **DLT registration** for mobile OTP — entity ID, sender header and templates
   on a DLT portal, or operators drop the SMS. Email sign-in works throughout
   and stays as the fallback. *(Several days.)*
8. **Memberships** need the Razorpay Subscriptions product enabled on the
   account and an e-mandate method live (UPI Autopay or cards). Until then
   `/api/subscription/checkout` returns 503 and says so; the plan pages, the
   pricing maths and the wallet card all work without it.

Independent of all of the above, and worth doing the day the domain resolves:
set `NEXT_PUBLIC_SITE_URL`, then submit the sitemap in Search Console. Indexing
has a lead time nothing in this repo can shorten — see the section above.

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
