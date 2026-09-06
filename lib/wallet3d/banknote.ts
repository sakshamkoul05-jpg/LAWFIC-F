import * as THREE from "three";

/**
 * LAWFIC Credits — the note family, drawn to the client's approved design.
 *
 * WHAT THIS IS AND IS NOT
 *
 * These are not money. They are a branded voucher for a closed-loop prepaid
 * balance, and the design says so on its face: the unit is a LAWFIC CREDIT, the
 * issuer is LAWFIC, and the back reads "MORE THAN A WALLET". Nothing here
 * imitates any real note — no emblem, no portrait, no issuer of legal tender,
 * no real serial format — which is what allows the design to be FINISHED rather
 * than curtailed. Earlier versions drew stylised rupees and had to stop short
 * of everything that makes a note look like a note; that is why they kept
 * reading as coloured slips.
 *
 * THE DESIGN
 *
 * Reproduced from the client's artwork, element for element and in place:
 *
 *   front  value and LAWFIC CREDITS top left; "A BETTER TOMORROW IN YOUR
 *          HANDS."; a signature over CHIEF VISION OFFICER; a windowed security
 *          thread carrying the monogram; the LAWFIC wordmark over PEOPLE
 *          PROGRESS POSSIBILITIES; an engraved mountain, lake and viaduct with
 *          a pine on a rock to the right; BUILT ON TRUST / BACKED BY PEOPLE; a
 *          guilloché medallion; a red serial; 未来へ共に set vertically; and the
 *          value repeated bottom right.
 *
 *   back   value both top corners; a faint world map; DISCIPLINE CREATES
 *          FREEDOM; the LAWFIC wordmark; MORE THAN A WALLET.; a large
 *          medallion; an engraved city with a flyover and a tree; A BRIGHTER
 *          YOU.; PEOPLE PROGRESS POSSIBILITIES stacked; and A MORE INCLUSIVE
 *          TOMORROW.
 *
 * HOW THE ENGRAVING IS MADE
 *
 * Two techniques, both of them the real ones rather than an imitation of the
 * look:
 *
 *   - the lacework is guilloché, which on a real note is cut by a geometric
 *     lathe, which is to say it is the plot of a hypotrochoid. It is generated
 *     here from that same equation. A rosette of a few thousand
 *     mathematically-related curves is instantly legible as security printing
 *     and cannot be mistaken for clip art;
 *   - the landscapes are intaglio, which gets its tone from LINE DENSITY, not
 *     from fill. Every shaded area here is hatched inside a clip path, so the
 *     mountains are dark because the lines are close together. Filling them
 *     with grey is the single thing that makes drawn engraving look like a
 *     sticker.
 *
 * Drawn at roughly 4x display size so the fine work survives being mapped onto
 * geometry and read at a glancing angle.
 */

export type Denomination = 10 | 20 | 50 | 100 | 500 | 1000;

export type NoteDesign = {
  value: Denomination;
  /** Base paper tint. */
  paper: string;
  /** The intaglio ink: engraving, borders, numerals. */
  ink: string;
  /** Warm lacework under the printing. */
  lace: string;
  /** Cool secondary lacework, a shade apart from the first. */
  laceAlt: string;
  /** Serial number, in the red every note in the family uses. */
  serial: string;
};

/**
 * Six denominations on ONE layout.
 *
 * The client's artwork is the 100. The others are that design in a different
 * colour family, which is how a real note series works — the layout is
 * constant so the notes are recognisably one family, and the colour carries the
 * value at arm's length. Restrained on purpose: a note in saturated colour
 * reads as play money however fine the lacework on it is.
 */
export const DENOMINATIONS: NoteDesign[] = [
  { value: 10, paper: "#F1EADD", ink: "#4A3A29", lace: "#CBB48C", laceAlt: "#C3B7A6", serial: "LF1043821" },
  { value: 20, paper: "#F0EDE0", ink: "#4A4726", lace: "#C9BE86", laceAlt: "#B9BCA2", serial: "LF2081574" },
  { value: 50, paper: "#EAEDF0", ink: "#2C3C4E", lace: "#A9BDC9", laceAlt: "#BFC5CC", serial: "LF5096237" },
  /* The approved artwork. */
  { value: 100, paper: "#F2EDE3", ink: "#2A3A32", lace: "#C8B28A", laceAlt: "#A9BDC4", serial: "LF2578963" },
  { value: 500, paper: "#F1E9E7", ink: "#4A2630", lace: "#C6A398", laceAlt: "#BBAEB4", serial: "LF5312089" },
  { value: 1000, paper: "#E9EEEC", ink: "#1F3F3D", lace: "#9FBDB4", laceAlt: "#B4C3C6", serial: "LF1000476" },
];

export function getDenomination(v: number): NoteDesign | undefined {
  return DENOMINATIONS.find((d) => d.value === v);
}

/**
 * The note is a panorama, and that is the client's proportion, not a slip.
 *
 * Measured off the supplied artwork at about 3.5:1 — far wider than a rupee
 * note's 2.15:1. Worth knowing where it shows: in the card holder only the top
 * third of a note clears the pocket, so the wordmark, the value and the serial
 * are what a customer actually sees, and they are placed accordingly.
 */
export const NOTE_ASPECT = 3.5;

/** Serials print red across the whole family, as they do in the artwork. */
const SERIAL_RED = "#A33427";

/* ────────────────────────────────────────────────────────────────────────
   Type
   ──────────────────────────────────────────────────────────────────── */

const SERIF = '"Cinzel", "Trajan Pro", "Optima", Georgia, "Times New Roman", serif';
/* The artwork's numerals carry thick/thin contrast and flared terminals — a
   serif, not the grotesque this first used. It is the difference between a
   note and a price tag. */
const FIGURE = 'Georgia, "Times New Roman", "Playfair Display", serif';
const SANS = 'ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif';
const SCRIPT = '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive';
/* Japanese needs a font that actually has the glyphs; the stack ends in a
   generic so a machine without one degrades rather than drawing tofu. */
const CJK = '"Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", "Noto Serif JP", serif';

/* ────────────────────────────────────────────────────────────────────────
   Primitives
   ──────────────────────────────────────────────────────────────────── */

/**
 * A hypotrochoid: the curve a geometric lathe traces, and the reason guilloché
 * looks the way it does. R is the fixed circle, r the rolling one, d the pen's
 * offset from its centre.
 */
function guilloche(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  r: number,
  d: number,
  turns: number,
  step = 0.025,
) {
  ctx.beginPath();
  const k = (R - r) / r;
  for (let t = 0; t <= Math.PI * 2 * turns; t += step) {
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t);
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** The layered medallion: several lathe settings over one another. */
function rosette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  alpha = 0.5,
) {
  ctx.save();
  ctx.strokeStyle = color;
  for (let i = 0; i < 6; i++) {
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = alpha * (0.4 + i * 0.1);
    guilloche(ctx, cx, cy, r * (1 - i * 0.055), r * (0.3 + i * 0.015), r * (0.2 + i * 0.02), 22);
  }
  for (let i = 0; i < 3; i++) {
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = alpha * 0.55;
    guilloche(ctx, cx, cy, r * 0.44, r * (0.12 + i * 0.014), r * (0.1 + i * 0.012), 16);
  }
  ctx.restore();
}

/** The small floral corner ornament, a rosette wound tight. */
function floret(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  /* A tight, many-petalled bloom. A large pen offset with few turns gives a
     spiky asterisk; a small offset with many turns gives the dense rosette the
     artwork uses in its corners. */
  ctx.globalAlpha = 0.5;
  guilloche(ctx, cx, cy, r, r * 0.14, r * 0.11, 26);
  ctx.globalAlpha = 0.38;
  guilloche(ctx, cx, cy, r * 0.66, r * 0.09, r * 0.075, 22);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * The LAWFIC mark: an I and an L set tight, as the artwork has it.
 *
 * Built from the serif face rather than from rectangles. The first version
 * drew the two stems as filled boxes, which is defensible for a logo cut from
 * rules — but the artwork's mark is plainly TYPESET: it has the stroke
 * modulation and the bracketed serifs of a text face, and rectangles cannot
 * produce either. Setting the two characters and tightening the space between
 * them gets both for free, and it holds up at the security thread's few
 * millimetres as well as at the medallion's centimetres.
 */
function mark(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  /* Cap height runs about 70% of the em, so the em has to be larger than the
     height being asked for or the mark comes out short. */
  ctx.font = `700 ${h * 1.42}px ${SERIF}`;
  ctx.letterSpacing = `${-h * 0.06}px`;
  ctx.fillText("IL", cx, cy);
  ctx.letterSpacing = "0px";
  ctx.restore();
}

/** Fine parallel waves — the ground the whole note is printed over. */
function microlines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  spacing: number,
  amp: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let y = -amp; y < h + amp; y += spacing) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const yy = y + Math.sin(x / 110 + y / 60) * amp;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The lace field: the dense diamond mesh that covers the whole note.
 *
 * Two sine families crossed at opposite angles. Interference between them makes
 * the diamond cells and the soft moiré blooms that a plain grid never gets, and
 * it costs two loops rather than a bitmap.
 */
function laceField(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.7;
  for (const dir of [1, -1]) {
    for (let i = -h; i < w + h; i += 11) {
      ctx.beginPath();
      for (let t = 0; t <= h; t += 10) {
        const x = i + t * dir * 0.62 + Math.sin(t / 47 + i / 130) * 9;
        const y = t;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Hatching inside a shape — the whole basis of the intaglio look.
 *
 * Tone on an engraved note comes from how CLOSE the lines are, never from a
 * fill. Everything shaded on these notes goes through here.
 */
function hatch(
  ctx: CanvasRenderingContext2D,
  path: () => void,
  angle: number,
  spacing: number,
  color: string,
  alpha: number,
  w: number,
  h: number,
  lineWidth = 1,
) {
  ctx.save();
  ctx.beginPath();
  path();
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  const diag = Math.hypot(w, h);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let s = -diag; s < diag; s += spacing) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + dx * -diag - dy * s, h / 2 + dy * -diag + dx * s);
    ctx.lineTo(w / 2 + dx * diag - dy * s, h / 2 + dy * diag + dx * s);
    ctx.stroke();
  }
  ctx.restore();
}

/** A ridge line: jagged, with the roughness falling off toward the base. */
function ridge(
  x0: number,
  y0: number,
  x1: number,
  peakY: number,
  seed: number,
  steps = 40,
): [number, number][] {
  const pts: [number, number][] = [];
  let r = seed;
  const rand = () => {
    r = (r * 1103515245 + 12345) & 0x7fffffff;
    return r / 0x7fffffff;
  };
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    /* A single broad hump, so the range has one summit rather than a fence. */
    const hump = Math.sin(t * Math.PI) ** 1.6;
    const jag = (rand() - 0.5) * (y0 - peakY) * 0.16 * hump;
    pts.push([x, y0 - (y0 - peakY) * hump + jag]);
  }
  return pts;
}

/* ────────────────────────────────────────────────────────────────────────
   The engraved scenes
   ──────────────────────────────────────────────────────────────────── */

/** A conifer: a stack of jagged tiers, the way engravers mark a treeline. */
function conifer(ctx: CanvasRenderingContext2D, x: number, y: number, hgt: number) {
  const wid = hgt * 0.42;
  ctx.beginPath();
  ctx.moveTo(x, y - hgt);
  for (let i = 0; i < 4; i++) {
    const t = (i + 1) / 4;
    const w = wid * t;
    const yy = y - hgt * (1 - t);
    ctx.lineTo(x - w * 0.55, yy + hgt * 0.06);
    ctx.lineTo(x - w * 0.35, yy);
  }
  ctx.lineTo(x, y);
  for (let i = 3; i >= 0; i--) {
    const t = (i + 1) / 4;
    const w = wid * t;
    const yy = y - hgt * (1 - t);
    ctx.lineTo(x + w * 0.35, yy);
    ctx.lineTo(x + w * 0.55, yy + hgt * 0.06);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * A broad pine in the Japanese manner: a leaning trunk under flat canopy
 * plates. This is the tree in the client's artwork, right of the landscape and
 * again on the back, and it is what stops the scene reading as generic.
 */
function pine(ctx: CanvasRenderingContext2D, x: number, y: number, hgt: number, ink: string) {
  ctx.save();
  ctx.strokeStyle = ink;

  let s = 7;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  /* Trunk, leaning, with two boughs that reach INTO the canopy plates rather
     than past them. Drawn first and thin: a heavy trunk with sparse foliage
     over it reads as a telephone pole, which is what the first attempt was. */
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = hgt * 0.022;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - hgt * 0.06, y - hgt * 0.45, x + hgt * 0.03, y - hgt * 0.7);
  ctx.stroke();
  ctx.lineWidth = hgt * 0.013;
  for (const [dx, dy, ex, ey] of [
    [-hgt * 0.02, -hgt * 0.5, -hgt * 0.22, -hgt * 0.6],
    [hgt * 0.015, -hgt * 0.6, hgt * 0.2, -hgt * 0.68],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.quadraticCurveTo(x + ex * 0.6, y + dy - hgt * 0.05, x + ex, y + ey);
    ctx.stroke();
  }

  /* Canopy plates as NEEDLE MASS, not outlined shapes.
     Two things were wrong the first time. The plates were drawn with an
     ellipse stroke around them, and the eye reads a hard rim before it reads
     any texture inside it — four fried eggs. And the stipple was two dozen
     dots per plate, which is nowhere near a canopy; foliage needs hundreds of
     marks before it stops looking like specks. So: no rim, density in the
     hundreds, biased toward the centre so the edge dissolves, and every mark a
     short dash on the plate's own angle, which is how an engraver lays
     needles. */
  const plates: [number, number, number, number][] = [
    [x - hgt * 0.25, y - hgt * 0.64, hgt * 0.3, hgt * 0.075],
    [x + hgt * 0.23, y - hgt * 0.73, hgt * 0.26, hgt * 0.065],
    [x - hgt * 0.05, y - hgt * 0.85, hgt * 0.33, hgt * 0.085],
    [x + hgt * 0.28, y - hgt * 0.94, hgt * 0.18, hgt * 0.055],
  ];
  for (const [cx, cy, rx, ry] of plates) {
    const n = Math.round(((rx * ry) / (hgt * hgt)) * 14000);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = rnd() ** 0.55;
      const px = cx + Math.cos(a) * rx * rr;
      const py = cy + Math.sin(a) * ry * rr;
      ctx.globalAlpha = 0.25 + (1 - rr) * 0.6;
      ctx.lineWidth = hgt * 0.005;
      const len = hgt * (0.01 + rnd() * 0.014);
      const ang = -0.15 + (rnd() - 0.5) * 0.8;
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(ang) * len, py - Math.sin(ang) * len);
      ctx.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** An arched viaduct: deck, piers, and the arches between them. */
function viaduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  hgt: number,
  arches: number,
  ink: string,
) {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1.6, hgt * 0.07);

  ctx.beginPath();
  ctx.moveTo(x, y - hgt);
  ctx.lineTo(x + w, y - hgt);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.3, hgt * 0.05);
  ctx.beginPath();
  ctx.moveTo(x, y - hgt * 0.82);
  ctx.lineTo(x + w, y - hgt * 0.82);
  ctx.stroke();

  const span = w / arches;
  ctx.lineWidth = Math.max(1.2, hgt * 0.045);
  for (let i = 0; i < arches; i++) {
    const ax = x + span * (i + 0.5);
    ctx.beginPath();
    ctx.arc(ax, y - hgt * 0.82, span * 0.38, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax - span * 0.38, y - hgt * 0.82);
    ctx.lineTo(ax - span * 0.38, y);
    ctx.moveTo(ax + span * 0.38, y - hgt * 0.82);
    ctx.lineTo(ax + span * 0.38, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Water: horizontal rules, closer together at the far shore. */
function water(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  hgt: number,
  ink: string,
) {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const yy = y + hgt * t * t;
    if (yy > y + hgt) break;
    ctx.globalAlpha = 0.45 - t * 0.28;
    ctx.beginPath();
    for (let px = x; px <= x + w; px += 10) {
      const wob = Math.sin(px / 40 + i) * hgt * 0.006;
      if (px === x) ctx.moveTo(px, yy + wob);
      else ctx.lineTo(px, yy + wob);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The landscape on the front: a range over a lake, a viaduct crossing it, and
 * a pine on a rocky outcrop to the right.
 */
function mountainScene(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
  paper: string,
) {
  const horizon = y + h * 0.62;

  /* The faint sun disc the artwork sets behind the peaks. */
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + w * 0.34, y + h * 0.3, h * 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  /* Three ranges, far to near, each darker than the one behind it.
     The main range is the NARROWEST of the three, not the widest: a summit
     needs shoulders falling away from it to read as a peak, and a broad ridge
     spanning the whole scene reads as a fence however jagged it is. */
  const ranges: [number, number, number, number, number][] = [
    [x - w * 0.06, x + w * 0.52, y + h * 0.3, 0.1, 11],
    [x + w * 0.44, x + w * 1.06, y + h * 0.26, 0.14, 29],
    [x + w * 0.24, x + w * 0.72, y - h * 0.02, 0.26, 53],
  ];

  for (const [x0, x1, peak, alpha, seed] of ranges) {
    const pts = ridge(x0, horizon, x1, peak, seed);
    const outline = () => {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.lineTo(x1, horizon);
      ctx.lineTo(x0, horizon);
      ctx.closePath();
    };

    /* Shading, and it is hatching rather than fill: the slopes are dark
       because the lines are close, which is what intaglio actually does. */
    hatch(ctx, outline, -1.05, Math.max(2, h * 0.013), ink, alpha + 0.26, ctx.canvas.width, ctx.canvas.height, 1);
    hatch(ctx, outline, 0.55, Math.max(3, h * 0.022), ink, alpha + 0.1, ctx.canvas.width, ctx.canvas.height, 1);

    /* Ridge line on top, drawn heavier than the shading. */
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.stroke();

    /* Snow: the summit left unhatched, which is how an engraver makes white.
       Painted in the paper colour rather than punched out with
       destination-out — that erased the lace and the paper along with the
       hatching and left literal white holes in the note. */
    const summit = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
    ctx.fillStyle = paper;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(summit[0] - h * 0.09, summit[1] + h * 0.13);
    ctx.lineTo(summit[0] - h * 0.03, summit[1] + h * 0.02);
    ctx.lineTo(summit[0], summit[1] + h * 0.06);
    ctx.lineTo(summit[0] + h * 0.04, summit[1] + h * 0.01);
    ctx.lineTo(summit[0] + h * 0.1, summit[1] + h * 0.14);
    ctx.lineTo(summit[0] + h * 0.04, summit[1] + h * 0.1);
    ctx.lineTo(summit[0] - h * 0.02, summit[1] + h * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Treeline along the shore.
     Weighted to the flanks. Spread evenly it filled the middle distance and
     buried the valley the viaduct crosses, which is the one place the artwork
     keeps open. Squaring a centred coordinate pushes the density outward. */
  ctx.save();
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.7;
  let s = 91;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < 110; i++) {
    const c = rnd() * 2 - 1;
    const t = 0.5 + (Math.sign(c) * c * c) / 2;
    const tx = x + w * (0.01 + t * 0.94);
    const ty = horizon - rnd() * h * 0.05;
    conifer(ctx, tx, ty, h * (0.045 + rnd() * 0.055));
  }
  ctx.restore();

  /* The lake, and the viaduct crossing it. */
  water(ctx, x, horizon, w, h * 0.38, ink);
  viaduct(ctx, x + w * 0.1, horizon + h * 0.1, w * 0.34, h * 0.11, 5, ink);

  /* Foreground right: a rock, and the pine standing on it. */
  const rx = x + w * 0.82;
  const ry = y + h;
  const rock = () => {
    ctx.moveTo(rx - w * 0.16, ry);
    ctx.lineTo(rx - w * 0.11, ry - h * 0.16);
    ctx.lineTo(rx - w * 0.02, ry - h * 0.2);
    ctx.lineTo(rx + w * 0.1, ry - h * 0.13);
    ctx.lineTo(rx + w * 0.19, ry);
    ctx.closePath();
  };
  hatch(ctx, rock, -0.9, Math.max(2.4, h * 0.018), ink, 0.5, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  rock();
  ctx.stroke();
  ctx.restore();

  pine(ctx, rx, ry - h * 0.17, h * 0.62, ink);
}

/**
 * The city on the back: a tower cluster behind a flyover, with a tree at the
 * right and water beneath — the artwork's second engraving.
 */
function cityScene(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
) {
  const base = y + h * 0.62;

  /* Towers. Two tall ones with spires, the rest stepping down around them. */
  const towers: [number, number, number][] = [
    [0.02, 0.3, 0.09],
    [0.11, 0.46, 0.07],
    [0.19, 0.24, 0.1],
    [0.3, 0.56, 0.06],
    [0.38, 0.14, 0.075],
    [0.47, 0.05, 0.085],
    [0.57, 0.2, 0.07],
    [0.65, 0.44, 0.08],
    [0.75, 0.34, 0.06],
  ];

  for (const [fx, topT, wT] of towers) {
    const tx = x + w * fx;
    const ty = y + h * topT;
    const tw = w * wT;
    const body = () => {
      ctx.rect(tx, ty, tw, base - ty);
    };
    hatch(ctx, body, Math.PI / 2, Math.max(2.4, tw * 0.1), ink, 0.4, ctx.canvas.width, ctx.canvas.height);
    hatch(ctx, body, 0, Math.max(3.2, h * 0.03), ink, 0.28, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(tx, ty, tw, base - ty);
    /* A spire on the two tallest. */
    if (topT < 0.16) {
      ctx.beginPath();
      ctx.moveTo(tx + tw / 2, ty);
      ctx.lineTo(tx + tw / 2, ty - h * 0.11);
      ctx.stroke();
    }
    ctx.restore();
  }

  water(ctx, x, base, w, h * 0.38, ink);
  viaduct(ctx, x - w * 0.02, base + h * 0.16, w * 0.6, h * 0.13, 4, ink);
  pine(ctx, x + w * 0.92, y + h * 0.92, h * 0.78, ink);
}

/**
 * The world map behind the back's left third.
 *
 * Deliberately low-fidelity outlines: it is printed at a few per cent opacity
 * as a ground, and a survey-accurate coastline would cost kilobytes to say the
 * same thing at that alpha.
 */
const LANDMASSES: [number, number][][] = [
  [[0.10, 0.18], [0.20, 0.11], [0.30, 0.15], [0.31, 0.28], [0.26, 0.36], [0.22, 0.45], [0.18, 0.37], [0.13, 0.29], [0.08, 0.25]],
  [[0.33, 0.05], [0.41, 0.04], [0.43, 0.12], [0.36, 0.15]],
  [[0.26, 0.50], [0.33, 0.48], [0.35, 0.59], [0.32, 0.73], [0.28, 0.81], [0.25, 0.70], [0.24, 0.57]],
  [[0.46, 0.13], [0.55, 0.11], [0.58, 0.21], [0.52, 0.28], [0.47, 0.23]],
  [[0.48, 0.30], [0.58, 0.30], [0.61, 0.42], [0.56, 0.59], [0.51, 0.67], [0.47, 0.55], [0.45, 0.40]],
  [[0.57, 0.09], [0.75, 0.07], [0.89, 0.13], [0.91, 0.24], [0.82, 0.31], [0.73, 0.37], [0.67, 0.31], [0.61, 0.28], [0.58, 0.19]],
  [[0.67, 0.31], [0.72, 0.30], [0.71, 0.42], [0.68, 0.36]],
  [[0.78, 0.41], [0.87, 0.43], [0.86, 0.48], [0.78, 0.46]],
  [[0.83, 0.56], [0.93, 0.55], [0.94, 0.65], [0.86, 0.67], [0.82, 0.61]],
];

function worldMap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (const land of LANDMASSES) {
    ctx.beginPath();
    land.forEach(([lx, ly], i) => {
      const px = x + lx * w;
      const py = y + ly * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The windowed security thread: a dark band carrying the monogram in repeat,
 * the way a real thread surfaces through the paper in windows.
 */
function securityThread(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ink: string,
) {
  ctx.save();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "#2A251E");
  g.addColorStop(0.32, "#5A5044");
  g.addColorStop(0.58, "#332D26");
  g.addColorStop(1, "#211D18");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  /* The windows: the thread shows through in a regular ladder. */
  const step = h / 11;
  for (let i = 0; i < 11; i++) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y + i * step + step * 0.82, w, step * 0.18);
    ctx.globalAlpha = 1;
    mark(ctx, x + w / 2, y + i * step + step * 0.42, step * 0.5, "#D9D2C4");
  }
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function caps(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  tracking: number,
  weight = 500,
  font = SANS,
) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.letterSpacing = `${tracking}px`;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = "0px";
}

/**
 * Set text and shrink it until it fits the width it is given.
 *
 * The left block of the front runs into the security thread if anything in it
 * is a little wider than expected, and two things make that likely rather than
 * hypothetical: the note family runs to four digits, so "1000" is nearly twice
 * the width of "10"; and the fallback font differs by machine, so a size that
 * clears the thread here may not on someone else's. Measuring and scaling is
 * the only version of this that is correct on every note and every device.
 */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  tracking: number,
  weight: number,
  font: string,
) {
  let s = size;
  let t = tracking;
  for (let i = 0; i < 12; i++) {
    ctx.font = `${weight} ${s}px ${font}`;
    ctx.letterSpacing = `${t}px`;
    if (ctx.measureText(text).width <= maxWidth) break;
    s *= 0.94;
    t *= 0.94;
  }
  ctx.fillText(text, x, y);
  ctx.letterSpacing = "0px";
}

/* ────────────────────────────────────────────────────────────────────────
   The note
   ──────────────────────────────────────────────────────────────────── */

const cache = new Map<string, THREE.CanvasTexture>();

/**
 * Draw one face of a note and return it as a texture.
 *
 * Cached: six denominations by two faces is twelve canvases of several thousand
 * curves each, and redrawing one while the wallet is animating would be a
 * visible stall. They are built on demand, so a wallet showing three
 * denominations pays for three.
 */
export function noteTexture(design: NoteDesign, face: "front" | "back"): THREE.CanvasTexture {
  const key = `${design.value}-${face}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const W = 2048;
  const H = Math.round(W / NOTE_ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const { paper, ink, lace, laceAlt, serial } = design;
  const v = String(design.value);

  /* Paper, then the grounds it is printed over. */
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);
  laceField(ctx, W, H, lace, 0.16);
  microlines(ctx, W, H, laceAlt, 9, 6, 0.14);

  /* Lace blooms: rosettes low in the stack, the way the artwork's ground is
     built up from overlapping lathe work rather than one flat pattern. */
  rosette(ctx, W * 0.1, H * 0.5, H * 0.42, lace, 0.16);
  rosette(ctx, W * 0.52, H * 0.46, H * 0.5, lace, 0.12);
  rosette(ctx, W * 0.88, H * 0.52, H * 0.4, laceAlt, 0.14);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  if (face === "front") {
    /* ── LEFT ─────────────────────────────────────────────── */
    /* Both of these are bounded by the security thread at 0.227. A four-digit
       value and a fourteen-character wordmark both ran under the foil when
       they were set at a fixed size. */
    const gutter = W * 0.227 - W * 0.045 - W * 0.012;
    ctx.fillStyle = ink;
    fitText(ctx, v, W * 0.045, H * 0.3, gutter, H * 0.28, 0, 700, FIGURE);
    fitText(ctx, "LAWFIC CREDITS", W * 0.048, H * 0.395, gutter, H * 0.068, H * 0.01, 700, SANS);

    ctx.globalAlpha = 0.9;
    const promise = ["A", "BETTER", "TOMORROW", "IN YOUR HANDS."];
    promise.forEach((line, i) => {
      caps(ctx, line, W * 0.048, H * 0.53 + i * H * 0.075, H * 0.05, H * 0.014, 400);
    });
    ctx.globalAlpha = 1;

    /* Signature over the office it signs for. Both invented, and the office
       is titled so that nobody reads it as an issuing authority. */
    ctx.font = `italic 400 ${H * 0.1}px ${SCRIPT}`;
    ctx.fillText("Lawfic", W * 0.052, H * 0.855);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = ink;
    ctx.beginPath();
    ctx.moveTo(W * 0.048, H * 0.885);
    ctx.lineTo(W * 0.2, H * 0.885);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    caps(ctx, "CHIEF VISION OFFICER", W * 0.048, H * 0.945, H * 0.042, H * 0.008, 500);
    ctx.globalAlpha = 1;

    securityThread(ctx, W * 0.227, 0, W * 0.029, H, ink);

    /* ── CENTRE ───────────────────────────────────────────── */
    ctx.textAlign = "center";
    ctx.fillStyle = ink;
    ctx.font = `400 ${H * 0.2}px ${SERIF}`;
    ctx.letterSpacing = `${H * 0.03}px`;
    ctx.fillText("LAWFIC", W * 0.545, H * 0.26);
    /* Measured, because the wordmark's width depends on which serif the
       viewer actually has. A hard-coded offset put the ™ through the C. */
    const wmW = ctx.measureText("LAWFIC").width;
    ctx.letterSpacing = "0px";
    ctx.textAlign = "left";
    ctx.font = `400 ${H * 0.055}px ${SANS}`;
    ctx.fillText("™", W * 0.545 + wmW / 2 + H * 0.012, H * 0.175);
    ctx.textAlign = "center";

    ctx.globalAlpha = 0.9;
    caps(ctx, "PEOPLE  PROGRESS  POSSIBILITIES", W * 0.545, H * 0.335, H * 0.046, H * 0.015, 400);
    ctx.globalAlpha = 1;

    mountainScene(ctx, W * 0.285, H * 0.33, W * 0.42, H * 0.62, ink, paper);

    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.92;
    caps(ctx, "BUILT ON TRUST", W * 0.5, H * 0.895, H * 0.055, H * 0.024, 400);
    caps(ctx, "BACKED BY PEOPLE", W * 0.5, H * 0.965, H * 0.055, H * 0.024, 400);
    ctx.globalAlpha = 1;

    /* ── RIGHT ────────────────────────────────────────────── */
    rosette(ctx, W * 0.795, H * 0.44, H * 0.235, ink, 0.42);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W * 0.795, H * 0.44, H * 0.245, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    mark(ctx, W * 0.797, H * 0.44, H * 0.2, `${ink}D0`);

    ctx.textAlign = "left";
    ctx.fillStyle = SERIAL_RED;
    fitText(ctx, serial, W * 0.75, H * 0.185, W * 0.16, H * 0.095, H * 0.014, 500, SANS);

    floret(ctx, W * 0.947, H * 0.16, H * 0.075, ink);
    floret(ctx, W * 0.947, H * 0.16, H * 0.04, ink);

    /* 未来へ共に — "toward the future, together", set vertically as the
       artwork has it. */
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.85;
    ctx.font = `400 ${H * 0.075}px ${CJK}`;
    /* Set high enough to finish above the corner value: five glyphs stepping
       from 0.4 put the last one straight through the top of the numeral. */
    "未来へ共に".split("").forEach((ch, i) => {
      ctx.fillText(ch, W * 0.925, H * (0.33 + i * 0.085));
    });
    ctx.globalAlpha = 1;

    ctx.textAlign = "right";
    ctx.fillStyle = ink;
    ctx.font = `700 ${H * 0.2}px ${FIGURE}`;
    ctx.fillText(v, W * 0.958, H * 0.86);
    caps(ctx, "LAWFIC CREDITS", W * 0.958, H * 0.935, H * 0.058, H * 0.01, 700);
    ctx.textAlign = "left";
  } else {
    /* ── BACK ─────────────────────────────────────────────── */
    worldMap(ctx, W * 0.02, H * 0.12, W * 0.3, H * 0.72, ink, 0.13);

    ctx.fillStyle = ink;
    ctx.font = `700 ${H * 0.2}px ${FIGURE}`;
    ctx.fillText(v, W * 0.045, H * 0.22);
    caps(ctx, "LAWFIC CREDITS", W * 0.048, H * 0.29, H * 0.058, H * 0.01, 700);

    ctx.globalAlpha = 0.9;
    ["DISCIPLINE", "CREATES", "FREEDOM"].forEach((line, i) => {
      caps(ctx, line, W * 0.048, H * 0.6 + i * H * 0.075, H * 0.05, H * 0.014, 400);
    });
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(W * 0.048, H * 0.815);
    ctx.lineTo(W * 0.14, H * 0.815);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.font = `400 ${H * 0.16}px ${SERIF}`;
    ctx.letterSpacing = `${H * 0.02}px`;
    ctx.fillText("LAWFIC", W * 0.048, H * 0.95);
    const backWm = ctx.measureText("LAWFIC").width;
    ctx.letterSpacing = "0px";
    ctx.font = `400 ${H * 0.045}px ${SANS}`;
    ctx.fillText("™", W * 0.048 + backWm + H * 0.008, H * 0.885);

    ctx.textAlign = "center";
    ctx.globalAlpha = 0.92;
    caps(ctx, "MORE THAN A WALLET.", W * 0.5, H * 0.11, H * 0.055, H * 0.024, 400);
    ctx.globalAlpha = 1;

    rosette(ctx, W * 0.5, H * 0.52, H * 0.3, ink, 0.4);
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    for (const rr of [0.31, 0.335]) {
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.52, H * rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    mark(ctx, W * 0.502, H * 0.52, H * 0.24, ink);

    /* Pulled left of where it started: the pine at the scene's right edge
       was landing under PEOPLE / PROGRESS / POSSIBILITIES. */
    cityScene(ctx, W * 0.54, H * 0.2, W * 0.26, H * 0.68, ink);

    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.92;
    caps(ctx, "A BRIGHTER YOU.", W * 0.5, H * 0.94, H * 0.055, H * 0.024, 400);
    ctx.globalAlpha = 1;

    ctx.textAlign = "right";
    ctx.font = `700 ${H * 0.2}px ${FIGURE}`;
    ctx.fillText(v, W * 0.958, H * 0.22);

    ctx.globalAlpha = 0.9;
    ["PEOPLE", "PROGRESS", "POSSIBILITIES"].forEach((line, i) => {
      caps(ctx, line, W * 0.958, H * 0.66 + i * H * 0.075, H * 0.05, H * 0.012, 400);
    });
    caps(ctx, "A MORE INCLUSIVE TOMORROW", W * 0.958, H * 0.945, H * 0.042, H * 0.008, 400);
    ctx.globalAlpha = 1;

    floret(ctx, W * 0.925, H * 0.86, H * 0.06, ink);
    ctx.textAlign = "left";
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

export function disposeNoteCache() {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}

/**
 * Break an amount into notes, largest first.
 *
 * Paise in, because that is the unit the ledger uses everywhere else and
 * converting at the boundary is how the two stay agreed.
 */
export function breakIntoNotes(paise: number, max = 6): Denomination[] {
  let credits = Math.floor(Math.max(0, paise) / 100);
  const out: Denomination[] = [];
  for (const d of [...DENOMINATIONS].sort((a, b) => b.value - a.value)) {
    while (credits >= d.value && out.length < max) {
      out.push(d.value);
      credits -= d.value;
    }
  }
  /* Nothing large enough? Show the smallest rather than an empty wallet. */
  if (out.length === 0 && paise > 0) out.push(10);
  return out;
}
