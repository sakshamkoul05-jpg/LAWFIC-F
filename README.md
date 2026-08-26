# LAWFIC — frontend

Marketing and account frontend for LAWFIC, a private consultancy handling
business registrations, licences and compliance in India.

**Status: front-end preview.** Nothing is wired to a backend yet. The sign-in
screen sends no OTP and the wallet takes no payment — both say so on screen.

---

## Running it

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

```bash
npm run build     # production build
npm run lint      # eslint
npx tsc --noEmit  # typecheck
```

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind 4 |
| Motion | `motion` v12 |
| Fonts | Marcellus, IBM Plex Sans, IBM Plex Mono |

## Routes

| Route | What it is |
|---|---|
| `/` | Home — hero, services, how it works, wallet, jobs |
| `/about` | About us |
| `/services` | Service index with fees |
| `/services/[slug]` | Aadhaar, MSME/Udyam, GST, PAN — each with its signature animation |
| `/login` | Phone + OTP sign-in (UI only) |
| `/wallet` | Balance, top-up and statement (UI only) |
| `/jobs` | Sample jobs feed |

## Layout

```
app/                      routes
components/site/          header, footer, wordmark
components/motion/        the four signature animations
components/ui/            Reveal — scroll reveal wrapper
lib/services.ts           service content: fees, documents, steps, FAQs
```

Service copy lives in `lib/services.ts`, not in the page components. Adding a
service means adding an entry there, and a case in
`components/motion/ServiceVisual.tsx` if it gets its own animation.

## The animations

One per service, each teaching something true rather than decorating:

- **Aadhaar** — a specimen card flips front to back
- **GST** — the 15 characters of a GSTIN assemble, then decode segment by segment
- **PAN** — the 10 characters of a PAN decode, one group at a time
- **MSME** — an Udyam certificate unrolls and the seal stamps down last

All of them degrade completely under `prefers-reduced-motion: reduce`.

## Ground rules baked into the UI

These are not styling preferences — they are the constraints the business runs
under, and they are enforced in the markup:

1. **Specimen cards carry no Government of India emblem, no UIDAI logo, and no
   usable number format.** Masked digits, a SAMPLE watermark, LAWFIC's own
   palette. They are illustrations, not reproductions.
2. **Government fee and professional fee are always two separate lines.** Never
   one blended number, anywhere.
3. **The Aadhaar page states what LAWFIC does not do** — no authentication, no
   eKYC, no database access, no affiliation with UIDAI.
4. **The wallet is described as closed-loop everywhere it appears** — no
   transfers between users, no withdrawal to a bank.
5. **The jobs board is free**, and carries no payment rail.

## Not built yet

Supabase auth, the wallet ledger and Razorpay top-ups, service orders and the
admin console, and the real jobs feed.
