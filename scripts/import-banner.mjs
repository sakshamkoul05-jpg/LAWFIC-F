import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

/**
 * Bring a banner image in from outside and put it where the site expects it.
 *
 *   node scripts/import-banner.mjs <position> <path-to-image>
 *   node scripts/import-banner.mjs 1 ~/Downloads/udyam-from-canva.png
 *
 * WHY THIS IS NOT JUST A COPY
 *
 * Image optimisation is switched off for this project — Vercel's optimiser
 * returns 402 on this account, and next/image renders nothing at all when it
 * does. See the note in next.config.ts. Every file in /public is therefore
 * served byte for byte as committed, which makes sizing and compression this
 * script's job rather than the platform's. A 4MB PNG straight out of a
 * generator would be shipped to every visitor as a 4MB PNG.
 *
 * So: cropped to the carousel's shape, resized to 1600x900, written as WebP.
 * Twenty-odd KB instead of several megabytes.
 *
 * It also refuses to upscale. A small source stretched to 1600 wide looks soft
 * on exactly the part of the page a visitor sees first, and that is worth
 * stopping rather than silently shipping.
 */

const W = 1600;
const H = 900;
const MANIFEST = "public/banners/MANIFEST.json";

const [, , positionArg, source] = process.argv;

if (!positionArg || !source) {
  console.error("usage: node scripts/import-banner.mjs <position> <path-to-image>");
  console.error("       position is 1-11; see docs/banner-prompts.md");
  process.exit(1);
}

const position = Number(positionArg);
const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
const entry = manifest.find((m) => m.position === position);

if (!entry) {
  console.error(`No banner at position ${position}. Known positions: ${manifest.map((m) => m.position).join(", ")}`);
  process.exit(1);
}

const target = `public${entry.photo}`;

const meta = await sharp(source).metadata();
if (!meta.width || !meta.height) {
  console.error("Could not read that image.");
  process.exit(1);
}

if (meta.width < W) {
  console.error(
    `That image is ${meta.width}px wide and the banner is ${W}px. Upscaling would look soft on the\n` +
      "first thing anybody sees. Re-export it larger from Canva and try again.",
  );
  process.exit(1);
}

/* `cover` crops rather than squashes. A generated 16:9 image loses nothing;
   a squarer one loses its top and bottom, which is why the prompts ask for
   16:9 and put the subject in the middle band. */
const info = await sharp(source)
  .resize(W, H, { fit: "cover", position: "centre" })
  .webp({ quality: 86, effort: 6 })
  .toFile(target);

console.log(`${target}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
console.log(`  from ${meta.width}x${meta.height} ${meta.format}`);
console.log(`  alt text on record: "${entry.photo_alt}"`);
console.log("\nWhen every banner is in:");
console.log("  node scripts/extract-banner-colours.mjs");
console.log("  node --env-file=.env.local scripts/apply-banners.mjs");
