"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { leatherMaps } from "@/lib/wallet3d/materials";
import { getColor, getFinish, getHardware, THREADS, type WalletConfig } from "@/lib/wallet3d/finishes";
import type { Denomination } from "@/lib/wallet3d/banknote";
import NoteStack from "./NoteStack";

/**
 * The LAWFIC card holder. This is the approved object and what renders.
 *
 * It was drawn from the client's renders before their .glb arrived, and when
 * the two were compared side by side this one was kept: a generated mesh
 * softens every edge, loses the stitching and rounds the pocket wave, and those
 * three things are the design. Their model, its build pipeline and WalletGLB
 * all remain in the tree behind `USE_CLIENT_MESH` in WalletScene.
 *
 * It follows their renders:
 *
 *   - one back panel, one front pocket, both rounded, both stitched;
 *   - the pocket's top edge WAVES: high at the left, dipping through a low
 *     point around three fifths across, rising again to the right. That curve
 *     is the whole signature of the object. A straight-topped pocket is a
 *     generic card sleeve and this is not one;
 *   - genuinely slim. About 9mm at the spine, which is why the notes fan out
 *     of the top rather than sitting inside;
 *   - monogram low left, wordmark low right, both cut into the surface.
 *
 * The material system, the engraving and the interaction are shared with
 * WalletGLB, so the fallback is the same product in a simpler shell rather
 * than a different one.
 */

/* Card-holder proportions, in centimetres at 1 unit = 1cm. */
const W = 10.2;
const H = 7.6;
const BACK_T = 0.16;
/* The pocket is deliberately thicker than the back panel. On the real object
   the front is a folded-and-glued edge that stands proud of the body, and that
   raised lip is the only thing that separates two panels of identical leather
   under identical light. Modelled flush, the wallet reads as one printed card
   with a curve drawn on it. */
const POCKET_T = 0.24;

export type WalletLook = WalletConfig;

/** The back panel: a plain rounded rectangle with a bevel on both faces. */
function backShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/**
 * The front pocket, with the wave.
 *
 * Two cubics rather than one: the edge falls from the left shoulder to a low
 * point at about 58% across, then rises to the right shoulder. A single curve
 * gives a symmetric smile, which is not what the renders show and reads as
 * decoration rather than as a thumb cutaway.
 */
function pocketShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const left = -w / 2;
  const right = w / 2;
  const top = h / 2;
  const low = top - h * 0.3;

  s.moveTo(left + r, -h / 2);
  s.lineTo(right - r, -h / 2);
  s.quadraticCurveTo(right, -h / 2, right, -h / 2 + r);
  s.lineTo(right, top - h * 0.06);

  /* Right shoulder down into the dip. */
  s.bezierCurveTo(
    right - w * 0.1, top - h * 0.04,
    right - w * 0.2, low,
    left + w * 0.58, low,
  );
  /* Dip back up to the left shoulder, shallower — the asymmetry. */
  s.bezierCurveTo(
    left + w * 0.3, low,
    left + w * 0.16, top - h * 0.02,
    left + r, top,
  );

  s.quadraticCurveTo(left, top, left, top - r);
  s.lineTo(left, -h / 2 + r);
  s.quadraticCurveTo(left, -h / 2, left + r, -h / 2);
  return s;
}

/** Bevel adds to BOTH faces, so an extrusion is thicker than its `depth`. */
const BEVEL_RATIO = 0.42;
export const extrudedHalfDepth = (depth: number) => (depth * (1 + 2 * BEVEL_RATIO)) / 2;

function extrude(shape: THREE.Shape, depth: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * BEVEL_RATIO,
    bevelSize: depth * 0.36,
    bevelSegments: 4,
    curveSegments: 28,
  });
  g.center();
  g.computeVertexNormals();
  return g;
}

/** Stitching that follows a shape's own outline, as real tube geometry. */
function stitchAlong(shape: THREE.Shape, inset: number, samples = 260) {
  const pts2 = shape.getPoints(samples);
  /* Shrink toward the centroid, so the run sits inside the edge the way a
     saddle stitch does rather than tracing the cut line itself. */
  let cx = 0;
  let cy = 0;
  for (const p of pts2) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts2.length;
  cy /= pts2.length;

  const pts = pts2.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return new THREE.Vector3(p.x - (dx / len) * inset, p.y - (dy / len) * inset, 0);
  });

  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.TubeGeometry(curve, 460, 0.028, 5, true);
}

export default function WalletModel({
  look,
  open,
  notes,
  arriving,
  pointer,
}: {
  look: WalletLook;
  open: number;
  notes: Denomination[];
  arriving?: number;
  pointer: { x: number; y: number };
}) {
  const root = useRef<THREE.Group>(null);

  const finish = getFinish(look.finish);
  const color = getColor(finish, look.color);
  const hardware = getHardware(look.hardware);
  const threadDef = THREADS.find((t) => t.id === look.thread) ?? THREADS[0];
  const threadColor = threadDef.hex || color.hex;

  const maps = useMemo(
    () =>
      leatherMaps(`${finish.id}-${color.id}`, {
        color: color.hex,
        grain: finish.grain,
        roughness: finish.roughness,
        tooth: finish.tooth,
        weave: finish.weave,
        brushed: finish.brushed,
      }),
    [finish, color],
  );

  useMemo(() => {
    /* ExtrudeGeometry's default UV generator writes the vertex x/y straight
       into the texture coordinate, so one UV unit here is one CENTIMETRE —
       unlike the .glb, whose xatlas unwrap packs the whole object into 0–1.
       The repeat is therefore the reciprocal of the tile size in centimetres,
       which puts the fallback on the same physical grain as the real model
       instead of on whatever number looked right at one zoom level. */
    const rep = finish.weave ? 0.24 : finish.brushed ? 0.36 : 0.36;
    for (const t of [maps.normal, maps.rough]) t.repeat.set(rep, rep);
  }, [maps, finish]);

  const backGeo = useMemo(() => extrude(backShape(W, H, 0.72), BACK_T), []);
  const pocketShapeMemo = useMemo(() => pocketShape(W - 0.5, H - 0.7, 0.62), []);
  const pocketGeo = useMemo(() => extrude(pocketShapeMemo, POCKET_T), [pocketShapeMemo]);
  const backStitch = useMemo(() => stitchAlong(backShape(W, H, 0.72), 0.42), []);
  const pocketStitch = useMemo(() => stitchAlong(pocketShapeMemo, 0.34), [pocketShapeMemo]);

  const surface = {
    color: color.hex,
    /* Two different problems, so two different values.
       A dielectric hide reflecting the full softbox rig comes back as a flat
       saturated poster colour, so the environment is dialled back and the
       bright pixels stay where they belong: on the raised grain.
       A metal has no diffuse term at all — everything you see on it IS the
       environment — so the same reduction turns brushed titanium into a black
       slab with a rim light. It gets the environment turned up instead. */
    envMapIntensity: finish.metalness > 0.5 ? 1.9 : 0.45,
    normalMap: maps.normal,
    roughnessMap: maps.rough,
    roughness: finish.roughness,
    metalness: finish.metalness,
    clearcoat: finish.clearcoat,
    clearcoatRoughness: finish.clearcoatRoughness,
    normalScale: new THREE.Vector2(finish.normalScale, finish.normalScale),
  };

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    /* A slow breath plus the cursor. Never a spin: a product that rotates by
       itself reads as a trinket in a display case. */
    const ty = pointer.x * 0.5 + Math.sin(t * 0.3) * 0.05;
    const tx = -pointer.y * 0.26 + Math.sin(t * 0.22 + 1) * 0.035;
    root.current.rotation.y += (ty - root.current.rotation.y) * 0.06;
    root.current.rotation.x += (tx - root.current.rotation.x) * 0.06;
    root.current.position.y = Math.sin(t * 0.5) * 0.06;
  });

  return (
    <group ref={root} rotation={[0.06, -0.28, 0]}>
      {/* BACK PANEL */}
      <mesh geometry={backGeo} castShadow receiveShadow>
        <meshPhysicalMaterial {...surface} />
      </mesh>
      <mesh geometry={backStitch} position={[0, 0, extrudedHalfDepth(BACK_T) * 0.94]}>
        <meshStandardMaterial color={threadColor} roughness={0.75} metalness={0.02} />
      </mesh>

      {/* THE MONEY — behind the pocket, fanning out of the top. */}
      <NoteStack
        notes={notes}
        open={open}
        arriving={arriving}
        style={look.notes}
        width={8.7}
        position={[0.1, H * 0.46, 0.18]}
      />

      {/* FRONT POCKET, carrying the wave and the branding. */}
      <group position={[0, -H * 0.05, extrudedHalfDepth(BACK_T) + extrudedHalfDepth(POCKET_T) * 0.55]}>
        <mesh geometry={pocketGeo} castShadow receiveShadow>
          <meshPhysicalMaterial {...surface} />
        </mesh>
        <mesh geometry={pocketStitch} position={[0, 0, extrudedHalfDepth(POCKET_T) * 0.94]}>
          <meshStandardMaterial color={threadColor} roughness={0.75} metalness={0.02} />
        </mesh>

        <Branding
          engraving={look.engraving}
          hardware={hardware}
          /* Clear of the pocket's front face, BEVEL INCLUDED. This is the
             detail that hid the engraving entirely: ExtrudeGeometry adds the
             bevel to both faces, so the pocket's front sits at 0.22 rather
             than at half of POCKET_T, and a plane placed at 0.19 was buried
             inside the leather. */
          z={extrudedHalfDepth(POCKET_T) + 0.015}
        />
      </group>
    </group>
  );
}

/**
 * Monogram low left, wordmark low right — both cut into the face.
 *
 * Drawn once into a bump and a roughness map covering the whole pocket, so the
 * marks are DEPRESSIONS in the surface rather than decals sitting on it. That
 * is what makes them catch the key light on one lip and shadow on the other,
 * and it is why they change as the wallet turns. Text laid over a canvas cannot
 * do it at any budget, and a decal always reads as a sticker.
 */
function Branding({
  engraving,
  hardware,
  z,
}: {
  engraving: string;
  hardware: { hex: string; roughness: number };
  z: number;
}) {
  const { bump, rough, mask } = useMemo(() => {
    const w = 1024;
    const h = Math.round((w * (H - 0.7)) / (W - 0.5));

    const draw = (fg: string, bg: string) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = fg;
      ctx.strokeStyle = fg;

      /* Monogram: an angular chevron pair, low left. Original mark. */
      const mx = w * 0.11;
      const my = h * 0.8;
      const s = h * 0.1;
      ctx.lineWidth = s * 0.34;
      ctx.lineCap = "square";
      ctx.lineJoin = "miter";
      for (const off of [0, s * 0.52]) {
        ctx.beginPath();
        ctx.moveTo(mx + off, my - s);
        ctx.lineTo(mx + off, my + s * 0.55);
        ctx.lineTo(mx + off + s * 0.78, my + s * 0.55);
        ctx.stroke();
      }

      /* Wordmark, low right. The customer's engraving takes its place when
         they have set one — their name is the point, not ours. */
      const text = (engraving || "LAWFIC").toUpperCase().slice(0, 16);
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.font = `600 ${h * 0.115}px ui-sans-serif, system-ui, sans-serif`;
      ctx.letterSpacing = `${h * 0.022}px`;
      ctx.fillText(text, w * 0.9, my + s * 0.5);
      return c;
    };

    /* Mid grey field, dark marks: cut in, not raised. */
    const bumpTex = new THREE.CanvasTexture(draw("#101010", "#808080"));
    bumpTex.colorSpace = THREE.NoColorSpace;
    /* Cut edges are rougher than the field they sit in. */
    const roughTex = new THREE.CanvasTexture(draw("#d0d0d0", "#404040"));
    roughTex.colorSpace = THREE.NoColorSpace;
    /* The cut-out, and a separate texture on purpose.
       Reusing the bump map as the alpha map does not work: its field is mid
       grey and its marks are near black, so EVERY texel sits below any alpha
       test high enough to remove the field — the whole plane disappears,
       marks included, which is exactly what happened. The mask has to be the
       other way round, white where the marks are. */
    const maskTex = new THREE.CanvasTexture(draw("#ffffff", "#000000"));
    maskTex.colorSpace = THREE.NoColorSpace;
    return { bump: bumpTex, rough: roughTex, mask: maskTex };
  }, [engraving]);

  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[W - 0.5, H - 0.7]} />
      <meshPhysicalMaterial
        transparent
        color={hardware.hex}
        metalness={0.9}
        roughness={hardware.roughness}
        envMapIntensity={1.6}
        bumpMap={bump}
        /* Negative, so the marks read as debossed rather than raised. */
        bumpScale={-1.2}
        roughnessMap={rough}
        /* Only the marks survive; the field is alpha-tested away so the
           leather underneath is what you see everywhere else. */
        alphaMap={mask}
        alphaTest={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}
