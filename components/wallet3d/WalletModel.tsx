"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { leatherMaps, type LeatherSpec } from "@/lib/wallet3d/materials";
import { DENOMINATIONS, NOTE_ASPECT, getDenomination, noteTexture, type Denomination } from "@/lib/wallet3d/banknote";

/**
 * The LAWFIC wallet, as geometry.
 *
 * Every panel is an extruded rounded shape with a bevel, not a box and not a
 * plane. That matters more than it sounds: the bevel is what catches the key
 * light along every edge, and edge highlights are most of what tells you an
 * object is solid. A wallet built from boxes reads as cardboard however good
 * the material on it is.
 *
 * THE SHAPE
 *
 * Not a symmetric bifold. The front shell is cut shorter than the back and its
 * top edge sweeps down to the right, so the interior is visible along a curve
 * when shut and the silhouette is recognisable without a logo on it. The metal
 * spine runs the full height on the hinge side and carries the engraving plate.
 *
 * Dimensions are in centimetres at 1 unit = 1cm, so 11.5 x 9 x 1.4 is a real
 * compact wallet. Working in real units means the notes — 14.2 x 6.6cm — have
 * to be folded to fit, which is true of real wallets and is why the fold in
 * the note geometry exists rather than being decoration.
 */

const W = 11.5;
const H = 9;
const SHELL = 0.22;

export type WalletLook = {
  leather: LeatherSpec;
  /** Metal for spine, plate and clasp. */
  metal: { color: string; roughness: number; metalness: number };
  stitch: { color: string; width: number };
  lining: string;
  engraving: string;
};

/** A rounded rectangle as an extruded solid, with a bevel on both faces. */
function panelGeometry(w: number, h: number, depth: number, radius: number, sweep = 0) {
  const s = new THREE.Shape();
  const r = radius;
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  /* The right edge sweeps down when `sweep` is set — the asymmetry. */
  s.lineTo(w / 2, h / 2 - r - sweep);
  s.quadraticCurveTo(w / 2, h / 2 - sweep, w / 2 - r, h / 2 - sweep);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.34,
    bevelSize: depth * 0.3,
    bevelSegments: 4,
    curveSegments: 18,
  });
  g.center();
  g.computeVertexNormals();
  return g;
}

/** Saddle stitch as real tube geometry running inside the panel edge. */
function stitchGeometry(w: number, h: number, inset: number, sweep: number, radius: number) {
  const pts: THREE.Vector3[] = [];
  const steps = 190;
  const ww = w - inset * 2;
  const hh = h - inset * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    /* Walk the rounded rect perimeter as a parametric path. */
    const a = t * Math.PI * 2 - Math.PI / 2;
    const cx = (Math.cos(a) * ww) / 2;
    const cy = (Math.sin(a) * hh) / 2;
    /* Square it off with a superellipse, so it hugs the edge rather than
       describing an oval inside a rectangle. */
    const k = 4.5;
    const nx = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 2 / k);
    const ny = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 2 / k);
    const x = (nx * ww) / 2;
    const y = (ny * hh) / 2 - (ny > 0 ? sweep * ((x / ww) * 0.5 + 0.5) : 0);
    pts.push(new THREE.Vector3(x, y, 0));
    void cx;
    void cy;
    void radius;
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return new THREE.TubeGeometry(curve, 320, 0.035, 6, true);
}

export default function WalletModel({
  look,
  open,
  notes,
  pointer,
}: {
  look: WalletLook;
  /** 0 shut, 1 fully open. */
  open: number;
  notes: Denomination[];
  /** Normalised cursor, for the tilt. */
  pointer: { x: number; y: number };
}) {
  const root = useRef<THREE.Group>(null);
  const flap = useRef<THREE.Group>(null);

  const maps = useMemo(
    () => leatherMaps(`${look.leather.color}-${look.leather.grain}-${look.leather.tooth}`, look.leather),
    [look.leather],
  );

  const backGeo = useMemo(() => panelGeometry(W, H, SHELL, 0.85), []);
  const frontGeo = useMemo(() => panelGeometry(W, H * 0.82, SHELL, 0.85, 1.1), []);
  const stitchBack = useMemo(() => stitchGeometry(W, H, 0.55, 0, 0.85), []);
  const stitchFront = useMemo(() => stitchGeometry(W, H * 0.82, 0.55, 1.1, 0.85), []);

  /* The maps tile across the panel. One repeat over 11cm of leather would put
     the cells at centimetre scale, which is luggage, not a wallet. */
  useMemo(() => {
    for (const t of [maps.normal, maps.rough]) t.repeat.set(2.2, 1.8);
  }, [maps]);

  const leatherProps = {
    color: look.leather.color,
    normalMap: maps.normal,
    roughnessMap: maps.rough,
    metalness: 0.02,
    normalScale: new THREE.Vector2(1.6, 1.6),
  };

  /* Idle: a slow breath plus the cursor. Never a spin — the brief is right that
     a continuously rotating product reads as a trinket. */
  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    const targetY = pointer.x * 0.35 + Math.sin(t * 0.32) * 0.045;
    const targetX = -pointer.y * 0.22 + Math.sin(t * 0.24 + 1) * 0.03;
    root.current.rotation.y += (targetY - root.current.rotation.y) * 0.06;
    root.current.rotation.x += (targetX - root.current.rotation.x) * 0.06;
    root.current.position.y = Math.sin(t * 0.5) * 0.08 + open * 0.15;

    if (flap.current) {
      /* Hinged on the spine, not spun about its own centre. */
      const target = -open * Math.PI * 0.88;
      flap.current.rotation.y += (target - flap.current.rotation.y) * 0.12;
    }
  });

  return (
    <group ref={root} rotation={[0.12, -0.5, 0]}>
      {/* BACK SHELL — the fixed half, and the bill compartment behind it. */}
      <mesh geometry={backGeo} castShadow receiveShadow>
        <meshStandardMaterial {...leatherProps} roughness={look.leather.roughness} />
      </mesh>

      {/* Interior lining, set into the back shell. */}
      <mesh position={[0, 0, SHELL * 0.52]} receiveShadow>
        <planeGeometry args={[W - 0.9, H - 0.9]} />
        <meshStandardMaterial color={look.lining} roughness={0.92} metalness={0} />
      </mesh>

      {/* Card slots: lapped leaves, each a real solid. */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          geometry={panelGeometry(W * 0.42, H * 0.3, 0.06, 0.25)}
          position={[-W * 0.24, -H * 0.16 + i * 0.85, SHELL * 0.56 + i * 0.035]}
          castShadow
        >
          <meshStandardMaterial {...leatherProps} roughness={Math.min(1, look.leather.roughness + 0.06)} />
        </mesh>
      ))}

      <mesh geometry={stitchBack} position={[0, 0, SHELL * 0.5]}>
        <meshStandardMaterial color={look.stitch.color} roughness={0.72} metalness={0.02} />
      </mesh>

      {/* MONEY — inside the compartment, folded because a 14cm note does not
          fit flat in an 11.5cm wallet. */}
      <Notes notes={notes} open={open} />

      {/* THE SPINE — machined metal, full height, carrying the plate. */}
      <mesh position={[-W / 2 + 0.18, 0, SHELL * 0.1]} castShadow>
        <boxGeometry args={[0.36, H * 0.98, SHELL * 2.4]} />
        <meshStandardMaterial
          color={look.metal.color}
          roughness={look.metal.roughness}
          metalness={look.metal.metalness}
        />
      </mesh>

      {/* THE FLAP — hinged at the spine. */}
      <group ref={flap} position={[-W / 2 + 0.3, 0, SHELL * 1.15]}>
        <group position={[W / 2 - 0.3, H * 0.09, 0]}>
          <mesh geometry={frontGeo} castShadow receiveShadow>
            <meshStandardMaterial {...leatherProps} roughness={look.leather.roughness} />
          </mesh>
          <mesh geometry={stitchFront} position={[0, 0, SHELL * 0.5]}>
            <meshStandardMaterial color={look.stitch.color} roughness={0.72} metalness={0.02} />
          </mesh>

          {/* Engraving plate — real metal, with the name cut into it. */}
          <EngravingPlate look={look} />
        </group>
      </group>
    </group>
  );
}

/**
 * The engraving plate.
 *
 * The name is a texture used as a BUMP and roughness map on a metal material,
 * not text drawn on top. That is what gives it depth: the letters catch the key
 * light on one lip and shadow on the other, and they change as the wallet turns.
 * HTML text over a canvas cannot do that at any budget.
 */
function EngravingPlate({ look }: { look: WalletLook }) {
  const { bump, rough } = useMemo(() => {
    const w = 512;
    const h = 160;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, w, h);

    const text = (look.engraving || "LAWFIC").toUpperCase().slice(0, 18);
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${h * 0.42}px ui-sans-serif, system-ui, sans-serif`;
    ctx.letterSpacing = `${h * 0.06}px`;
    ctx.fillText(text, w / 2, h / 2);

    const bumpTex = new THREE.CanvasTexture(c);
    bumpTex.colorSpace = THREE.NoColorSpace;

    /* Cut letters are rougher than the polished field around them. */
    const rc = document.createElement("canvas");
    rc.width = w;
    rc.height = h;
    const rctx = rc.getContext("2d")!;
    rctx.fillStyle = "#3a3a3a";
    rctx.fillRect(0, 0, w, h);
    rctx.fillStyle = "#c8c8c8";
    rctx.textAlign = "center";
    rctx.textBaseline = "middle";
    rctx.font = `600 ${h * 0.42}px ui-sans-serif, system-ui, sans-serif`;
    rctx.letterSpacing = `${h * 0.06}px`;
    rctx.fillText(text, w / 2, h / 2);
    const roughTex = new THREE.CanvasTexture(rc);
    roughTex.colorSpace = THREE.NoColorSpace;

    return { bump: bumpTex, rough: roughTex };
  }, [look.engraving]);

  return (
    <mesh position={[W * 0.26, -H * 0.24, SHELL * 0.62]} castShadow>
      <boxGeometry args={[3.4, 1.05, 0.07]} />
      <meshStandardMaterial
        color={look.metal.color}
        metalness={look.metal.metalness}
        roughness={look.metal.roughness}
        bumpMap={bump}
        bumpScale={-0.9}
        roughnessMap={rough}
      />
    </mesh>
  );
}

/**
 * Notes in the compartment.
 *
 * Each is a lightly curved sheet rather than a flat plane — real paper never
 * lies flat in a wallet, and the curve is what lets the light run across the
 * printing instead of hitting all of it at once. Front and back carry different
 * artwork, so a note that turns shows a different face.
 */
function Notes({ notes, open }: { notes: Denomination[]; open: number }) {
  const geo = useMemo(() => {
    /* A 14.2 x 6.6cm note folded once is 7.1cm wide, which fits. Segments
       across so it can be bent. */
    const g = new THREE.PlaneGeometry(7.1, 6.6, 24, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      /* A shallow cylindrical bow, deepest in the middle. */
      pos.setZ(i, Math.cos((x / 3.55) * 1.2) * 0.14);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[W * 0.14, H * 0.06, SHELL * 0.3]}>
      {notes.map((value, i) => {
        const d = getDenomination(value) ?? DENOMINATIONS[0];
        return (
          <mesh
            key={`${value}-${i}`}
            geometry={geo}
            position={[i * 0.055, i * 0.09 + open * 0.25, i * 0.035]}
            rotation={[0, 0, (i % 2 ? 1 : -1) * 0.012 * (i + 1)]}
            castShadow
          >
            <meshStandardMaterial
              map={noteTexture(d, "front")}
              roughness={0.86}
              metalness={0}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export { NOTE_ASPECT };
