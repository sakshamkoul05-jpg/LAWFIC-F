import sharp from "sharp";

/**
 * Derive the blink frame FROM the open frame by closing its eyes.
 *
 * WHY THIS EXISTS
 *
 * The client supplied two renders — eyes open, and a wink. They look like two
 * frames of one animation and are not: diffing them showed 20% of pixels
 * differing in colour and 5.7% differing in SILHOUETTE, spread over almost the
 * whole image. The head, arms and outline are all slightly different, because
 * they are two separate generations rather than two frames of one.
 *
 * Cross-fading them therefore morphed the entire panda every time it blinked,
 * which is the "distorting" the client reported. A hard cut would have swapped
 * one panda for a visibly different one instead — better, but still a pop.
 *
 * So the blink is drawn rather than photographed: this takes the open frame
 * and paints its eyes shut with the eye-patch colour sampled from the image
 * itself. Every other pixel is byte-identical to the open frame, so the only
 * thing that can move during a blink is the eyelid.
 *
 * Run with:  node scripts/make-panda-blink.mjs
 */

const SRC = "public/panda-open.png";
const OUT = "public/panda-blink.png";

/* Read off the 224px frame with a coordinate grid; see the eye positions in
   the open render. Generous enough to cover the white sclera at the corners,
   which is what leaves a bright sliver if the cover is too tight. */
const EYES = [
  { cx: 110, cy: 88, rx: 16, ry: 15, tilt: -12 },
  { cx: 154, cy: 102, rx: 17, ry: 15, tilt: 10 },
];

/**
 * The eye-patch colour, found by walking a ring around the eye and keeping
 * only the DARK samples.
 *
 * Fixed points do not survive: the first attempt hard-coded two coordinates
 * and both landed on the white fur just outside the patch, which produced a
 * cream-coloured eyelid. A ring crosses both fur and patch, so filtering by
 * luminance picks the patch wherever it actually is.
 */
function patchColour(data, w, h, eye) {
  const samples = [];
  for (let step = 0; step < 48; step++) {
    const angle = (step / 48) * Math.PI * 2;
    const x = Math.round(eye.cx + Math.cos(angle) * (eye.rx + 6));
    const y = Math.round(eye.cy + Math.sin(angle) * (eye.ry + 6));
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = (y * w + x) * 4;
    if (data[p + 3] < 200) continue;
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    if (lum > 90) continue; // fur, not patch
    samples.push([data[p], data[p + 1], data[p + 2]]);
  }
  if (!samples.length) return [26, 26, 30];

  /* The DARKEST quarter, not the average. The ring necessarily clips the
     anti-aliased boundary where the patch meets the white fur, and averaging
     that in produces a lid visibly lighter than the patch it sits in. */
  const byLuminance = samples.sort(
    (a, b) => 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2] - (0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2]),
  );
  const core = byLuminance.slice(0, Math.max(1, Math.round(byLuminance.length * 0.25)));
  const avg = core.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
  return avg.map((v) => Math.round(v / core.length));
}

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

const patchL = patchColour(data, w, h, EYES[0]);
const patchR = patchColour(data, w, h, EYES[1]);
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

/* A touch lighter than the patch: the crease has to be visible against it,
   but a bright line would read as a drawn-on cartoon eye. */
const crease = (c) =>
  `rgb(${Math.min(255, c[0] + 42)},${Math.min(255, c[1] + 40)},${Math.min(255, c[2] + 40)})`;

const lids = EYES.map((eye, i) => {
  const patch = i === 0 ? patchL : patchR;
  /* The lid: the eye filled in with patch colour, then a shallow arc where the
     closed lashes sit. The arc dips downward, which is what makes a closed eye
     read as closed rather than as a missing eye. */
  return `
    <g transform="rotate(${eye.tilt} ${eye.cx} ${eye.cy})">
      <ellipse cx="${eye.cx}" cy="${eye.cy}" rx="${eye.rx}" ry="${eye.ry}" fill="${rgb(patch)}"/>
      <path d="M ${eye.cx - eye.rx * 0.72} ${eye.cy - 1}
               q ${eye.rx * 0.72} ${eye.ry * 0.75} ${eye.rx * 1.44} 0"
            fill="none" stroke="${crease(patch)}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;
}).join("");

const overlay = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${lids}</svg>`,
);

/* BOTH frames are written here, from the same buffer with the same encoder
   settings, and WITHOUT palette quantisation.
   Palette encoding re-quantises, and quantising two nearly-identical images
   independently shifts colours slightly across both of them — which showed up
   as a 3.4% whole-image difference and would shimmer on every blink. Full
   colour is deterministic, so the two files differ only where the lids are. */
const encode = { compressionLevel: 9, effort: 10 };

const openOut = await sharp(SRC).png(encode).toFile("public/panda-open.png.tmp");
const blinkOut = await sharp(SRC).composite([{ input: overlay }]).png(encode).toFile(OUT);

const { rename } = await import("node:fs/promises");
await rename("public/panda-open.png.tmp", "public/panda-open.png");

console.log(`public/panda-open.png ${openOut.width}x${openOut.height} ${(openOut.size / 1024).toFixed(1)} KB`);
console.log(`${OUT} ${blinkOut.width}x${blinkOut.height} ${(blinkOut.size / 1024).toFixed(1)} KB`);
console.log(`patch colours sampled: left ${rgb(patchL)}  right ${rgb(patchR)}`);
