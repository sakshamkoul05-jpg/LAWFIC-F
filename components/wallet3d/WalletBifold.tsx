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

/** Seconds for the whole turn-swap-turn. */
const FLIP = 0.9;

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
        brushed: finish.brushed,
      }),
    [finish, color],
  );

  useMemo(() => {
    /* Measured from each mesh's own atlas: the closed export packs 305cm² of
       surface into unit UV space and the open one 433cm², so the same repeat
       would draw a different grain on each. These put the hide at about the
       same physical scale in both states, which matters because the flip
       shows them one after the other. */
    const rep = finish.weave ? 8 : 12;
    for (const t of [maps.normal, maps.rough, maps.tint]) t.repeat.set(rep, rep);
  }, [maps, finish]);

  /* The flip. `shown` is what is drawn; `open` is what was asked for. They
     differ only during the turn, and they exchange at the edge-on moment. */
  const root = useRef<THREE.Group>(null);
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

    let flipTurn = 0;
    if (flipStart.current !== null) {
      const p = Math.min(1, (t - flipStart.current) / FLIP);
      /* Out to edge-on and back: a half sine, so the object is moving fastest
         where it is thinnest and the exchange is least visible. */
      flipTurn = Math.sin(p * Math.PI) * (Math.PI / 2);
      if (p >= 0.5 && shownRef.current !== want) setShown(want);
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

    /* The turn is applied to the inner group so it composes with the tilt
       instead of fighting it. The frame scale rides the same easing, so the
       wallet grows and shrinks during the turn rather than popping at the
       moment the meshes exchange. */
    const inner = root.current.children[0] as THREE.Object3D | undefined;
    if (inner) {
      inner.rotation.y = flipTurn;
      const target = shownRef.current ? OPEN_FRAME_SCALE : 1;
      inner.scale.setScalar(inner.scale.x + (target - inner.scale.x) * 0.12);
    }
  });

  const fitted = shown ? opened : closed;

  const surface = {
    /* White, because the colour now lives in the albedo map: a pull-up hide's
       mottling has to be in the texture, and multiplying that by a base colour
       as well would double the dye. */
    color: "#ffffff",
    map: maps.tint,
    /* A dielectric hide reflecting the whole softbox rig comes back as flat
       saturated plastic; a metal has no diffuse term at all and goes black
       under the same reduction. Two problems, two values. */
    envMapIntensity: finish.metalness > 0.5 ? 1.9 : 0.45,
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
      <group>
        <mesh geometry={fitted.geometry} scale={fitted.scale} castShadow receiveShadow>
          <meshPhysicalMaterial {...surface} />
        </mesh>

        <Stitching size={fitted.size} thread={threadColor} open={shown} />

        <Emboss
          engraving={look.engraving}
          emboss={emboss}
          leather={color.hex}
          size={fitted.size}
          open={shown}
        />

        {/* Notes live in the bill compartment, which only exists when the
            wallet is open. Shut, they would be geometry inside a solid. */}
        {shown && (
          <NoteStack
            notes={notes}
            open={1}
            arriving={arriving}
            style={look.notes}
            width={fitted.size.x * 0.5}
            /* Behind the panels and clearing the top edge: the bill slot runs
               along the spine at the back, which is where the client's own
               photograph shows the notes standing up out of. Placed at the
               front the stack sits inside solid geometry. */
            position={[fitted.size.x * 0.01, fitted.size.y * 0.4, -fitted.size.z * 0.22]}
          />
        )}
      </group>
    </group>
  );
}

/**
 * The stamped marks: the monogram and wordmark low right when shut, the
 * monogram over LAWFIC on the left panel and IDEAS · PEOPLE · PROGRESS low
 * right when open — as the client's renders have them.
 *
 * Stamped, not printed. A plane is held just clear of the face with everything
 * but the marks alpha-tested away; the marks carry a NEGATIVE bump so they read
 * as pressed into the hide, and blind embossing takes the leather's own colour
 * so the only thing distinguishing it is the way light falls into the
 * depression. That is what a real blind stamp is, and it is why a flat decal
 * always reads as a sticker.
 */
function Emboss({
  engraving,
  emboss,
  leather,
  size,
  open,
}: {
  engraving: string;
  emboss: { hex: string | null; roughness: number };
  leather: string;
  size: THREE.Vector3;
  open: boolean;
}) {
  const planeW = size.x * 0.98;
  const planeH = size.y * 0.98;

  const { bump, rough, mask } = useMemo(() => {
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

      if (open) {
        /* Left panel, under the card slots. */
        lockup(w * 0.22, h * 0.76, h * 0.1, "LAWFIC");
        /* Right, beside the coin pocket. */
        ctx.textAlign = "right";
        ctx.font = `500 ${h * 0.045}px ${serif}`;
        ctx.letterSpacing = `${h * 0.02}px`;
        ctx.fillText("IDEAS · PEOPLE · PROGRESS", w * 0.95, h * 0.9);
        ctx.letterSpacing = "0px";
      } else {
        lockup(w * 0.78, h * 0.76, h * 0.115, "LAWFIC");
      }
      return c;
    };

    const bumpTex = new THREE.CanvasTexture(draw("#101010", "#808080"));
    const roughTex = new THREE.CanvasTexture(draw("#d0d0d0", "#404040"));
    /* The mask must be white-on-black and cannot be the bump map: that one is
       a mid-grey field with near-black marks, so every texel falls below any
       alpha threshold high enough to remove the field and the whole plane —
       marks included — disappears. */
    const maskTex = new THREE.CanvasTexture(draw("#ffffff", "#000000"));
    for (const t of [bumpTex, roughTex, maskTex]) t.colorSpace = THREE.NoColorSpace;
    return { bump: bumpTex, rough: roughTex, mask: maskTex };
  }, [engraving, planeW, planeH, open]);

  /* Blind embossing has no foil: it is the hide's own colour, pressed. */
  const blind = emboss.hex === null;

  return (
    <mesh position={[0, 0, size.z / 2 + 0.02]}>
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
  open,
}: {
  size: THREE.Vector3;
  thread: string;
  open: boolean;
}) {
  const w = size.x * 0.995;
  const h = size.y * 0.995;

  const { bump, mask } = useMemo(() => {
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

      const run = (inset: number, dash: number, width: number) => {
        const r = Math.min(px, py) * 0.09;
        const x0 = px * inset;
        const y0 = py * inset * (px / py);
        const x1 = px - x0;
        const y1 = py - y0;
        ctx.lineWidth = width;
        ctx.setLineDash([dash, dash * 0.85]);
        ctx.beginPath();
        ctx.moveTo(x0 + r, y0);
        ctx.lineTo(x1 - r, y0);
        ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
        ctx.lineTo(x1, y1 - r);
        ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
        ctx.lineTo(x0 + r, y1);
        ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
        ctx.lineTo(x0, y0 + r);
        ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      if (open) {
        /* Open, only the spine. The perimeter run is derived from the bounding
           box, and an open wallet's box is not its outline — its panels tilt
           toward the camera, so the box is taller and wider than the leather
           and the dashes float off the edges. The spine is the one run whose
           position the box does predict. */
        ctx.lineWidth = px * 0.004;
        ctx.setLineDash([px * 0.009, px * 0.008]);
        ctx.beginPath();
        ctx.moveTo(px * 0.5, py * 0.12);
        ctx.lineTo(px * 0.5, py * 0.88);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        run(0.035, px * 0.011, px * 0.005);
      }
      return c;
    };

    const bumpTex = new THREE.CanvasTexture(draw("#f0f0f0", "#808080"));
    const maskTex = new THREE.CanvasTexture(draw("#ffffff", "#000000"));
    for (const t of [bumpTex, maskTex]) t.colorSpace = THREE.NoColorSpace;
    return { bump: bumpTex, mask: maskTex };
  }, [w, h, open]);

  return (
    <mesh position={[0, 0, size.z / 2 + 0.015]}>
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
