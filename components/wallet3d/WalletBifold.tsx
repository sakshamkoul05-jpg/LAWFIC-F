"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { leatherMaps } from "@/lib/wallet3d/materials";
import { THREADS, getColor, getEmboss, getFinish, type WalletConfig } from "@/lib/wallet3d/finishes";
import type { Denomination } from "@/lib/wallet3d/banknote";
import NoteStack from "./NoteStack";

/**
 * The LAWFIC bifold — the client's own model, shut and open.
 *
 * TWO MESHES, NOT ONE THAT FOLDS
 *
 * They supplied two separate exports: the wallet shut, and the wallet open with
 * its card slots and coin pocket showing. Those have completely different
 * topology, so there is no morph between them — a morph target needs matching
 * vertex counts and these differ by ten thousand.
 *
 * So the swap is HIDDEN rather than blended. The wallet turns edge-on to the
 * camera, the meshes exchange at the moment its silhouette is a line, and it
 * turns back. That is a stage trick and it is the right one: a cross-fade
 * between two solid objects reads as two ghosts, and a hard cut reads as a
 * bug. Turning something over to open it is also what a hand does.
 *
 * WHAT ARRIVED
 *
 * Both exports are trimesh files — several hundred thousand triangles,
 * POSITION only, no normals, no texture coordinates, no material. Without
 * normals nothing can be lit; without texture coordinates nothing can be
 * mapped, and the whole finish system is UV-sampled.
 * `assets-src/build-wallet-glb.sh` decimates, unwraps with xatlas and
 * quantizes both; normals are computed here so the smoothing is ours.
 *
 * Orientation and scale are MEASURED from the bounding box rather than
 * hard-coded, so a re-export at a different size or handedness still frames.
 */

const CLOSED_URL = "/wallet/lawfic-bifold-closed.glb";
const OPEN_URL = "/wallet/lawfic-bifold-open.glb";

/** A real bifold is about 11.5cm across the spine when shut. 1 unit = 1cm. */
const TARGET_W = 11.5;

/**
 * How far the cover sits open when the wallet is "shut", in radians.
 *
 * NOT ZERO, and this is the difference between a wallet and a block. A bifold
 * with cards and cash in it never closes flat — the leaves are held apart by
 * what is between them, so the outer edge gapes a few millimetres and the fold
 * takes the strain. Clamped shut at exactly 0° the two halves meet with no
 * parting line anywhere, and the object reads as one solid slab of leather,
 * which is precisely what it looked like. Three degrees is enough to open a
 * visible seam down the outer edge and along the top without the wallet
 * looking as though it is falling open.
 */
const REST_AJAR = -0.055;

/**
 * The cover is very slightly smaller than the back leaf, measured from the
 * fold. Real bifolds are cut this way so the cover does not overhang, and the
 * millimetre of step it leaves at the outer edge is one more thing telling the
 * eye there are two pieces of leather here rather than one.
 */
const COVER_TRIM = 0.992;

/** Seconds for the cover to swing open, or shut. */
const FLIP = 0.85;

/**
 * How much the open wallet is scaled down to stay in frame.
 *
 * An open bifold really is about twice as wide as a shut one, and modelling it
 * any other way would be a lie about the object. But the hero has one frame,
 * and at true relative size the open state runs off both edges. So the SIZE is
 * honest and the presentation is scaled — it still reads as clearly wider than
 * the shut wallet, which is the thing the eye is actually judging.
 */
const OPEN_FRAME_SCALE = 0.68;

type Fit = { geometry: THREE.BufferGeometry; scale: number; size: THREE.Vector3 };

function fit(gltf: { scene: THREE.Object3D }, targetWidth: number): Fit {
  let found: THREE.Mesh | null = null;
  gltf.scene.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  if (!found) throw new Error("wallet mesh missing from .glb");
  const mesh: THREE.Mesh = found;

  const geometry = mesh.geometry.clone();
  mesh.updateWorldMatrix(true, false);

  /* Quantized positions arrive as normalised int16 with the real scale on the
     node, and applying a matrix to a normalised attribute writes back through
     the same normalisation — values just over 1.0 would clamp. Converting to
     float first removes that hazard entirely rather than relying on the
     numbers happening to stay in range. */
  const pos = geometry.getAttribute("position");
  if (pos.normalized || !(pos.array instanceof Float32Array)) {
    const f = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      f[i * 3] = pos.getX(i);
      f[i * 3 + 1] = pos.getY(i);
      f[i * 3 + 2] = pos.getZ(i);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(f, 3));
  }
  geometry.applyMatrix4(mesh.matrixWorld);

  /* The export carries no normals, so nothing is lit until these exist. */
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();

  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const raw = new THREE.Vector3();
  box.getSize(raw);
  const centre = new THREE.Vector3();
  box.getCenter(centre);
  geometry.translate(-centre.x, -centre.y, -centre.z);

  const scale = targetWidth / raw.x;
  return { geometry, scale, size: raw.clone().multiplyScalar(scale) };
}


/**
 * Split the shut wallet into its two leaves, at the plane where they meet.
 *
 * WHY THIS EXISTS
 *
 * The export is a watertight solid: there is no modelled separation between
 * the front cover and the back, so the whole object could only ever be turned,
 * not opened. Turned, a bifold seen edge-on is a rectangular block — which is
 * exactly what it looked like, and exactly what a wallet does not do. A real
 * bifold keeps its back still and swings only the cover, so the back face is
 * on screen the entire time and there is never a moment when all you can see
 * is an edge.
 *
 * Triangles are sorted by the z of their centroid. The two halves SHARE their
 * attribute buffers and differ only in their index, so this costs one pass
 * over the indices and no extra vertex memory. Triangles that straddle the cut
 * land on one side or the other, which leaves a slightly ragged seam — at the
 * fold, where the two leaves are pressed together and it does not show.
 */
function splitLeaves(geo: THREE.BufferGeometry): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const index = geo.getIndex();
  const pos = geo.getAttribute("position");
  if (!index) return [geo, geo];

  const front: number[] = [];
  const back: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    const z = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
    (z >= 0 ? front : back).push(a, b, c);
  }

  const make = (list: number[]) => {
    const g = new THREE.BufferGeometry();
    for (const name of ["position", "uv", "normal"]) {
      const attr = geo.getAttribute(name);
      if (attr) g.setAttribute(name, attr);
    }
    g.setIndex(list);
    return g;
  };
  return [make(front), make(back)];
}

export default function WalletBifold({
  look,
  open,
  notes,
  arriving,
  pointer,
}: {
  look: WalletConfig;
  /** 0 shut, 1 open. */
  open: number;
  notes: Denomination[];
  arriving?: number;
  pointer: { x: number; y: number };
}) {
  const closedGltf = useGLTF(CLOSED_URL);
  const openGltf = useGLTF(OPEN_URL);

  const closed = useMemo(() => fit(closedGltf, TARGET_W), [closedGltf]);
  /* The open wallet is the same leather unfolded, so it is scaled by the SAME
     rule rather than refitted to the frame — otherwise the two states would be
     different sizes and the swap would read as a zoom. Its own export is
     roughly twice as wide, so it keeps its own measured width. */
  const opened = useMemo(() => fit(openGltf, TARGET_W * 1.72), [openGltf]);

  /* The shut wallet as two leaves, so the cover can swing on its own. */
  const leaves = useMemo(() => splitLeaves(closed.geometry), [closed]);

  const finish = getFinish(look.finish);
  const color = getColor(finish, look.color);
  const emboss = getEmboss(look.emboss);
  const threadDef = THREADS.find((t) => t.id === look.thread) ?? THREADS[0];
  /* Tonal thread is the hide a shade lighter, which is what "tonal" means to a
     leatherworker — not the same colour, which would vanish. */
  const threadColor = threadDef.hex || lighten(color.hex, 1.5);

  const maps = useMemo(
    () =>
      leatherMaps(`${finish.id}-${color.id}`, {
        color: color.hex,
        grain: finish.grain,
        roughness: finish.roughness,
        tooth: finish.tooth,
        weave: finish.weave,
      }),
    [finish, color],
  );

  useMemo(() => {
    /* Measured from each mesh's own atlas: the closed export packs 305cm² of
       surface into unit UV space and the open one 433cm², so the same repeat
       would draw a different grain on each. These put the hide at about the
       same physical scale in both states, which matters because the flip
       shows them one after the other. */
    const rep = finish.weave ? 9 : 12;
    for (const t of [maps.normal, maps.rough, maps.tint]) t.repeat.set(rep, rep);
  }, [maps, finish]);

  /* The swing. `shown` is what is drawn; `open` is what was asked for. They
     differ only during the swing, and they exchange at the edge-on moment. */
  const root = useRef<THREE.Group>(null);
  const scaler = useRef<THREE.Group>(null);
  const hinge = useRef<THREE.Group>(null);
  const [shown, setShown] = useState(open >= 0.5);
  const flipStart = useRef<number | null>(null);
  const lastWant = useRef(open >= 0.5);

  /* Props are MIRRORED INTO REFS and read from there inside useFrame.
     The frame callback must not read `open` or `shown` out of its closure: a
     render-loop subscription does not necessarily hold this render's function,
     and the symptom when it does not is silent and baffling — the wallet keeps
     breathing, because that only uses refs and the clock, while the open/shut
     comparison sits forever against the value captured on mount and no flip
     ever starts. Refs are read at call time and cannot go stale. */
  const wantRef = useRef(open >= 0.5);
  wantRef.current = open >= 0.5;
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const want = wantRef.current;

    if (want !== lastWant.current) {
      lastWant.current = want;
      flipStart.current = t;
    }

    /* One number drives the whole move, so its parts cannot fall out of step. */
    let p = 1;
    let cover = REST_AJAR;
    if (flipStart.current !== null) {
      p = Math.min(1, (t - flipStart.current) / FLIP);

      /* THE COVER SWINGS A FULL HALF TURN, and the size of that angle is the
         reason the swap is invisible. At 180° the cover has come to rest
         alongside the back leaf — two leaves side by side, which is the
         silhouette of the OPEN wallet. Stopping at 90°, as this did before,
         hands over at the one angle where the object is a bare edge and the
         two meshes look nothing like each other.

         Negative, so the far edge lifts toward the viewer and the cover opens
         to the left. Rotating the other way swings the near edge away and
         shows the back of the object before the inside — that reads as
         flipping the wallet over to look underneath, not as opening it. */
      const swing = shownRef.current ? 1 - p : p;
      /* From ajar to flat, not from zero — otherwise the cover would snap
         closed the moment a swing began or ended. */
      cover = REST_AJAR + (-Math.PI - REST_AJAR) * (1 - Math.pow(1 - swing, 3));

      /* Handed over near the end of the swing, not at the middle. */
      if (p >= 0.86 && shownRef.current !== want) setShown(want);
      if (p >= 1) flipStart.current = null;
    }

    if (!root.current) return;
    /* A slow breath plus the cursor. Never a spin: a product that rotates by
       itself reads as a trinket in a display case. */
    const ty = pointer.x * 0.5 + Math.sin(t * 0.3) * 0.05;
    const tx = -pointer.y * 0.26 + Math.sin(t * 0.22 + 1) * 0.035;
    root.current.rotation.y += (ty - root.current.rotation.y) * 0.06;
    root.current.rotation.x += (tx - root.current.rotation.x) * 0.06;
    root.current.position.y = Math.sin(t * 0.5) * 0.06;

    /* THE HINGE IS AT THE SPINE, NOT THE MIDDLE.
       Rotating about the object's centre is a turntable: the wallet stays
       where it is and presents its thick edge to the camera, and for the
       moment it is edge-on it is a centred rectangular slab — a box. A cover
       does not turn about its middle, it swings about the fold. Pivoting at
       the spine sends the body sweeping out to one side and foreshortening as
       it goes, which is what a flap opening looks like, and the edge-on
       instant is a thin line off to one side rather than a block in the
       middle of the frame. */
    if (hinge.current) hinge.current.rotation.y = cover;

    const inner = scaler.current;
    if (inner) {
      /* Interpolated FROM `p`, not eased toward a target a fixed fraction per
         frame. A per-frame lerp is framerate-dependent — the same move takes
         twice as long at 30fps as at 60 — and on a machine that stutters
         during the swap it visibly drags behind the turn, which was most of
         what made this feel laggy. Elapsed time gives the same shape
         everywhere. It runs over the second half, after the exchange. */
      /* The object widens as the cover swings out, so the frame scale has to
         follow the SWING rather than wait for the swap — otherwise the open
         wallet pops smaller the instant the meshes exchange. */
      const from = shownRef.current ? 1 : OPEN_FRAME_SCALE;
      const to = shownRef.current ? OPEN_FRAME_SCALE : 1;
      inner.scale.setScalar(from + (to - from) * (1 - Math.pow(1 - p, 2)));
    }
  });

  const fitted = shown ? opened : closed;

  const surface = {
    /* White, because the colour now lives in the albedo map: a pull-up hide's
       mottling has to be in the texture, and multiplying that by a base colour
       as well would double the dye. */
    color: "#ffffff",
    map: maps.tint,
    /* A hide reflecting the whole softbox rig comes back as flat saturated
       plastic. Every finish in the range is a dielectric now, so this is one
       value rather than the metal/dielectric split it used to carry. */
    envMapIntensity: 0.45,
    normalMap: maps.normal,
    roughnessMap: maps.rough,
    roughness: finish.roughness,
    metalness: finish.metalness,
    clearcoat: finish.clearcoat,
    clearcoatRoughness: finish.clearcoatRoughness,
    normalScale: new THREE.Vector2(finish.normalScale, finish.normalScale),
  };

  return (
    <group ref={root} rotation={[0.06, -0.28, 0]}>
      <group ref={scaler}>
        {shown ? (
          <>
            <mesh geometry={opened.geometry} scale={opened.scale} castShadow receiveShadow>
              <meshPhysicalMaterial {...surface} />
            </mesh>

            <NoteStack
              notes={notes}
              open={1}
              arriving={arriving}
              style={look.notes}
              /* A banknote spans nearly the whole length of an open bifold —
                 that is what the compartment is for, and half-width notes read
                 as vouchers rattling around inside it. */
              width={opened.size.x * 0.78}
              /* Deep in the slot, and far enough back that the spine occludes
                 the stack's bowed middle. Shallower, the curve of the paper
                 poked through the gap between the leaves and read as a tear. */
              position={[0, opened.size.y * 0.22, -opened.size.z * 0.58]}
            />
          </>
        ) : (
          <>
            {/* THE BACK LEAF STAYS PUT. This is the whole point of the split:
                a wallet that opens keeps most of itself on screen, so there is
                never a frame in which all you can see is an edge. */}
            <mesh geometry={leaves[1]} scale={closed.scale} castShadow receiveShadow>
              {/* DOUBLE-SIDED, and not as a precaution.
                  Each leaf is half of a watertight solid cut open, so the face
                  it presents to the camera is the CUT — and a cut has no
                  triangles. What is actually in front of you is the inside of
                  the leaf's far surface, whose winding points away, and with
                  front-face culling that renders as nothing at all: the back
                  leaf simply vanished the moment the cover started to move,
                  which defeats the entire reason for splitting it. */}
              <meshPhysicalMaterial {...surface} side={THREE.DoubleSide} />
            </mesh>

            {/* THE COVER SWINGS. Hinged at the fold — the left edge — with its
                contents pushed back the same distance, so at rest the pair is
                an identity and only the swing sees it. */}
            <group
              ref={hinge}
              position={[-closed.size.x / 2, 0, 0]}
              rotation={[0, REST_AJAR, 0]}
              scale={COVER_TRIM}
            >
              <group position={[closed.size.x / 2, 0, 0]}>
                <mesh geometry={leaves[0]} scale={closed.scale} castShadow receiveShadow>
                  <meshPhysicalMaterial {...surface} side={THREE.DoubleSide} />
                </mesh>

                {/* Stitching and stamping are on the OUTSIDE of the cover, so
                    they ride with it. Both are drawn for the shut state only —
                    the open wallet's decals were flat planes derived from a
                    bounding box its tilted panels do not fill, which is why
                    they floated over the leather instead of pressing into it. */}
                <Stitching size={closed.size} thread={threadColor} visible />

                {/* The opening, as a dark line where the two leaves meet. Its
                    own strip rather than a line in the stitch decal, because
                    that decal has one material and a gap between two pieces of
                    leather is not the colour of thread. */}
                <mesh position={[0, closed.size.y * 0.42, closed.size.z / 2 + 0.01]} renderOrder={2}>
                  <planeGeometry args={[closed.size.x * 0.9, closed.size.y * 0.012]} />
                  <meshBasicMaterial color="#120c07" transparent opacity={0.72} depthWrite={false} />
                </mesh>

                <Emboss
                  engraving={look.engraving}
                  emboss={emboss}
                  leather={color.hex}
                  size={closed.size}
                  visible
                />
              </group>
            </group>
          </>
        )}
      </group>
    </group>
  );
}

/**
 * The stamped mark on the wallet's face: the monogram over the wordmark, low
 * right, as the client's photograph of the shut wallet has it.
 *
 * OUTSIDE ONLY. There was a second set on the open wallet's two leaves, and it
 * is gone at the client's request — it did not survive contact with the real
 * object. The plane it lived on is sized from the mesh's BOUNDING BOX, and an
 * open bifold does not fill its box: the panels tilt toward the camera, so the
 * box is taller, wider and much deeper than any leather in it, and the marks
 * hovered in front of the hide rather than being pressed into it.
 *
 * Stamped, not printed. The plane is held just clear of the face with
 * everything but the marks alpha-tested away; the marks carry a NEGATIVE bump
 * so they read as pressed in, and blind embossing takes the leather's own
 * colour, so the only thing that reveals it is the way light falls into the
 * depression. That is what a real blind stamp is, and it is why a flat decal
 * always reads as a sticker.
 */
function Emboss({
  engraving,
  emboss,
  leather,
  size,
  visible,
}: {
  engraving: string;
  emboss: { hex: string | null; roughness: number };
  leather: string;
  size: THREE.Vector3;
  visible: boolean;
}) {
  /* Built once and HIDDEN rather than unmounted when the wallet opens.
     Unmounting would throw the canvases away and rebuild them on the way back
     — three 1400px draws landing in the frame where the meshes exchange, which
     is exactly the stall that made the flip feel laggy. */
  const { bump, rough, mask, planeW, planeH } = useMemo(
    () => embossMaps(size),
    [engraving, size],
  );

  /* Blind embossing has no foil: it is the hide's own colour, pressed. */
  const blind = emboss.hex === null;

  return (
    <mesh visible={visible} position={[0, 0, size.z / 2 + 0.02]}>
      <planeGeometry args={[planeW, planeH]} />
      <meshPhysicalMaterial
        transparent
        color={blind ? leather : emboss.hex!}
        metalness={blind ? 0 : 0.9}
        roughness={blind ? 0.8 : emboss.roughness}
        envMapIntensity={blind ? 0.45 : 1.6}
        bumpMap={bump}
        bumpScale={-1.4}
        roughnessMap={rough}
        alphaMap={mask}
        alphaTest={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * The stamp maps. A plain function rather than a hook so the caller decides
 * when they are built.
 */
function embossMaps(size: THREE.Vector3) {
  const planeW = size.x * 0.98;
  const planeH = size.y * 0.98;
  const w = 1400;
  const h = Math.max(1, Math.round((w * planeH) / planeW));

  const draw = (fg: string, bg: string) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.strokeStyle = fg;
    ctx.textBaseline = "alphabetic";

    const serif = '"Cinzel", "Trajan Pro", Georgia, "Times New Roman", serif';

    /** The IL monogram over the wordmark, as a stacked lockup. */
    const lockup = (cx: number, baseY: number, unit: number, word: string) => {
      ctx.textAlign = "center";
      ctx.font = `700 ${unit * 1.5}px ${serif}`;
      ctx.letterSpacing = `${-unit * 0.06}px`;
      ctx.fillText("IL", cx, baseY);
      ctx.letterSpacing = `${unit * 0.16}px`;
      ctx.font = `600 ${unit * 0.52}px ${serif}`;
      ctx.fillText(word, cx, baseY + unit * 0.72);
      ctx.letterSpacing = "0px";
    };

    lockup(w * 0.78, h * 0.76, h * 0.115, "LAWFIC");
    return c;
  };

  const bump = new THREE.CanvasTexture(draw("#101010", "#808080"));
  const rough = new THREE.CanvasTexture(draw("#d0d0d0", "#404040"));
  /* The mask must be white-on-black and cannot be the bump map: that one is a
     mid-grey field with near-black marks, so every texel falls below any alpha
     threshold high enough to remove the field and the whole plane — marks
     included — disappears. */
  const mask = new THREE.CanvasTexture(draw("#ffffff", "#000000"));
  for (const t of [bump, rough, mask]) t.colorSpace = THREE.NoColorSpace;
  return { bump, rough, mask, planeW, planeH };
}

useGLTF.preload(CLOSED_URL);
useGLTF.preload(OPEN_URL);

/** Slightly lighter than the hide, for tonal thread. */
function lighten(hex: string, k: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, -0.04, 0.12 * k);
  return `#${c.getHexString()}`;
}

/**
 * The saddle stitch around the panel.
 *
 * Contrast stitching is the loudest identifying feature of the client's
 * wallet — it is what your eye follows around the shape — so the thread option
 * has to actually draw something. It is a decal rather than tube geometry
 * because the run has to follow the MESH's outline, and the mesh is a
 * generated surface with no edge loop to extract: a rounded rectangle inset
 * from the measured bounding box lands within a millimetre of where the real
 * stitch line sits, and costs one plane instead of a few thousand tube
 * segments.
 *
 * Positive bump, unlike the embossing: a stitch sits PROUD of the leather and
 * an emboss is pressed into it, and getting that sign wrong is the difference
 * between thread and a groove.
 */
function Stitching({
  size,
  thread,
  visible,
}: {
  size: THREE.Vector3;
  thread: string;
  visible: boolean;
}) {
  /* Built once and HIDDEN rather than unmounted when the wallet opens, for the
     same reason as the embossing: a rebuild lands a 1600px draw in the frame
     where the meshes exchange. */
  const { bump, mask, w, h } = useMemo(() => stitchMaps(size), [size]);

  return (
    <mesh visible={visible} position={[0, 0, size.z / 2 + 0.015]}>
      <planeGeometry args={[w, h]} />
      <meshPhysicalMaterial
        transparent
        color={thread}
        roughness={0.78}
        metalness={0}
        envMapIntensity={0.5}
        bumpMap={bump}
        bumpScale={0.9}
        alphaMap={mask}
        alphaTest={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * The stitch maps. A plain function rather than a hook so the caller decides
 * when they are built.
 */
function stitchMaps(size: THREE.Vector3) {
  const w = size.x * 0.995;
  const h = size.y * 0.995;
  const px = 1600;
  const py = Math.max(1, Math.round((px * h) / w));

  const draw = (fg: string, bg: string) => {
    const c = document.createElement("canvas");
    c.width = px;
    c.height = py;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, px, py);
    ctx.strokeStyle = fg;
    ctx.lineCap = "round";

    /**
     * The run: down both sides and along the fold, and NOT across the top.
     *
     * This is what stops the shut wallet reading as a sealed box. A bifold is
     * stitched down its sides and around the fold; the top is where the two
     * leaves separate, and closing that line with thread turns the object into
     * a block with a lid drawn on it. Leaving the top open is both what the
     * real construction does and the strongest single cue that the thing in
     * front of you has flaps.
     */
    const run = (inset: number, dash: number, width: number) => {
      const r = Math.min(px, py) * 0.07;
      const x0 = px * inset;
      const y0 = py * inset * (px / py);
      const x1 = px - x0;
      const y1 = py - y0;
      const stop = y0 + (y1 - y0) * 0.1;
      ctx.lineWidth = width;
      ctx.setLineDash([dash, dash * 0.85]);
      ctx.beginPath();
      ctx.moveTo(x0, stop);
      ctx.lineTo(x0, y1 - r);
      ctx.quadraticCurveTo(x0, y1, x0 + r, y1);
      ctx.lineTo(x1 - r, y1);
      ctx.quadraticCurveTo(x1, y1, x1, y1 - r);
      ctx.lineTo(x1, stop);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    run(0.035, px * 0.011, px * 0.005);
    return c;
  };

  const bump = new THREE.CanvasTexture(draw("#f0f0f0", "#808080"));
  const mask = new THREE.CanvasTexture(draw("#ffffff", "#000000"));
  for (const t of [bump, mask]) t.colorSpace = THREE.NoColorSpace;
  return { bump, mask, w, h };
}