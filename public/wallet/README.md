# Wallet imagery

The wallet renders in one of three ways, each falling back to the next when its
files are absent. You can ship any tier; the site works on a day when only part
of the range has been shot, which is most days.

| Tier | Needs | Gives you |
|---|---|---|
| **1. Frame sequence** | 12 frames per hide | Zip pulls open, wallet unfolds, drag-scrubbable |
| **2. Two-state photo** | 2 stills per hide | Crossfade between closed and open |
| **3. Drawn wallet** | nothing | The CSS/SVG wallet already in the tree |

---

## Tier 1 — the frame sequence (preferred)

`public/wallet/<hide>/01.jpg` … `12.jpg`

One folder per hide, twelve frames, numbered with a leading zero. The sequence
is **one continuous timeline** from shut to open-with-money:

| # | Frame |
|---|---|
| 01 | Closed, zipped |
| 02 | Zip pull engaged |
| 03 | Zipper moving |
| 04 | Zipper almost open |
| 05 | Zip fully open |
| 06 | Hold and lift |
| 07 | Pull apart slightly |
| 08 | Left side opens |
| 09 | Right side opens |
| 10 | Mostly open |
| 11 | Fully open |
| 12 | Open, notes visible in the compartment |

Folder names, one per hide:

```
midnight  slate  olive  tan  oxblood
navy      cognac forest concrete chocolate
```

So Midnight Black is `public/wallet/midnight/01.jpg` through `12.jpg`.
That is **120 files** for the full range.

### Requirements

- **3:2 landscape**, `object-cover`. Anything else crops from the middle.
- **~1400px wide.** These are served as-is, not resized by Next — see below.
- **Pre-compressed.** Export as JPEG at quality ~80, or WebP. Aim for under
  120KB a frame: one hide is twelve frames, and that is what a visitor
  downloads when they pick it.
- **Identical crop across all twelve, and across all ten hides.** This is the
  one requirement that cannot be fixed in code. The frames are stacked and
  cross-faded in place, so if the wallet moves between frames the sequence
  judders instead of animating, and if it moves between hides the swatch
  switch jumps.

### Why these are not run through `next/image`

On-demand optimisation means 120 optimiser round trips the first time each
frame is seen, and on Vercel, 120 billable transformations. The frames are
known ahead of time and identical for every visitor, so they are pre-compressed
and served straight from `/public`. The tier-2 stills below *do* use
`next/image`, where on-demand sizing earns its keep.

### Loading behaviour

Only the selected hide's twelve frames are ever fetched — eagerly loading all
ten sequences would be most of a phone's data allowance. The wallet stays a
still image until all twelve have decoded; a tap before then jumps straight to
open. Slower to become interactive, never a half-loaded stutter.

---

## Tier 2 — two-state stills

`public/wallet/<hide>-closed.jpg` and `public/wallet/<hide>-open.jpg`

Twenty files, same hide names. Used automatically when a hide has no frame
folder. Same 3:2 crop; ~2100px wide is right here, since these *are* resized by
Next.

---

## What no imagery can give back

The wallets are embossed LAWFIC in the leather, so a customer's own name cannot
appear on one — you cannot stamp a photograph. `nameplate` is still stored and
still editable; it is simply not shown on the photographic tiers. Only the drawn
wallet renders it.
