/**
 * Builds the four homepage ad creatives into public/ads.
 *
 *   node assets-src/build-ads.mjs
 *
 * WHY THE TYPE IS IN THE ARTWORK
 *
 * Taken from how the reference sites actually do it. hairoriginals.com serves a
 * 1280x512 PNG and boat-lifestyle.com a 1600x667 one, and in BOTH the slide
 * contains no HTML text at all — the headline, the offer and the button are
 * painted into the file. That is the entire reason neither needs a scrim:
 * nothing is laid over anything, so nothing has to be darkened to stay
 * readable. The designer put the words where the picture was already quiet.
 *
 * Our old approach was the inverse — take a stock photograph that was never
 * composed for text, then darken it until the text survived. The scrim was
 * compensating for the wrong input, which is why removing it broke legibility
 * and keeping it buried the photograph.
 *
 * These are drawn rather than photographed because this project has no image
 * generation and no licensed photo library it can add to. That turns out to
 * suit the subject: the thing being sold is documents and filings, so a drawn
 * form, a card and a wallet say it more plainly than a stock desk does.
 *
 * TWO CROPS EACH, NOT ONE LETTERBOXED
 *
 * Also from the reference: hairoriginals ships 2.50:1 for desktop and 0.83:1
 * for mobile — the same campaign recomposed, not the same file squeezed. Each
 * ad here is emitted at both, with the type re-laid for the shape rather than
 * scaled down until it fits.
 *
 * FONTS ARE A REAL RISK IN AN SVG USED AS AN <img>
 *
 * Such an SVG cannot load a webfont; it renders in whatever the viewer already
 * has, so metrics shift between machines and text that fits here can overflow
 * there. Two defences: the stacks below end in a generic that exists
 * everywhere, and every headline is given a `textLength`, which pins its width
 * whatever font is substituted. Margins are generous for the same reason.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "ads");

const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

/** The brand's own palette, so the ads belong to the site rather than to a stock library. */
const INK = "#0B0B0C";
const CREAM = "#F5F1EA";
const GOLD = "#D0AE55";

const ADS = [
  {
    id: "gst",
    eyebrow: "TAX & FILINGS",
    line1: "A GSTIN in your",
    line2: "name in 7–10 days",
    support: "We answer the department's queries. You get the certificate.",
    cta: "Start GST registration",
    tint: "#1C2A24",
    motif: "form",
  },
  {
    id: "identity",
    eyebrow: "IDENTITY",
    line1: "PAN, TAN and DSC",
    line2: "without the guesswork",
    support: "Government fee and our fee, itemised before you commit.",
    cta: "See identity services",
    tint: "#2A2119",
    motif: "card",
  },
  {
    id: "udyam",
    eyebrow: "START A BUSINESS",
    line1: "Udyam, GST and",
    line2: "the rest of the file",
    support: "Registrations that are free at source, filed right the first time.",
    cta: "Register your business",
    tint: "#241E2C",
    motif: "shop",
  },
  {
    id: "wallet",
    eyebrow: "LAWFIC WALLET",
    line1: "One balance for",
    line2: "every filing you make",
    support: "Top up once. Every debit itemised against the work it paid for.",
    cta: "Open your wallet",
    tint: "#1A2430",
    motif: "wallet",
  },
];

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The drawn motif. Line art, so it reads at any size and never fights the type. */
function motif(kind, x, y, s) {
  const stroke = `stroke="${GOLD}" fill="none" stroke-width="${s * 0.016}" stroke-linecap="round" stroke-linejoin="round"`;
  const faint = `stroke="${CREAM}" fill="none" stroke-width="${s * 0.011}" opacity="0.28" stroke-linecap="round"`;

  if (kind === "form") {
    return `<g transform="translate(${x} ${y})">
      <rect x="${-s * 0.34}" y="${-s * 0.42}" width="${s * 0.62}" height="${s * 0.84}" rx="${s * 0.03}" ${faint} transform="rotate(-7)"/>
      <rect x="${-s * 0.28}" y="${-s * 0.4}" width="${s * 0.62}" height="${s * 0.84}" rx="${s * 0.03}" ${stroke}/>
      ${[0.18, 0.32, 0.46, 0.6].map((t) => `<line x1="${-s * 0.2}" y1="${-s * 0.4 + s * 0.84 * t}" x2="${s * 0.18}" y2="${-s * 0.4 + s * 0.84 * t}" ${faint}/>`).join("")}
      <circle cx="${s * 0.2}" cy="${s * 0.3}" r="${s * 0.14}" ${stroke}/>
      <path d="M${s * 0.13} ${s * 0.3} l${s * 0.05} ${s * 0.05} l${s * 0.1} -${s * 0.11}" ${stroke}/>
    </g>`;
  }
  if (kind === "card") {
    return `<g transform="translate(${x} ${y})">
      <rect x="${-s * 0.44}" y="${-s * 0.3}" width="${s * 0.88}" height="${s * 0.56}" rx="${s * 0.06}" ${stroke}/>
      <rect x="${-s * 0.32}" y="${-s * 0.14}" width="${s * 0.18}" height="${s * 0.14}" rx="${s * 0.02}" ${stroke}/>
      ${[0.1, 0.2].map((t) => `<line x1="${-s * 0.32}" y1="${s * 0.06 + s * t}" x2="${s * 0.06}" y2="${s * 0.06 + s * t}" ${faint}/>`).join("")}
      <circle cx="${s * 0.24}" cy="${-s * 0.06}" r="${s * 0.1}" ${faint}/>
      <path d="M${s * 0.08} ${s * 0.16} q${s * 0.16} -${s * 0.14} ${s * 0.32} 0" ${faint}/>
    </g>`;
  }
  if (kind === "shop") {
    return `<g transform="translate(${x} ${y})">
      <path d="M${-s * 0.42} ${-s * 0.12} l${s * 0.1} -${s * 0.24} h${s * 0.64} l${s * 0.1} ${s * 0.24} z" ${stroke}/>
      <line x1="${-s * 0.42}" y1="${-s * 0.12}" x2="${s * 0.42}" y2="${-s * 0.12}" ${stroke}/>
      <path d="M${-s * 0.34} ${-s * 0.12} v${s * 0.5} h${s * 0.68} v-${s * 0.5}" ${stroke}/>
      <rect x="${-s * 0.12}" y="${s * 0.08}" width="${s * 0.24}" height="${s * 0.3}" ${faint}/>
      ${[-0.24, 0, 0.24].map((t) => `<line x1="${s * t}" y1="${-s * 0.36}" x2="${s * t + s * 0.05}" y2="${-s * 0.12}" ${faint}/>`).join("")}
    </g>`;
  }
  return `<g transform="translate(${x} ${y})">
    <path d="M${-s * 0.44} ${-s * 0.2} h${s * 0.88} a${s * 0.06} ${s * 0.06} 0 0 1 ${s * 0.06} ${s * 0.06} v${s * 0.4} a${s * 0.06} ${s * 0.06} 0 0 1 -${s * 0.06} ${s * 0.06} h-${s * 0.88} z" ${stroke}/>
    <path d="M${s * 0.16} ${-s * 0.04} h${s * 0.34} v${s * 0.2} h-${s * 0.34} a${s * 0.1} ${s * 0.1} 0 0 1 0 -${s * 0.2} z" ${stroke}/>
    ${[0.05, 0.1].map((t, i) => `<line x1="${-s * 0.3 + i * s * 0.04}" y1="${-s * 0.2 - s * t}" x2="${s * 0.2}" y2="${-s * 0.2 - s * t}" ${faint}/>`).join("")}
  </g>`;
}

/** The LAWFIC mark: an I and an L set tight, as it is everywhere else. */
function mark(x, y, size, opacity = 1) {
  return `<text x="${x}" y="${y}" font-family="${SERIF}" font-size="${size}" font-weight="700"
    letter-spacing="${-size * 0.05}" fill="${CREAM}" opacity="${opacity}" text-anchor="end">IL</text>`;
}

function creative({ ad, w, h, portrait }) {
  const pad = portrait ? w * 0.09 : w * 0.065;
  const headSize = portrait ? w * 0.093 : w * 0.05;
  const textW = portrait ? w - pad * 2 : w * 0.56;
  const baseY = portrait ? h * 0.52 : h * 0.44;

  /* The motif is drawn inside a box of motifSize centred on motifX/motifY, so
     in the portrait crop its lower edge is motifY + motifSize / 2. At 0.62w
     centred on 0.21h that edge landed at 506 on a 1080 frame while the eyebrow
     starts around 427 — the artwork ran straight through the words. Smaller and
     higher puts the edge at about 403, clear of the type with room to spare. */
  /* Portrait: the band between the top edge and the eyebrow is about 376px on
     a 1080 frame, and the tallest motif (the tilted form) stands 0.9 of its box
     high — so 0.44w is the largest that fits without either running off the top
     or landing on the words, and 0.5w did the first of those. */
  const motifSize = portrait ? w * 0.44 : h * 0.45;
  /* The widest motif (the wallet) reaches 0.52 of its box to the right of its
     own centre, so a fixed fraction of the width puts it flush against the
     frame on that one and not the others — which is exactly what a clipped
     drawing looks like. Measure back from the padding instead, and every motif
     ends up with the same margin the type has. */
  const motifX = portrait ? w * 0.5 : w - pad - motifSize * 0.52;
  const motifY = portrait ? h * 0.211 : h * 0.45;

  /* SIZED FOR THE BOX IT ACTUALLY RENDERS IN
     The tiles are half of a 1152px column, so a landscape creative is drawn at
     about 544 CSS px — under half its own width. Every size below is therefore
     chosen backwards, from the size it should end up on screen: a 13.5px button
     label at that scale is a 30px label in the file, not the 25px one that was
     here, which arrived on the page at nine pixels and could not be read. */
  const btnH = portrait ? h * 0.094 : h * 0.117;
  const btnFont = btnH * 0.34;
  const btnW = portrait
    ? w * 0.74
    : Math.min(w * 0.44, ad.cta.length * btnFont * 0.56 + w * 0.05);

  /* Below the support line, not on top of it. The stack is eyebrow, two
     headline lines at 1.12em, the support line at 1.95em — so the button
     cannot start before 2.3em without covering the sentence it is meant to
     follow, which is exactly what it did at 1.5. */
  const btnY = portrait ? h * 0.8 : baseY + headSize * 2.55;

  /* The support line is the one string with no textLength holding it, so it is
     the one that can run past the padding when a substituted font is wider than
     the one this was drawn against. Size it to fit first — half an em per
     character is a safe average for mixed-case English — and then pin the
     result. lengthAdjust is "spacing" and not "spacingAndGlyphs": squeezing the
     letterforms of a sentence looks like a mistake, squeezing the gaps does not. */
  const supportIdeal = w * (portrait ? 0.036 : 0.0248);
  const supportSize = Math.min(supportIdeal, textW / (ad.support.length * 0.5));
  const supportLen = Math.min(textW, ad.support.length * supportSize * 0.5);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ad.line1)} ${esc(ad.line2)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ad.tint}"/>
      <stop offset="1" stop-color="${INK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.3" r="0.6">
      <stop offset="0" stop-color="${GOLD}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>

  ${motif(ad.motif, motifX, motifY, motifSize)}

  <text x="${pad}" y="${baseY - headSize * 1.35}" font-family="${SANS}" font-size="${w * (portrait ? 0.032 : 0.0202)}"
    font-weight="600" letter-spacing="${w * (portrait ? 0.008 : 0.004)}" fill="${GOLD}">${esc(ad.eyebrow)}</text>

  <text x="${pad}" y="${baseY}" font-family="${SANS}" font-size="${headSize}" font-weight="600"
    fill="${CREAM}" textLength="${Math.min(textW, ad.line1.length * headSize * 0.52)}"
    lengthAdjust="spacingAndGlyphs">${esc(ad.line1)}</text>
  <text x="${pad}" y="${baseY + headSize * 1.12}" font-family="${SANS}" font-size="${headSize}" font-weight="600"
    fill="${CREAM}" textLength="${Math.min(textW, ad.line2.length * headSize * 0.52)}"
    lengthAdjust="spacingAndGlyphs">${esc(ad.line2)}</text>

  <text x="${pad}" y="${baseY + headSize * 1.95}" font-family="${SANS}" font-size="${supportSize}"
    fill="${CREAM}" opacity="0.72" textLength="${supportLen}"
    lengthAdjust="spacing">${esc(ad.support)}</text>

  <rect x="${pad}" y="${btnY}" width="${btnW}" height="${btnH}" rx="${btnH / 2}" fill="${GOLD}"/>
  <text x="${pad + btnW / 2}" y="${btnY + btnH * 0.64}" font-family="${SANS}" font-size="${btnFont}"
    font-weight="600" fill="${INK}" text-anchor="middle">${esc(ad.cta)}</text>

  ${mark(w - pad, portrait ? h * 0.955 : h * 0.92, w * (portrait ? 0.075 : 0.036), 0.5)}
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
for (const ad of ADS) {
  /* 1200x750, not 1600x640. The 2.5:1 banner was copied from hairoriginals,
     where it runs the full width of the page; ours sit two to a row, and a
     2.5:1 strip half a column wide is a letterbox with a stamp of type in it.
     1.6:1 is a card, which is what the slot is. */
  writeFileSync(join(OUT, `${ad.id}-wide.svg`), creative({ ad, w: 1200, h: 750, portrait: false }));
  writeFileSync(join(OUT, `${ad.id}-tall.svg`), creative({ ad, w: 900, h: 1080, portrait: true }));
}
console.log(`Wrote ${ADS.length * 2} creatives to public/ads`);
