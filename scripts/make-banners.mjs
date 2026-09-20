import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

/**
 * Draw the eleven promotional banners.
 *
 * WHY THESE ARE DRAWN AND NOT PHOTOGRAPHED
 *
 * The photographs they replace were generic stock — an empty open-plan office
 * standing for "jobs", a stack of library books standing for "income tax", a
 * bakery counter standing for "FSSAI". Each was a real photograph and none of
 * them said what the service was. A banner that could illustrate any of eleven
 * services illustrates none of them.
 *
 * What LAWFIC actually sells is documents: a certificate, a licence, a
 * registration, a card. So each banner shows the artefact the customer is
 * buying, drawn plainly.
 *
 * WHAT IS DELIBERATELY NOT DRAWN
 *
 * No State Emblem, no Ashoka lion capital, no government department logo, no
 * real-format registration number, and nothing that reproduces the actual
 * design of a PAN card, a passport or a GST certificate. These are stylised
 * artefacts — a sheet, a seal, a ruled form — that read as "official document"
 * without imitating a specific one. Imitating one would be a trademark problem
 * at best and would help somebody forge it at worst.
 *
 * Every number shown is visibly a placeholder pattern, never a plausible real
 * identifier.
 *
 * WHY THE COMPOSITION IS ALL ON THE RIGHT
 *
 * The carousel lays its headline over the left of the frame behind a neutral
 * shadow that is dense to about a quarter across and gone by two thirds. The
 * headline itself runs to roughly half the width at these proportions.
 *
 * So SAFE_X below is a hard floor, not a guideline: the first pass put a
 * seedling, a percent mark, a location pin and a row of chips at x≈660-760 and
 * every one of them landed under the headline. Nothing decorative goes left of
 * it.
 *
 * COLOUR IS THE POINT, NOT DECORATION
 *
 * The two navigation bars take their hue from whichever banner is on screen,
 * so eleven services now get eleven deliberate colours rather than whatever
 * hue a stock photograph happened to average to. Keep them saturated and
 * distinct.
 *
 * Run with:  node scripts/make-banners.mjs
 * Then:      node scripts/extract-banner-colours.mjs
 */

const W = 1600;
const H = 900;

/* Nothing is drawn left of this. See the note above. */
const SAFE_X = 880;
const OUT = "public/banners";

/* Paper, ink and metal. Shared so eleven banners read as one set. */
const PAPER = "#F6F1E6";
const PAPER_EDGE = "#E2D9C6";
const INK = "#2A2620";
const RULE = "#C9BFA9";

/* ── Drawing helpers ─────────────────────────────────────────────────────
   Small and dumb on purpose: each returns a string of SVG, and a banner is a
   list of them. Nothing here knows about any particular service. */

/** A sheet of paper with a coloured masthead. */
const sheet = (x, y, w, h, accent, rotate = 0) => `
  <g transform="rotate(${rotate} ${x + w / 2} ${y + h / 2})">
    <rect x="${x + 6}" y="${y + 10}" width="${w}" height="${h}" rx="10" fill="rgba(0,0,0,0.28)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${PAPER}" stroke="${PAPER_EDGE}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${Math.round(h * 0.13)}" rx="10" fill="${accent}"/>
    <rect x="${x}" y="${y + Math.round(h * 0.09)}" width="${w}" height="${Math.round(h * 0.04)}" fill="${accent}"/>
  </g>`;

/** Ruled lines standing in for body text. Never real words. */
const lines = (x, y, w, count, gap, accent, rotate = 0, cx = 0, cy = 0) => {
  let out = "";
  for (let i = 0; i < count; i++) {
    const width = i % 3 === 2 ? w * 0.55 : i % 2 ? w * 0.86 : w;
    out += `<rect x="${x}" y="${y + i * gap}" width="${width}" height="6" rx="3" fill="${
      i === 0 ? accent : RULE
    }" opacity="${i === 0 ? 0.9 : 0.75}"/>`;
  }
  return rotate ? `<g transform="rotate(${rotate} ${cx} ${cy})">${out}</g>` : out;
};

/**
 * A seal. Concentric rings with radiating teeth — the visual grammar of an
 * official stamp, and deliberately NOT any real emblem.
 */
const seal = (cx, cy, r, accent) => {
  let teeth = "";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    teeth += `<rect x="${cx - 2}" y="${cy - r - 6}" width="4" height="9" rx="2" fill="${accent}" transform="rotate(${
      (i / 24) * 360
    } ${cx} ${cy})"/>`;
  }
  return `
    ${teeth}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${accent}" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 11}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.7"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 24}" fill="${accent}" opacity="0.14"/>
    <path d="M ${cx - 13} ${cy + 1} l 9 10 l 18 -20" fill="none" stroke="${accent}"
          stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
};

/** A rounded chip — used for classes, categories, short codes. */
const chip = (x, y, w, h, accent, filled = false) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"
        fill="${filled ? accent : "none"}" stroke="${accent}" stroke-width="3" opacity="0.9"/>`;

/** Placeholder digits. Blocks, never numerals — nothing to mistake for real. */
const digits = (x, y, count, accent, size = 13) => {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += `<rect x="${x + i * (size + 6)}" y="${y}" width="${size}" height="${size + 5}" rx="3"
            fill="${accent}" opacity="${0.35 + (i % 4) * 0.16}"/>`;
  }
  return out;
};

/* ── The eleven ──────────────────────────────────────────────────────────
   `position` matches the row in the promotions table. */
const BANNERS = [
  {
    position: 1,
    file: "udyam.webp",
    alt: "A stylised Udyam registration certificate with a seal",
    bg: ["#1B2A6B", "#0C1330"],
    accent: "#F0A93B",
    art: (a) => `
      ${sheet(880, 190, 470, 560, a, -3)}
      ${lines(930, 330, 370, 7, 30, a, -3, 1115, 470)}
      ${seal(1245, 650, 54, a)}
      <g transform="rotate(-3 1115 470)">
        ${digits(930, 560, 8, a)}
        ${chip(930, 262, 128, 34, a, false)}
      </g>
      <!-- A small plant: the thing a registration is meant to let grow. -->
      <g transform="translate(1448 560) scale(0.78)" opacity="0.9">
        <path d="M0 120 L0 40" stroke="${a}" stroke-width="7" stroke-linecap="round"/>
        <path d="M0 62 q -46 -30 -60 -74 q 52 -2 60 74 z" fill="${a}" opacity="0.85"/>
        <path d="M0 48 q 46 -34 62 -80 q -54 -4 -62 80 z" fill="${a}"/>
        <rect x="-44" y="118" width="88" height="14" rx="7" fill="${a}" opacity="0.5"/>
      </g>`,
  },
  {
    position: 2,
    file: "gst.webp",
    alt: "A stylised tax invoice with the tax line picked out",
    bg: ["#0B4F4A", "#04211F"],
    accent: "#4FD8C4",
    art: (a) => `
      ${sheet(860, 150, 500, 620, a, 2)}
      <g transform="rotate(2 1110 460)">
        ${lines(910, 290, 400, 5, 30, a)}
        <rect x="910" y="470" width="400" height="3" fill="${RULE}"/>
        ${lines(910, 496, 400, 3, 30, a)}
        <!-- The tax line, picked out: this is what the service is about. -->
        <rect x="898" y="596" width="424" height="52" rx="8" fill="${a}" opacity="0.2"/>
        <rect x="918" y="614" width="200" height="8" rx="4" fill="${a}"/>
        <rect x="1210" y="614" width="96" height="8" rx="4" fill="${a}"/>
        ${digits(910, 214, 9, a)}
      </g>
      <!-- A percent mark, drawn rather than typed. -->
      <g transform="translate(1452 250) scale(0.86)" opacity="0.95">
        <circle cx="-34" cy="-34" r="26" fill="none" stroke="${a}" stroke-width="12"/>
        <circle cx="42" cy="44" r="26" fill="none" stroke="${a}" stroke-width="12"/>
        <path d="M-62 60 L 70 -56" stroke="${a}" stroke-width="12" stroke-linecap="round"/>
      </g>`,
  },
  {
    position: 3,
    file: "membership.webp",
    alt: "A membership card with a ten per cent roundel",
    bg: ["#6B4A0E", "#2A1B04"],
    accent: "#FFC857",
    art: (a) => `
      <g transform="rotate(-6 1090 470)">
        <rect x="846" y="266" width="520" height="330" rx="26" fill="rgba(0,0,0,0.3)"/>
        <rect x="840" y="256" width="520" height="330" rx="26" fill="${PAPER}" stroke="${PAPER_EDGE}"/>
        <rect x="840" y="256" width="520" height="86" rx="26" fill="${a}"/>
        <rect x="840" y="316" width="520" height="26" fill="${a}"/>
        <rect x="884" y="392" width="150" height="104" rx="12" fill="${a}" opacity="0.28"/>
        ${lines(1064, 400, 250, 4, 26, a)}
        ${digits(884, 520, 10, a, 11)}
      </g>
      <g transform="translate(1230 668)">
        <circle cx="0" cy="0" r="92" fill="${a}"/>
        <circle cx="0" cy="0" r="78" fill="none" stroke="#2A1B04" stroke-width="4" opacity="0.5"/>
        <circle cx="-26" cy="-24" r="17" fill="none" stroke="#2A1B04" stroke-width="9"/>
        <circle cx="28" cy="28" r="17" fill="none" stroke="#2A1B04" stroke-width="9"/>
        <path d="M-44 40 L 46 -42" stroke="#2A1B04" stroke-width="9" stroke-linecap="round"/>
      </g>`,
  },
  {
    position: 4,
    file: "jobs.webp",
    alt: "Job listing cards with a location marker",
    bg: ["#123A6B", "#061527"],
    accent: "#5AB0FF",
    art: (a) => `
      ${sheet(1010, 196, 400, 180, a, -7)}
      ${sheet(950, 362, 430, 190, a, -3)}
      ${sheet(860, 530, 470, 210, a, 1)}
      <g transform="rotate(1 1095 635)">
        ${lines(910, 590, 300, 3, 28, a)}
        ${chip(910, 676, 108, 32, a, true)}
        ${chip(1032, 676, 90, 32, a)}
      </g>
      <!-- A location marker: the promise is openings near you. -->
      <g transform="translate(1468 250) scale(0.62)">
        <path d="M0 150 C -66 62 -86 26 -86 -14 A 86 86 0 1 1 86 -14 C 86 26 66 62 0 150 Z"
              fill="${a}"/>
        <circle cx="0" cy="-16" r="34" fill="#061527"/>
      </g>`,
  },
  {
    position: 5,
    file: "identity.webp",
    alt: "An identity card beside a digital signature token",
    bg: ["#3B1C6B", "#150A2A"],
    accent: "#B98CFF",
    art: (a) => `
      <g transform="rotate(-4 1080 420)">
        <rect x="836" y="216" width="500" height="316" rx="22" fill="rgba(0,0,0,0.3)"/>
        <rect x="830" y="206" width="500" height="316" rx="22" fill="${PAPER}" stroke="${PAPER_EDGE}"/>
        <rect x="830" y="206" width="500" height="72" rx="22" fill="${a}"/>
        <rect x="830" y="256" width="500" height="22" fill="${a}"/>
        <circle cx="922" cy="378" r="52" fill="${a}" opacity="0.3"/>
        <circle cx="922" cy="360" r="20" fill="${a}" opacity="0.75"/>
        <path d="M886 412 a 36 30 0 0 1 72 0 z" fill="${a}" opacity="0.75"/>
        ${lines(1006, 328, 268, 4, 26, a)}
        ${digits(1006, 452, 10, a, 11)}
      </g>
      <!-- A signing token, for the DSC half of the service. -->
      <g transform="translate(1000 600) rotate(-14)">
        <rect x="0" y="0" width="230" height="86" rx="18" fill="${a}"/>
        <rect x="200" y="22" width="58" height="42" rx="8" fill="${a}" opacity="0.6"/>
        <rect x="26" y="30" width="120" height="10" rx="5" fill="#150A2A" opacity="0.55"/>
        <rect x="26" y="50" width="76" height="10" rx="5" fill="#150A2A" opacity="0.35"/>
      </g>`,
  },
  {
    position: 6,
    file: "trademark.webp",
    alt: "A shield protecting a trademark symbol, with class chips",
    bg: ["#5E1146", "#26071C"],
    accent: "#FF7ACF",
    art: (a) => `
      <!-- A shield: the service is protection, not paperwork. -->
      <g transform="translate(1100 450)">
        <path d="M0 -230 L 196 -162 L 196 24 C 196 148 106 216 0 252
                 C -106 216 -196 148 -196 24 L -196 -162 Z"
              fill="${PAPER}" stroke="${PAPER_EDGE}" stroke-width="4"/>
        <path d="M0 -230 L 196 -162 L 196 -96 L -196 -96 L -196 -162 Z" fill="${a}"/>
        <circle cx="0" cy="26" r="92" fill="none" stroke="${a}" stroke-width="12"/>
        <rect x="-52" y="-20" width="104" height="14" rx="7" fill="${a}"/>
        <rect x="-11" y="-20" width="22" height="98" rx="8" fill="${a}"/>
      </g>
      <!-- Class chips: registration is per class, which is the whole point. -->
      <g transform="translate(944 760)">
        ${chip(0, 0, 96, 42, a, true)}
        ${chip(112, 0, 96, 42, a)}
        ${chip(224, 0, 96, 42, a)}
      </g>`,
  },
  {
    position: 7,
    file: "food.webp",
    alt: "A food licence certificate with a leaf mark",
    bg: ["#14501F", "#04200B"],
    accent: "#63DD7E",
    art: (a) => `
      ${sheet(880, 170, 470, 580, a, 3)}
      <g transform="rotate(3 1115 460)">
        ${lines(930, 300, 370, 6, 30, a)}
        ${digits(930, 512, 14, a, 11)}
        ${chip(930, 566, 150, 36, a, false)}
      </g>
      ${seal(1250, 660, 52, a)}
      <!-- Leaf and fork: food, prepared safely. -->
      <g transform="translate(1450 300) scale(0.62)">
        <path d="M0 120 C -90 60 -96 -54 -6 -120 C 78 -54 84 58 0 120 Z" fill="${a}" opacity="0.9"/>
        <path d="M-4 112 L -4 -96" stroke="#04200B" stroke-width="7" stroke-linecap="round" opacity="0.55"/>
        <g transform="translate(150 -10)">
          <rect x="-6" y="-104" width="12" height="220" rx="6" fill="${a}"/>
          <rect x="-44" y="-112" width="10" height="70" rx="5" fill="${a}"/>
          <rect x="34" y="-112" width="10" height="70" rx="5" fill="${a}"/>
          <rect x="-44" y="-52" width="88" height="12" rx="6" fill="${a}"/>
        </g>
      </g>`,
  },
  {
    position: 8,
    file: "incorporation.webp",
    alt: "A certificate of incorporation with a company structure diagram",
    bg: ["#1E3350", "#081320"],
    accent: "#7FB2E5",
    art: (a) => `
      ${sheet(870, 160, 490, 600, a, -2)}
      <g transform="rotate(-2 1115 460)">
        ${lines(920, 300, 390, 5, 30, a)}
        ${digits(920, 476, 12, a, 12)}
        <!-- A structure diagram: a company is people in a shape. -->
        <g transform="translate(1115 606)">
          <circle cx="0" cy="-42" r="24" fill="${a}"/>
          <circle cx="-96" cy="52" r="24" fill="${a}" opacity="0.8"/>
          <circle cx="0" cy="52" r="24" fill="${a}" opacity="0.8"/>
          <circle cx="96" cy="52" r="24" fill="${a}" opacity="0.8"/>
          <path d="M0 -18 L 0 28 M -96 28 L -96 4 L 96 4 L 96 28" fill="none"
                stroke="${a}" stroke-width="5" opacity="0.8"/>
        </g>
      </g>
      ${seal(1300, 706, 58, a)}`,
  },
  {
    position: 9,
    file: "income-tax.webp",
    alt: "A tax return form marked as filed",
    bg: ["#6B2A10", "#2A0F05"],
    accent: "#FF9A5C",
    art: (a) => `
      ${sheet(880, 150, 480, 620, a, 2)}
      <g transform="rotate(2 1120 460)">
        ${lines(930, 290, 380, 4, 30, a)}
        <!-- Tick boxes: a return is a form, answered. -->
        <g>
          <rect x="930" y="430" width="34" height="34" rx="7" fill="none" stroke="${a}" stroke-width="4"/>
          <path d="M938 447 l 10 11 l 18 -21" fill="none" stroke="${a}" stroke-width="6"
                stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="986" y="440" width="230" height="8" rx="4" fill="${RULE}"/>
          <rect x="930" y="496" width="34" height="34" rx="7" fill="none" stroke="${a}" stroke-width="4"/>
          <path d="M938 513 l 10 11 l 18 -21" fill="none" stroke="${a}" stroke-width="6"
                stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="986" y="506" width="180" height="8" rx="4" fill="${RULE}"/>
        </g>
        <rect x="918" y="576" width="424" height="56" rx="8" fill="${a}" opacity="0.2"/>
        <rect x="938" y="596" width="180" height="10" rx="5" fill="${a}"/>
        <rect x="1230" y="596" width="94" height="10" rx="5" fill="${a}"/>
      </g>
      ${seal(1298, 700, 58, a)}`,
  },
  {
    position: 10,
    file: "agreement.webp",
    alt: "A signed agreement with a stamp",
    bg: ["#134A57", "#041D23"],
    accent: "#57D1E8",
    art: (a) => `
      <g opacity="0.6">${sheet(940, 190, 420, 540, a, 6)}</g>
      ${sheet(850, 170, 470, 590, a, -3)}
      <g transform="rotate(-3 1085 465)">
        ${lines(900, 310, 370, 7, 30, a)}
        <!-- Two signatures: an agreement is two parties, not one form. -->
        <path d="M900 596 c 26 -34 44 10 64 -14 c 18 -22 30 16 52 -6"
              fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
        <rect x="900" y="622" width="150" height="5" rx="2" fill="${RULE}"/>
        <path d="M1130 596 c 22 -30 40 12 58 -10 c 16 -20 28 14 48 -4"
              fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" opacity="0.75"/>
        <rect x="1130" y="622" width="150" height="5" rx="2" fill="${RULE}"/>
      </g>
      <!-- A stamp, sitting slightly askew as a real one would. -->
      <g transform="rotate(-13 1180 726) translate(560 234) scale(0.86)">
        <rect x="620" y="492" width="212" height="136" rx="12" fill="none" stroke="${a}" stroke-width="7" opacity="0.92"/>
        <rect x="646" y="524" width="160" height="10" rx="5" fill="${a}" opacity="0.85"/>
        <rect x="646" y="552" width="120" height="10" rx="5" fill="${a}" opacity="0.6"/>
        <rect x="646" y="580" width="140" height="10" rx="5" fill="${a}" opacity="0.6"/>
      </g>`,
  },
  {
    position: 11,
    file: "passport.webp",
    alt: "A passport booklet with a boarding pass",
    bg: ["#5C1220", "#24060C"],
    accent: "#FF8A9B",
    art: (a) => `
      <!-- A booklet, not a specific country's passport. -->
      <g transform="rotate(-5 1090 440)">
        <rect x="856" y="206" width="470" height="470" rx="20" fill="rgba(0,0,0,0.32)"/>
        <rect x="850" y="196" width="470" height="470" rx="20" fill="${a}" opacity="0.92"/>
        <rect x="850" y="196" width="34" height="470" rx="16" fill="#24060C" opacity="0.28"/>
        <circle cx="1096" cy="378" r="86" fill="none" stroke="#24060C" stroke-width="7" opacity="0.5"/>
        <ellipse cx="1096" cy="378" rx="40" ry="86" fill="none" stroke="#24060C" stroke-width="7" opacity="0.5"/>
        <path d="M1010 378 L 1182 378 M1024 330 L 1168 330 M1024 426 L 1168 426"
              stroke="#24060C" stroke-width="7" opacity="0.5" stroke-linecap="round"/>
        <rect x="1000" y="540" width="192" height="12" rx="6" fill="#24060C" opacity="0.45"/>
      </g>
      <!-- A boarding pass: what the passport is for. -->
      <g transform="rotate(8 1040 660) translate(300 96) scale(0.9)">
        <rect x="620" y="530" width="300" height="150" rx="14" fill="${PAPER}" stroke="${PAPER_EDGE}"/>
        <rect x="620" y="530" width="300" height="40" rx="14" fill="${a}"/>
        <rect x="826" y="530" width="4" height="150" stroke-dasharray="10 9" stroke="${PAPER_EDGE}" stroke-width="3"/>
        ${lines(646, 596, 150, 3, 22, a)}
        <path d="M856 604 l 42 -22 l -12 22 l 12 22 z" fill="${a}"/>
      </g>`,
  },
];

/* ── Render ──────────────────────────────────────────────────────────── */

await mkdir(OUT, { recursive: true });

for (const banner of BANNERS) {
  const [from, to] = banner.bg;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.68" cy="0.42" r="0.6">
      <stop offset="0" stop-color="${banner.accent}" stop-opacity="0.26"/>
      <stop offset="1" stop-color="${banner.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- A faint ruling across the whole frame: paper, at the scale of the page. -->
  <g opacity="0.05">
    ${Array.from({ length: 30 }, (_, i) => `<rect x="0" y="${i * 32}" width="${W}" height="1" fill="#fff"/>`).join("")}
  </g>

  ${banner.art(banner.accent)}

  <!-- The left third is where the headline goes. Kept clear. -->
</svg>`;

  /* WEBP, NOT PNG.
     Vercel's image optimiser is returning 402 on this account — its quota is
     spent — so next/image is bypassed and these files are served exactly as
     they are written here. Nothing downstream will compress them, which makes
     the encoder's job ours. PNG palette quantisation cannot cope with the
     full-frame gradient behind the artwork and left every banner at 130-190KB;
     WebP handles gradients natively and lands around a third of that. */
  const target = `${OUT}/${banner.file}`;
  const info = await sharp(Buffer.from(svg)).webp({ quality: 86, effort: 6 }).toFile(target);
  console.log(`${target.padEnd(34)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

await writeFile(
  `${OUT}/MANIFEST.json`,
  JSON.stringify(
    BANNERS.map((b) => ({ position: b.position, photo: `/banners/${b.file}`, photo_alt: b.alt })),
    null,
    2,
  ),
  "utf8",
);
console.log(`\n${OUT}/MANIFEST.json written — feed it to scripts/apply-banners.mjs`);
