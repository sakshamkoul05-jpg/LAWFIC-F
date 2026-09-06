import * as THREE from "three";

/**
 * LAWFIC currency: original notes, drawn rather than reproduced.
 *
 * WHY THIS EXISTS AT ALL
 *
 * Earlier versions drew stylised Indian rupees and had to stop short of
 * everything that makes a note look like a note — no emblem, no portrait, no
 * issuer, because the Ashoka Lion Capital is protected by statute and a
 * convincing facsimile of legal tender is not a thing to put on a website. The
 * result was a note with its identity removed, which is why it kept reading as
 * a coloured slip.
 *
 * An invented currency has no such problem. Nothing here imitates any real
 * note: the emblem, the ornament, the layout and the denominations are LAWFIC's
 * own, and the design can therefore be finished rather than curtailed.
 *
 * HOW REAL NOTES GET THEIR LOOK, AND HOW THIS DOES
 *
 * The fine spirograph lacework on banknotes is called guilloché, and it is not
 * drawn by hand — it is traced by a geometric lathe, which is to say it is the
 * plot of a hypotrochoid. So it is generated here the same way, from the same
 * maths, at a line weight fine enough to alias pleasantly rather than a texture
 * pretending to be one. That single decision does most of the work: a rosette
 * of two thousand mathematically-related curves is instantly legible as
 * security printing and cannot be mistaken for clip art.
 *
 * On top of it: a microline ground, an intaglio border, a denomination in two
 * weights, a polymer-style clear window, and the LAWFIC monogram. Drawn at 4x
 * the display size so the fine work survives being mapped onto geometry and
 * seen at a glancing angle.
 */

export type Denomination = 100 | 500 | 1000 | 2000 | 5000;

export type NoteDesign = {
  value: Denomination;
  name: string;
  /** Base paper tint. */
  paper: string;
  /** The intaglio ink: borders, lacework, numerals. */
  ink: string;
  /** Secondary ink for the underlay, a shade apart from the first. */
  accent: string;
  /** Where the guilloché rosette sits, as a fraction of width. */
  rosette: number;
};

/**
 * Five denominations, each with its own colour family.
 *
 * Restrained on purpose. Real high-denomination notes are not saturated — the
 * colour identifies the value at arm's length and then gets out of the way of
 * the printing, and a note in primary colours reads as play money however fine
 * the lacework on it is.
 */
export const DENOMINATIONS: NoteDesign[] = [
  { value: 100, name: "One Hundred", paper: "#DFE6EC", ink: "#2C4657", accent: "#6F8DA3", rosette: 0.63 },
  { value: 500, name: "Five Hundred", paper: "#D8E2D6", ink: "#22412F", accent: "#5E8468", rosette: 0.63 },
  { value: 1000, name: "One Thousand", paper: "#E6D9DA", ink: "#4A1F27", accent: "#93606A", rosette: 0.63 },
  { value: 2000, name: "Two Thousand", paper: "#DFD9E6", ink: "#372A50", accent: "#7C6CA0", rosette: 0.63 },
  { value: 5000, name: "Five Thousand", paper: "#E8DFCC", ink: "#4A3A18", accent: "#9C8348", rosette: 0.63 },
];

export function getDenomination(v: number): NoteDesign | undefined {
  return DENOMINATIONS.find((d) => d.value === v);
}

/* Real note proportions: 142 x 66mm, the size the brief asked for. */
export const NOTE_ASPECT = 142 / 66;

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
  step = 0.02,
) {
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 2 * turns; t += step) {
    const k = (R - r) / r;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin(k * t);
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/** The LAWFIC mark: an original geometric monogram, not a logo file. */
function monogram(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.055;
  ctx.lineJoin = "round";

  /* An L and an F sharing a stem, inside a hexagonal seal. */
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * s;
    const y = Math.sin(a) * s;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-s * 0.26, -s * 0.42);
  ctx.lineTo(-s * 0.26, s * 0.42);
  ctx.lineTo(s * 0.3, s * 0.42);
  ctx.moveTo(-s * 0.26, -s * 0.42);
  ctx.lineTo(s * 0.32, -s * 0.42);
  ctx.moveTo(-s * 0.26, -s * 0.02);
  ctx.lineTo(s * 0.16, -s * 0.02);
  ctx.stroke();
  ctx.restore();
}

/** Fine parallel waves — the ground every note is printed over. */
function microlines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  spacing: number,
  amp: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let y = -amp; y < h + amp; y += spacing) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const yy = y + Math.sin(x / 90 + y / 55) * amp;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
}

const cache = new Map<string, THREE.CanvasTexture>();

/**
 * Draw one face of a note and return it as a texture.
 *
 * Cached: five denominations times two faces is ten canvases, and redrawing a
 * few thousand curves while the wallet is animating would be visible.
 */
export function noteTexture(design: NoteDesign, face: "front" | "back"): THREE.CanvasTexture {
  const key = `${design.value}-${face}`;
  const hit = cache.get(key);
  if (hit) return hit;

  /* 4x display size, so the lacework survives a glancing angle. */
  const W = 1704;
  const H = Math.round(W / NOTE_ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const { paper, ink, accent } = design;

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  /* Ground: microlines, then a wash so the paper is not flat. */
  ctx.globalAlpha = 0.32;
  microlines(ctx, W, H, accent, 7, 5);
  ctx.globalAlpha = 1;

  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, `${accent}22`);
  wash.addColorStop(0.5, "#ffffff18");
  wash.addColorStop(1, `${accent}30`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  /* The rosette. Layered lathe curves, each a little different. */
  const rx = W * (face === "front" ? design.rosette : 1 - design.rosette);
  const ry = H * 0.5;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = ink;
  const base = H * 0.38;
  for (let i = 0; i < 7; i++) {
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = 0.16 + i * 0.035;
    guilloche(ctx, rx, ry, base * (1 - i * 0.06), base * (0.30 + i * 0.014), base * (0.19 + i * 0.02), 24);
  }
  /* A tighter counter-rosette inside it. */
  for (let i = 0; i < 4; i++) {
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.2;
    guilloche(ctx, rx, ry, base * 0.42, base * (0.11 + i * 0.012), base * (0.1 + i * 0.01), 18);
  }
  ctx.globalAlpha = 1;

  /* Polymer-style clear window, the way the newer note families do it. */
  const winX = face === "front" ? W * 0.06 : W * 0.82;
  const winW = W * 0.12;
  const win = ctx.createLinearGradient(winX, 0, winX + winW, 0);
  win.addColorStop(0, `${paper}00`);
  win.addColorStop(0.5, "#ffffffcc");
  win.addColorStop(1, `${paper}00`);
  ctx.fillStyle = win;
  ctx.beginPath();
  ctx.roundRect(winX, H * 0.16, winW, H * 0.68, winW * 0.42);
  ctx.fill();
  ctx.strokeStyle = `${ink}55`;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  monogram(ctx, winX + winW / 2, H * 0.5, winW * 0.3, `${ink}88`);

  /* Intaglio frame: two rules and corner ornament. */
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 5;
  ctx.strokeRect(W * 0.022, H * 0.045, W * 0.956, H * 0.91);
  ctx.lineWidth = 1.6;
  ctx.strokeRect(W * 0.032, H * 0.065, W * 0.936, H * 0.87);
  ctx.globalAlpha = 1;

  for (const [ox, oy] of [
    [W * 0.032, H * 0.065],
    [W * 0.968, H * 0.065],
    [W * 0.032, H * 0.935],
    [W * 0.968, H * 0.935],
  ]) {
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    guilloche(ctx, ox, oy, H * 0.075, H * 0.026, H * 0.02, 8);
    ctx.globalAlpha = 1;
  }

  if (face === "front") {
    /* Issuer line. An invented institution, stated as one. */
    ctx.fillStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 ${H * 0.062}px ui-sans-serif, system-ui, sans-serif`;
    ctx.letterSpacing = `${H * 0.014}px`;
    ctx.fillText("LAWFIC RESERVE", W * 0.225, H * 0.185);

    ctx.font = `400 ${H * 0.036}px ui-sans-serif, system-ui, sans-serif`;
    ctx.letterSpacing = `${H * 0.006}px`;
    ctx.globalAlpha = 0.72;
    ctx.fillText("WALLET INSTRUMENT · NOT LEGAL TENDER", W * 0.225, H * 0.255);
    ctx.globalAlpha = 1;

    /* The value, in two weights. */
    ctx.letterSpacing = "0px";
    ctx.font = `700 ${H * 0.3}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(String(design.value), W * 0.225, H * 0.66);

    ctx.font = `500 ${H * 0.058}px ui-sans-serif, system-ui, sans-serif`;
    ctx.letterSpacing = `${H * 0.012}px`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(design.name.toUpperCase(), W * 0.228, H * 0.75);
    ctx.globalAlpha = 1;

    /* Reference, in a format that is plainly ours rather than a serial. */
    ctx.font = `500 ${H * 0.042}px ui-monospace, monospace`;
    ctx.letterSpacing = `${H * 0.008}px`;
    ctx.globalAlpha = 0.6;
    ctx.fillText(`LWF · ${design.value} · SERIES I`, W * 0.228, H * 0.86);
    ctx.globalAlpha = 1;

    /* Corner value, mirrored top-right the way notes carry it. */
    ctx.textAlign = "right";
    ctx.font = `700 ${H * 0.11}px ui-sans-serif, system-ui, sans-serif`;
    ctx.letterSpacing = "0px";
    ctx.fillText(String(design.value), W * 0.955, H * 0.2);
    ctx.textAlign = "left";
  } else {
    /* The back is a composition, not a repeat of the front. */
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    /* An architectural fan — original, abstract, no landmark. */
    const bx = W * 0.34;
    const by = H * 0.78;
    for (let i = 0; i <= 22; i++) {
      const a = -Math.PI / 2 + (i / 22 - 0.5) * 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a) * H * 0.62, by + Math.sin(a) * H * 0.62);
      ctx.stroke();
    }
    for (let r = 0.16; r <= 0.62; r += 0.077) {
      ctx.beginPath();
      ctx.arc(bx, by, H * r, -Math.PI / 2 - 0.75, -Math.PI / 2 + 0.75);
      ctx.stroke();
    }
    ctx.restore();

    monogram(ctx, W * 0.34, H * 0.42, H * 0.13, ink);

    ctx.fillStyle = ink;
    ctx.textAlign = "right";
    ctx.font = `700 ${H * 0.2}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(String(design.value), W * 0.94, H * 0.62);
    ctx.font = `500 ${H * 0.045}px ui-sans-serif, system-ui, sans-serif`;
    ctx.letterSpacing = `${H * 0.012}px`;
    ctx.globalAlpha = 0.8;
    ctx.fillText("LAWFIC RESERVE", W * 0.94, H * 0.72);
    ctx.globalAlpha = 1;
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
  let rupees = Math.floor(Math.max(0, paise) / 100);
  const out: Denomination[] = [];
  for (const d of DENOMINATIONS.slice().sort((a, b) => b.value - a.value)) {
    while (rupees >= d.value && out.length < max) {
      out.push(d.value);
      rupees -= d.value;
    }
  }
  /* Nothing large enough? Show the smallest rather than an empty wallet. */
  if (out.length === 0 && paise > 0) out.push(100);
  return out;
}
