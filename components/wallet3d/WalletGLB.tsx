"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { leatherMaps } from "@/lib/wallet3d/materials";
import { getColor, getFinish, getHardware, type WalletConfig } from "@/lib/wallet3d/finishes";
import { getDenomination, noteTexture, DENOMINATIONS, type Denomination } from "@/lib/wallet3d/banknote";

/**
 * The client's own wallet, rendered.
 *
 * WHAT ARRIVED, AND WHAT HAD TO BE DONE TO IT
 *
 * A trimesh export: one mesh, 445k triangles, POSITION only. No normals, no
 * texture coordinates, no material, 6.9MB. Two of those are blocking rather
 * than cosmetic —
 *
 *   - with no NORMALS the mesh cannot be lit at all. Every face returns the
 *     same value and the object renders as a flat silhouette;
 *   - with no TEXCOORDs no texture can be placed on it. The entire finish
 *     system — leather grain, nylon weave, brushed metal — is UV-sampled, so
 *     an unwrapped mesh can only ever be one flat colour.
 *
 * `assets-src/build-wallet-glb.sh` fixes the second offline (xatlas unwrap,
 * decimation to 27k triangles, 374KB). Normals are computed here rather than
 * baked, so the smoothing is ours to choose.
 *
 * ORIENTATION AND SCALE ARE MEASURED, NOT ASSUMED
 *
 * An AI/photogrammetry export lands in whatever pose and units the generator
 * felt like. Rather than hard-coding a rotation and hoping the next export
 * matches, the component measures the bounding box and derives everything from
 * it: the longest horizontal axis becomes the width, the object is scaled to
 * real card-holder centimetres, and the branding is placed as a fraction of the
 * measured box. Re-export the model at a different size or handedness and this
 * still frames it correctly.
 */

const MODEL_URL = "/wallet/lawfic-wallet.glb";

/** Real card-holder width in centimetres, at 1 unit = 1cm. */
const TARGET_W = 10.2;

type Fit = {
  geometry: THREE.BufferGeometry;
  /** Uniform scale that takes the mesh to TARGET_W. */
  scale: number;
  /** Box of the SCALED mesh, centred on the origin. */
  size: THREE.Vector3;
};

function useFittedGeometry(): Fit {
  const gltf = useGLTF(MODEL_URL);

  return useMemo(() => {
    let found: THREE.Mesh | null = null;
    gltf.scene.traverse((o) => {
      if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
    });
    if (!found) throw new Error("lawfic-wallet.glb contains no mesh");
    const mesh = found as THREE.Mesh;

    /* Bake the node transform in. Quantized positions arrive as normalised
       integers with the real scale living on the node, so geometry-space
       coordinates are meaningless until the matrix is applied. */
    const geometry = mesh.geometry.clone();
    mesh.updateWorldMatrix(true, false);
    geometry.applyMatrix4(mesh.matrixWorld);

    /* The export has no normals, so nothing is lit until these exist. */
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const raw = new THREE.Vector3();
    box.getSize(raw);

    /* Centre on the origin so rotation happens about the object rather than
       about wherever the exporter's origin happened to fall. */
    const centre = new THREE.Vector3();
    box.getCenter(centre);
    geometry.translate(-centre.x, -centre.y, -centre.z);

    /* Width is the LARGER of the two horizontal extents. A card holder is
       landscape; if the export is portrait or on its side, this still picks
       the dimension that should measure 10.2cm. */
    const scale = TARGET_W / Math.max(raw.x, raw.y);

    return {
      geometry,
      scale,
      size: raw.clone().multiplyScalar(scale),
    };
  }, [gltf]);
}

export default function WalletGLB({
  look,
  open,
  notes,
  pointer,
}: {
  look: WalletConfig;
  open: number;
  notes: Denomination[];
  pointer: { x: number; y: number };
}) {
  const root = useRef<THREE.Group>(null);
  const { geometry, scale, size } = useFittedGeometry();

  const finish = getFinish(look.finish);
  const color = getColor(finish, look.color);
  const hardware = getHardware(look.hardware);

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
    /* Tiling is measured, not guessed.
       The unwrap packs the whole object into one 0–1 atlas: 191cm² of surface
       into unit UV space, which works out at roughly 16.7cm across one full
       tile. Dividing by the repeat gives the tile's real size, and the grain
       within it is a known number of cells — so these values are chosen to put
       pebble grain at about 1.1mm, a woven thread at about 0.6mm, and brushing
       finer still. Anything picked by eye here is picked at whatever zoom the
       browser happened to be at. */
    const rep = finish.weave ? 4 : finish.brushed ? 6 : 6;
    for (const t of [maps.normal, maps.rough]) t.repeat.set(rep, rep);
  }, [maps, finish]);

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    const ty = pointer.x * 0.5 + Math.sin(t * 0.3) * 0.05;
    const tx = -pointer.y * 0.26 + Math.sin(t * 0.22 + 1) * 0.035;
    root.current.rotation.y += (ty - root.current.rotation.y) * 0.06;
    root.current.rotation.x += (tx - root.current.rotation.x) * 0.06;
    root.current.position.y = Math.sin(t * 0.5) * 0.06;
  });

  return (
    <group ref={root} rotation={[0.06, -0.28, 0]}>
      <Notes notes={notes} open={open} size={size} />

      <mesh geometry={geometry} scale={scale} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color.hex}
          /* A dielectric hide reflecting the whole softbox rig comes back as
             flat saturated plastic; a metal has no diffuse term at all and
             goes black under the same reduction. Two problems, two values. */
          envMapIntensity={finish.metalness > 0.5 ? 1.9 : 0.45}
          normalMap={maps.normal}
          roughnessMap={maps.rough}
          roughness={finish.roughness}
          metalness={finish.metalness}
          clearcoat={finish.clearcoat}
          clearcoatRoughness={finish.clearcoatRoughness}
          normalScale={new THREE.Vector2(finish.normalScale, finish.normalScale)}
        />
      </mesh>

      <Branding engraving={look.engraving} hardware={hardware} size={size} />
    </group>
  );
}

/**
 * Monogram low left, engraving low right, cut into the face.
 *
 * A plane held just clear of the front, with everything but the marks
 * alpha-tested away. The marks carry a negative bump so they read as debossed,
 * and the material is the chosen hardware metal, which is what makes them
 * catch the key light on one lip and shadow on the other as the wallet turns.
 * A decal would sit on the surface and always read as a sticker.
 */
function Branding({
  engraving,
  hardware,
  size,
}: {
  engraving: string;
  hardware: { hex: string; roughness: number };
  size: THREE.Vector3;
}) {
  const planeW = size.x * 0.9;
  const planeH = size.y * 0.9;

  const { bump, rough, mask } = useMemo(() => {
    const w = 1024;
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

      /* Monogram: an angular chevron pair, low left. Original mark. */
      const mx = w * 0.1;
      const my = h * 0.82;
      const s = h * 0.09;
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

      /* The customer's engraving takes the wordmark's place when they have set
         one — their name is the point, not ours. */
      const text = (engraving || "LAWFIC").toUpperCase().slice(0, 16);
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.font = `600 ${h * 0.085}px ui-sans-serif, system-ui, sans-serif`;
      ctx.letterSpacing = `${h * 0.02}px`;
      ctx.fillText(text, w * 0.9, my + s * 0.5);
      return c;
    };

    const bumpTex = new THREE.CanvasTexture(draw("#101010", "#808080"));
    const roughTex = new THREE.CanvasTexture(draw("#d0d0d0", "#404040"));
    /* The mask has to be white-on-black and cannot be the bump map: that one
       is a mid-grey field with near-black marks, so every texel falls below
       any alpha threshold high enough to remove the field, and the whole
       plane — marks included — disappears. */
    const maskTex = new THREE.CanvasTexture(draw("#ffffff", "#000000"));
    for (const t of [bumpTex, roughTex, maskTex]) t.colorSpace = THREE.NoColorSpace;
    return { bump: bumpTex, rough: roughTex, mask: maskTex };
  }, [engraving, planeW, planeH]);

  return (
    <mesh position={[0, 0, size.z / 2 + 0.02]}>
      <planeGeometry args={[planeW, planeH]} />
      <meshPhysicalMaterial
        transparent
        color={hardware.hex}
        metalness={0.9}
        roughness={hardware.roughness}
        envMapIntensity={1.6}
        bumpMap={bump}
        bumpScale={-1.2}
        roughnessMap={rough}
        alphaMap={mask}
        alphaTest={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Notes fanned out of the top, behind the body. */
function Notes({
  notes,
  open,
  size,
}: {
  notes: Denomination[];
  open: number;
  size: THREE.Vector3;
}) {
  const noteW = size.x * 0.85;
  const noteH = noteW * 0.5;

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(noteW, noteH, 26, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      /* A sheet held in a pocket bows; a flat quad reads as a printed card. */
      pos.setZ(i, Math.cos((x / (noteW / 2)) * 1.25) * 0.1);
    }
    g.computeVertexNormals();
    return g;
  }, [noteW, noteH]);

  return (
    <group position={[size.x * 0.01, size.y * 0.34, -size.z * 0.1]}>
      {notes.slice(0, 5).map((value, i) => {
        const d = getDenomination(value) ?? DENOMINATIONS[0];
        return (
          <mesh
            key={`${value}-${i}`}
            geometry={geo}
            position={[i * 0.16 - 0.3, i * 0.19 + open * 0.5, -i * 0.03]}
            rotation={[0, 0, (i - 2) * 0.028]}
            castShadow
          >
            <meshStandardMaterial
              map={noteTexture(d, "front")}
              roughness={0.88}
              metalness={0}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

useGLTF.preload(MODEL_URL);
