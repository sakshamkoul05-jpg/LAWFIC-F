# Compliance suite: what was added and how to switch it on

## Features

| # | Feature | Where |
|---|---|---|
| 1 | Personal compliance calendar (GST, TDS, advance tax, ITR, ROC, LLP, PF/ESI) | `/compliance` (signed in), rules in `lib/compliance/calendar.ts` |
| 2 | Renewal & expiry tracker (FSSAI, trademark, DSC, trade licence, Shop Act…) | `/compliance` → Licences & renewals |
| 3 | Free calendar for non-customers, no sign-up | `/tools/compliance-calendar` |
| 4 | Google / Apple / Outlook calendar sync (.ics feed, 7-day and 1-day alarms) | `/tools/compliance-calendar/ics?…` |
| 5 | Order tracker: expected completion date from the service turnaround | `/orders/[id]` |
| 6 | Document vault (private bucket, signed 60-second links, no Aadhaar) | `/vault` |
| 7 | WhatsApp reminders (7/3/1 days before) and order-status updates | `lib/whatsapp.ts`, `/api/compliance/reminders`, `app/admin/actions.ts` |
| 8 | Interactive "what we need from you" checklist | every `/services/[slug]` page |
| 9 | Eligibility checker: GST, FSSAI tier (2026 limits), Udyam, IEC, PT, PF/ESI | `/tools/eligibility` |
| 10 | Fee calculator: government fee, our fee, member discount, GST (only once GST-registered) | `/tools/fee-calculator` |
| 11 | Late fee & penalty calculator: GSTR-1/3B/9, ITR, TDS, ROC, LLP, DIR-3 KYC | `/tools/penalty-calculator` |
| 12 | Company / LLP / brand name checker + links to MCA and IP India search | `/tools/name-check` |
| 13 | GSTIN / PAN / TAN / CIN / LLPIN / Udyam checker (incl. GSTIN check digit) | `/tools/verify` |
| 14 | Business health score, with every deduction explained | `/compliance` |
| 15 | Book a 15-minute expert call, paid from the wallet via the normal quote flow | `/instant-help` |
| 16 | Hindi (and Spanish) labels for every new navigation item | `lib/i18n-hi.ts`, `lib/i18n-es.ts` |
| 17 | Multiple businesses per login, with a switcher | `/compliance/businesses` |

Also: `/tools` hub, `/request/[slug]` (request any catalogue service that has
no page yet), nav/footer/account links, sitemap entries.

## To switch it on

1. **Run the migration** `supabase/migrations/20261009080000_compliance_suite.sql`
   in the Supabase SQL editor. It is idempotent. It creates `businesses`,
   `compliance_filings`, `business_licences`, `vault_documents`,
   `compliance_reminders_sent` and the private `vault` bucket with owner-only
   policies. It relies on `public.is_staff()`, which already exists.
   Then run `supabase/migrations/20261009150000_compliance_fixes.sql`
   (adds the Director KYC renewal type).
2. **Set `CRON_SECRET`** in Vercel. `vercel.json` schedules the reminder run
   daily at 09:00 IST.
3. **WhatsApp (optional):** create two Utility templates in WhatsApp Manager
   (placeholders are in `lib/whatsapp.ts`) and set the `WHATSAPP_*` variables.
   Until then customers can opt in; nothing is sent and the dashboard says so.
4. **Expert call price:** quoted per request from the back office like any
   order. Decide the standard fee and quote it consistently.

## Facts to re-check when the law changes

Statutory numbers live in one file each, with the date they were checked:
`lib/compliance/calendar.ts` (due dates; add notified extensions to
`EXTENSIONS`), `lib/compliance/penalties.ts`, `lib/compliance/eligibility.ts`,
`lib/msme.ts`.
