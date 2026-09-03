# Wallet product photography

Twenty files, two per hide. Drop them in this folder with exactly these names —
`components/wallet/WalletPhoto.tsx` builds the paths from the `photo` field in
`lib/wallet-leather.ts`, so a misnamed file silently falls back to the drawn
wallet rather than erroring.

| Hide            | Closed                  | Open                  |
|-----------------|-------------------------|-----------------------|
| Midnight Black  | `midnight-closed.jpg`   | `midnight-open.jpg`   |
| Slate Grey      | `slate-closed.jpg`      | `slate-open.jpg`      |
| Suede Olive     | `olive-closed.jpg`      | `olive-open.jpg`      |
| Tan             | `tan-closed.jpg`        | `tan-open.jpg`        |
| Oxblood         | `oxblood-closed.jpg`    | `oxblood-open.jpg`    |
| Navy Blue       | `navy-closed.jpg`       | `navy-open.jpg`       |
| Cognac Brown    | `cognac-closed.jpg`     | `cognac-open.jpg`     |
| Forest Green    | `forest-closed.jpg`     | `forest-open.jpg`     |
| Concrete Grey   | `concrete-closed.jpg`   | `concrete-open.jpg`   |
| Dark Chocolate  | `chocolate-closed.jpg`  | `chocolate-open.jpg`  |

## What each file needs to be

- **3:2 landscape.** The frame is `aspect-ratio: 3/2` and the image is
  `object-cover`, so anything else gets cropped from the middle.
- **~2100px wide.** It displays at up to 1060 CSS px and must stay sharp on a
  2× screen. Bigger than that is wasted bytes; Next resizes down, never up.
- **The same crop for every hide.** The two states crossfade on click and the
  ten hides crossfade on selection. If the wallet sits in a different place
  between files it will visibly jump instead of dissolving — this is the one
  requirement that cannot be fixed in code.
- **JPEG in, AVIF/WebP out.** Next converts and serves modern formats
  automatically; do not pre-convert.

Missing or misnamed files are not fatal: WalletPhoto detects the failure on the
client and renders the drawn wallet for that hide instead, so the site keeps
working on a day when only half the range has been shot.
