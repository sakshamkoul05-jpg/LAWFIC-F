import * as THREE from "three";

/**
 * Procedural PBR maps for the wallet, generated on a canvas at runtime.
 *
 * WHY GENERATED RATHER THAN LOADED
 *
 * A convincing leather material needs a normal map, a roughness map and some
 * variation across the surface. The usual way to get those is a downloaded
 * texture set, which for ten colourways at a useful resolution is several
 * megabytes of binary sitting in the repo, versioned, and shipped to a phone.
 * Generating them costs a few milliseconds once, weighs nothing, and — the part
 * that actually matters — lets the GRAIN be a parameter, so nubuck and polished
 * calf differ in their surface rather than only in their colour.
 *
 * The maps are cached per material key. Regenerating on every re-render would
 * stall the frame the customiser is trying to animate.
 *
 * WHAT MAKES LEATHER LOOK LIKE LEATHER
 *
 * Three things, none of which is the base colour:
 *
 *   1. a NORMAL map with pebbling at two scales — big soft cells from the hide
 *      and fine tooth on top of them. One scale alone reads as sandpaper;
 *   2. ROUGHNESS that varies with the pebbling, because the raised parts have
 *      been polished by handling and the valleys have not. Uniform roughness is
 *      what makes rendered leather look like painted rubber;
 *   3. slight roughness drift across the whole panel, so one area catches the
 *      key light differently from another. Perfectly uniform is the tell of a
 *      material that was typed rather than tanned.
 */

export type LeatherSpec = {
  /** Base colour, linear-ish sRGB hex. */
  color: string;
  /** 0 polished calf, 1 heavy pebble, >1 nubuck nap. */
  grain: number;
  /** Average roughness. Nubuck ~0.95, polished calf ~0.35. */
  roughness: number;
  /** Fine-grain frequency multiplier. High for suede. */
  tooth: number;
};

type Maps = { normal: THREE.Texture; rough: THREE.Texture };

/** Stable per-hide seed, so a colourway looks the same on every load. */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const cache = new Map<string, Maps>();

/**
 * A proper 2D hash, and the reason the first attempt failed.
 *
 * The obvious value-noise hash — perm[perm[x] + y] — correlates strongly along
 * one axis, because for a fixed row the y term is a constant offset into the
 * same permutation. Rendered on a wallet that produced horizontal STRIPES
 * rather than grain, which is unmistakable once you have seen it and invisible
 * while you are writing it. This mixes both coordinates into the avalanche, so
 * neighbouring rows are genuinely unrelated.
 */
function hash2(x: number, y: number, seed: number): number {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + seed * 2147483647;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

/** Several octaves, so the surface has structure at more than one scale. */
function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

/**
 * Worley/cellular noise: distance to the nearest scattered feature point.
 *
 * This is what actually makes leather look like leather. Pebble grain is a
 * field of raised CELLS with valleys between them, which is exactly what a
 * cellular distance field describes and exactly what smooth value noise does
 * not — value noise gives you clouds, and clouds on a wallet read as suede at
 * best and as a smudge at worst.
 */
function worley(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let best = 8;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = xi + ox;
      const cy = yi + oy;
      const px = cx + hash2(cx, cy, seed);
      const py = cy + hash2(cx, cy, seed + 991);
      const d = (px - x) * (px - x) + (py - y) * (py - y);
      if (d < best) best = d;
    }
  }
  return Math.min(1, Math.sqrt(best));
}

/**
 * A height field for the hide, then the normal and roughness derived from it.
 *
 * Deriving both from ONE height field is what keeps them consistent: a raised
 * pebble is lit as raised and is also smoother, because the same bump that
 * catches the light is the bit a thumb has polished. Generating them
 * independently is how you get leather whose highlights and sheen disagree.
 */
export function leatherMaps(key: string, spec: LeatherSpec, size = 512): Maps {
  const hit = cache.get(key);
  if (hit) return hit;

  const seed = Math.abs(hashString(key));
  const height = new Float32Array(size * size);

  /* Cell size for the pebbling. Coarse for cowhide, fine for nubuck. */
  const cells = 9 + spec.grain * 7;
  const toothFreq = 60 * spec.tooth;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      /* Raised cells with valleys between them: the pebble grain itself. */
      const cell = 1 - worley(u * cells, v * cells, seed);
      /* Broad drift, so one region of the hide differs from another. */
      const broad = fbm(u * 3.2, v * 3.2, seed + 5, 3);
      /* Tooth: the fine finish sitting on top of the cells. */
      const tooth = fbm(u * toothFreq, v * toothFreq, seed + 9, 2);

      height[y * size + x] =
        cell * (0.42 + spec.grain * 0.3) + broad * 0.28 + tooth * 0.18 * spec.tooth;
    }
  }

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = normalCanvas.height = size;
  const nctx = normalCanvas.getContext("2d")!;
  const nimg = nctx.createImageData(size, size);

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = roughCanvas.height = size;
  const rctx = roughCanvas.getContext("2d")!;
  const rimg = rctx.createImageData(size, size);

  const strength = 2.6 * Math.max(0.25, spec.grain);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const l = height[y * size + ((x - 1 + size) % size)];
      const r = height[y * size + ((x + 1) % size)];
      const u = height[((y - 1 + size) % size) * size + x];
      const d = height[((y + 1) % size) * size + x];

      /* Sobel-ish gradient into a tangent-space normal. */
      const nx = (l - r) * strength;
      const ny = (u - d) * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);

      const p = i * 4;
      nimg.data[p] = ((nx / len) * 0.5 + 0.5) * 255;
      nimg.data[p + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      nimg.data[p + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      nimg.data[p + 3] = 255;

      /* Raised is smoother; valleys keep their tooth. Plus a slow drift so the
         panel is not uniform. */
      const drift = fbm((x / size) * 2.5, (y / size) * 2.5, seed + 31, 2) * 0.14 - 0.07;
      const rough = THREE.MathUtils.clamp(
        spec.roughness - (height[i] - 0.55) * 0.3 + drift,
        0.05,
        1,
      );
      rimg.data[p] = rimg.data[p + 1] = rimg.data[p + 2] = rough * 255;
      rimg.data[p + 3] = 255;
    }
  }

  nctx.putImageData(nimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);

  const normal = new THREE.CanvasTexture(normalCanvas);
  const rough = new THREE.CanvasTexture(roughCanvas);
  for (const t of [normal, rough]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
  }
  /* Colour data must not be treated as sRGB, or the lighting is wrong in a way
     that is hard to see and impossible to unsee. */
  normal.colorSpace = THREE.NoColorSpace;
  rough.colorSpace = THREE.NoColorSpace;

  const maps = { normal, rough };
  cache.set(key, maps);
  return maps;
}

/** Dispose everything generated. Called when the scene unmounts. */
export function disposeMaterialCache() {
  for (const m of cache.values()) {
    m.normal.dispose();
    m.rough.dispose();
  }
  cache.clear();
}
