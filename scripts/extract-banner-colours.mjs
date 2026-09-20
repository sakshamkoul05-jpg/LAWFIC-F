import { readdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

/**
 * Read the dominant colour out of every banner photograph and write it to
 * lib/banner-colours.ts, so the two navigation bars can take their colour from
 * whichever flyer is on screen.
 *
 * WHY AT BUILD TIME AND NOT IN THE BROWSER
 *
 * The alternative is drawing each photo to a canvas on load and averaging it
 * there: eleven decodes, eleven canvas reads, on the main thread, before the
 * first bar can be coloured — and a visible flash of the wrong colour while it
 * happens. The pictures do not change between deploys, so the answer does not
 * either. This runs once, by hand, and commits its result.
 *
 * WHY NOT sharp's OWN `dominant`
 *
 * Tried first, and it is the wrong tool here: it bins colours coarsely and
 * returns the biggest bin, which for a photograph is almost always the near-
 * black of the shadows or the near-white of a wall. Seven of the nine pictures
 * came back as "grey", including ones that are obviously warm.
 *
 * What replaces it is a hue histogram. Every pixel that is too dark, too pale
 * or too grey to carry a colour is thrown away, and the rest vote for their
 * hue weighted by how colourful they are. That finds the orange of a desk lamp
 * in a brown office, which is the colour a person would actually name.
 *
 * Only the HUE is taken. Lightness and saturation are pinned to values known
 * to work behind the site's light type, so a red flyer gives a deep red bar
 * rather than a dusty pink one.
 *
 * Run with:  node scripts/extract-banner-colours.mjs
 */

const DIR = "public/banners";
const OUT = "lib/banner-colours.ts";

/** Bars are dark; the type on them is light. These are the values that hold. */
const BAR = { l: 0.17, s: 0.52 };
const BAR_LIFT = { l: 0.26, s: 0.5 };
const ACCENT = { l: 0.66, s: 0.62 };
/* For the light theme, where a dark bar would leave its own dark type
   unreadable. Same hue, pale enough that the header stays a light surface. */
const WASH = { l: 0.9, s: 0.42 };

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const files = (await readdir(DIR)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();

/**
 * The hue a person would name when looking at the picture.
 *
 * Pixels that are nearly black, nearly white or nearly grey cannot carry a
 * hue, so they are discarded rather than averaged in — averaging is what turns
 * every photograph into the same brown. The survivors vote for their hue bin
 * weighted by saturation times value, so a small area of strong colour beats a
 * large area of washed-out wall.
 */
const BINS = 36;

async function dominantHue(path) {
  const { data, info } = await sharp(path)
    .resize(96, 96, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const weight = new Float64Array(BINS);
  let counted = 0;
  let total = 0;

  for (let i = 0; i < info.width * info.height; i++) {
    const p = i * info.channels;
    const [h, s, l] = rgbToHsl(data[p], data[p + 1], data[p + 2]);
    total++;
    if (l < 0.12 || l > 0.93 || s < 0.16) continue; // carries no hue
    const bin = Math.min(BINS - 1, Math.floor(h * BINS));
    const w = s * (1 - Math.abs(l * 2 - 1) * 0.5);
    weight[bin] += w;
    counted++;
  }

  if (!counted || counted / total < 0.04) return null; // effectively greyscale

  let best = 0;
  for (let b = 1; b < BINS; b++) if (weight[b] > weight[best]) best = b;

  return { hue: (best + 0.5) / BINS, share: counted / total };
}

const rows = [];
for (const file of files) {
  const found = await dominantHue(`${DIR}/${file}`);
  const h = found?.hue ?? 0;
  const chromatic = found !== null;

  rows.push({
    file,
    bar: chromatic ? hslToHex(h, BAR.s, BAR.l) : null,
    lift: chromatic ? hslToHex(h, BAR_LIFT.s, BAR_LIFT.l) : null,
    accent: chromatic ? hslToHex(h, ACCENT.s, ACCENT.l) : null,
    wash: chromatic ? hslToHex(h, WASH.s, WASH.l) : null,
    source: chromatic ? `hue ${Math.round(h * 360)}deg` : "no hue",
    saturation: (found?.share ?? 0).toFixed(3),
  });
}

const body = rows
  .map(
    (r) =>
      `  "/banners/${r.file}": ${
        r.bar
          ? `{ bar: "${r.bar}", lift: "${r.lift}", accent: "${r.accent}", wash: "${r.wash}" }`
          : "null"
      }, // ${r.source}, ${(Number(r.saturation) * 100).toFixed(0)}% of pixels carry colour`,
  )
  .join("\n");

const file = `/**
 * GENERATED by scripts/extract-banner-colours.mjs — do not edit by hand.
 *
 * The colour each banner photograph lends to the two navigation bars while it
 * is the slide on screen. Only the hue comes from the picture; the lightness
 * and saturation are pinned so the bars stay readable behind light type.
 *
 * A null means the photograph is effectively greyscale and has no hue worth
 * borrowing — those slides leave the bars on the site's own navy.
 *
 * Re-run the script after adding or replacing a photograph.
 */

export type BannerColour = { bar: string; lift: string; accent: string; wash: string };

export const bannerColours: Record<string, BannerColour | null> = {
${body}
};
`;

await writeFile(OUT, file, "utf8");
console.log(`${OUT} written — ${rows.length} photographs`);
for (const r of rows) {
  console.log(`  ${r.file.padEnd(18)} ${(r.bar ?? "(greyscale)").padEnd(9)} ${r.source}, colour-carrying pixels ${(Number(r.saturation) * 100).toFixed(0)}%`);
}
