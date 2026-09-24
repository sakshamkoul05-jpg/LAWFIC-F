"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * The wax seal.
 *
 * WHY A SEAL, ON THIS WALLET
 *
 * LAWFIC's entire business is documents that have been executed — filed,
 * stamped, sealed. A seal is the oldest mark there is for "this is settled and
 * it is yours", and it is the one ornament that actually means something on a
 * wallet belonging to a filing service, rather than being decoration borrowed
 * from luxury goods that happen to be made of leather.
 *
 * It also fixes a material problem. Everything else on this panel is pressed
 * INTO the hide, so it shares the hide's colour and its matte surface. That is
 * correct, and it also means the panel has no focal point — the eye finds
 * nothing to land on. Wax is the opposite of leather in every way that
 * matters: domed where the hide is flat, glossy where it is matte, sitting ON
 * the surface rather than in it. That contrast is the whole effect, and it is
 * why a printed decal in the same place would read as a sticker.
 *
 * WHAT MAKES IT READ AS WAX AND NOT A BUTTON
 *
 *   - an IRREGULAR EDGE. Wax spreads as it is pressed, so the rim is never a
 *     circle. Three overlapping sine waves at different frequencies give a
 *     silhouette that is obviously hand-made and obviously not an ellipse
 *     tool. Seeded from the initials, so one customer's seal is always the
 *     same seal and never reshuffles between renders.
 *   - a DOME: a radial falloff in the bump map, so light gathers in the middle
 *     and the edge rolls away.
 *   - an IMPRESSION, not a print. The letters are pushed down into the wax and
 *     lit from the same direction as everything else on the panel.
 *   - a RAISED LIP just inside the rim, where wax piles against the edge of the
 *     matrix. It is a two-pixel detail and it is most of the difference
 *     between wax and a blob.
 *
 * The wax takes its colour from the stamping the customer already chose — gold
 * foil gives gold wax, blind gives the traditional oxblood. One control, two
 * places, no new switch to learn.
 */
export function WaxSeal({
  engraving,
  emboss,
  size,
  visible,
}: {
  engraving: string;
  emboss: { id: string; hex: string | null };
  size: THREE.Vector3;
  visible: boolean;
}) {
  const initials = useMemo(() => sealInitials(engraving), [engraving]);
  const { alpha, bump, span } = useMemo(() => sealMaps(size, initials), [size, initials]);

  const wax = WAX[emboss.id] ?? WAX.blind!;
  const metallic = emboss.hex !== null;

  /* Beside the lockup, which embossMaps centres at 78% across and 76% down.
     Canvas fractions map onto the plane as (fraction - 0.5) * span with y
     inverted — the same arithmetic the stamp uses, so the pair stays together
     if either is ever moved. */
  const planeW = size.x * 0.98;
  const planeH = size.y * 0.98;
  const x = (0.78 - 0.5) * planeW - planeW * 0.17 - span * 0.52;
  const y = (0.5 - 0.725) * planeH;

  return (
    <mesh visible={visible} position={[x, y, size.z / 2 + 0.03]}>
      <planeGeometry args={[span, span]} />
      <meshPhysicalMaterial
        transparent
        color={wax.base}
        /* Wax is dielectric even when it looks metallic: the sheen is a clear
           surface over pigment, which is what clearcoat is for. Pushing
           metalness instead would turn it to chrome. */
        metalness={metallic ? 0.45 : 0}
        roughness={metallic ? 0.32 : 0.44}
        clearcoat={1}
        clearcoatRoughness={0.14}
        envMapIntensity={1.3}
        bumpMap={bump}
        bumpScale={1.1}
        alphaMap={alpha}
        alphaTest={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Sealing wax comes in metallics too, so the foil choice carries across. */
const WAX: Record<string, { base: string }> = {
  blind: { base: "#7E1420" },
  gold: { base: "#A8842E" },
  silver: { base: "#6E7681" },
  copper: { base: "#8A4B2A" },
};

/**
 * What is pressed into the wax.
 *
 * Two letters at most: three is illegible at this size, and a full name in a
 * seal is a rubber stamp rather than a signet. With nothing engraved it is the
 * house letter, so the wallet always has its focal point — and it becomes the
 * customer's the moment they put a name on it.
 */
export function sealInitials(engraving: string): string {
  const words = engraving.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "L";
  if (words.length === 1) return words[0]!.slice(0, 1).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

/** Deterministic wobble. One seed, one seal, every render. */
function sealNoise(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function sealMaps(size: THREE.Vector3, initials: string) {
  const span = size.y * 0.98 * 0.3;
  const px = 512;
  const c = px / 2;
  const R = px * 0.42;

  const rnd = sealNoise(initials.charCodeAt(0) * 97 + (initials.charCodeAt(1) || 7) * 31);
  const phase = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];

  const blob = (ctx: CanvasRenderingContext2D, scale = 1) => {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 90) {
      const wobble =
        1 +
        0.055 * Math.sin(a * 5 + phase[0]!) +
        0.032 * Math.sin(a * 9 + phase[1]!) +
        0.018 * Math.sin(a * 14 + phase[2]!);
      const r = R * wobble * scale;
      const px2 = c + Math.cos(a) * r;
      const py2 = c + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px2, py2);
      else ctx.lineTo(px2, py2);
    }
    ctx.closePath();
  };

  const serif = '"Cinzel", "Trajan Pro", Georgia, "Times New Roman", serif';

  /* ALPHA — the silhouette, white on black. */
  const alphaCanvas = document.createElement("canvas");
  alphaCanvas.width = alphaCanvas.height = px;
  const ac = alphaCanvas.getContext("2d")!;
  ac.fillStyle = "#000000";
  ac.fillRect(0, 0, px, px);
  ac.fillStyle = "#ffffff";
  blob(ac);
  ac.fill();

  /* BUMP — the dome, the lip, and the impression. */
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = bumpCanvas.height = px;
  const bc = bumpCanvas.getContext("2d")!;
  bc.fillStyle = "#000000";
  bc.fillRect(0, 0, px, px);

  const dome = bc.createRadialGradient(c, c, 0, c, c, R);
  dome.addColorStop(0, "#f2f2f2");
  dome.addColorStop(0.62, "#c8c8c8");
  dome.addColorStop(1, "#5a5a5a");
  bc.fillStyle = dome;
  blob(bc);
  bc.fill();

  /* The lip, where wax piles against the edge of the matrix. */
  bc.strokeStyle = "#ffffff";
  bc.globalAlpha = 0.5;
  bc.lineWidth = px * 0.022;
  blob(bc, 0.9);
  bc.stroke();
  bc.globalAlpha = 1;

  /* The impression is pushed DOWN, so it is dark in a bump map. */
  bc.fillStyle = "#1a1a1a";
  bc.textAlign = "center";
  bc.textBaseline = "middle";
  bc.font = `700 ${R * (initials.length > 1 ? 0.76 : 1.0)}px ${serif}`;
  bc.letterSpacing = `${-R * 0.04}px`;
  bc.fillText(initials, c, c + R * 0.04);
  bc.letterSpacing = "0px";

  /* The ring a signet leaves inside its rim. */
  bc.strokeStyle = "#3a3a3a";
  bc.lineWidth = px * 0.012;
  blob(bc, 0.76);
  bc.stroke();

  const alpha = new THREE.CanvasTexture(alphaCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  for (const t of [alpha, bump]) t.colorSpace = THREE.NoColorSpace;

  return { alpha, bump, span };
}
