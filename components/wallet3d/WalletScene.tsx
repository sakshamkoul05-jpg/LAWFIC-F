"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import WalletBifold from "./WalletBifold";
import ModelBoundary from "./ModelBoundary";
import type { WalletConfig } from "@/lib/wallet3d/finishes";
import type { Denomination } from "@/lib/wallet3d/banknote";

/**
 * The studio the wallet is photographed in.
 *
 * LIGHTING IS BUILT, NOT DOWNLOADED
 *
 * drei's `<Environment preset>` fetches an HDRI from a CDN, which is a
 * megabyte-ish blocking request to a third party on a signed-in money screen,
 * and it fails offline. The environment here is assembled from Lightformers —
 * literal softboxes placed in a cube map that three renders once — so the
 * reflections come from geometry we control, load instantly and cost nothing.
 *
 * Three lights doing three jobs, which is how a product is actually shot: a
 * large soft key at upper left for the form, a long thin rim behind to separate
 * the wallet from the background and draw its top edge, and a dim fill so the
 * shadow side is readable rather than black. The leather looks different as it
 * turns because these are real reflections of real shapes.
 *
 * PERFORMANCE
 *
 * DPR is capped at 2 — beyond that costs fill rate and buys nothing on a
 * wallet-sized object. Shadows are a single contact shadow rather than a shadow
 * map, because the only shadow that matters is the one under the object and a
 * 1024 map for it would be four times the cost for less accuracy. `frameloop`
 * drops to demand when the user is not interacting, so an idle tab is not
 * burning a core.
 */

export type WalletSceneProps = {
  config: WalletConfig;
  open: number;
  /** Change this to replay the notes' fly-in. */
  arriving?: number;
  notes: Denomination[];
  className?: string;
  /** Let the user turn it. */
  interactive?: boolean;
  /**
   * The GPU took the context away. Not hypothetical: a browser caps how many
   * live WebGL contexts a page may hold, drops them under memory pressure, and
   * kills them outright on a driver reset — and a hero element that renders a
   * blank rectangle when that happens is worse than one that was never 3D.
   */
  onLost?: () => void;
};

export default function WalletScene({
  config,
  open,
  arriving,
  notes,
  className = "",
  interactive = true,
  onLost,
}: WalletSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; from: number } | null>(null);

  /* Cursor drives a tilt, not a rotation — the wallet leans toward you rather
     than turning to face you, which is the difference between a product and a
     turntable. */
  useEffect(() => {
    if (!interactive) return;
    const el = host.current;
    if (!el) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (drag.current) {
        setPointer({ x: drag.current.from + (e.clientX - drag.current.x) / 160, y });
      } else {
        setPointer({ x: x * 0.6, y: y * 0.6 });
      }
    };
    const leave = () => !drag.current && setPointer({ x: 0, y: 0 });

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [interactive]);

  return (
    <div
      ref={host}
      className={`relative w-full touch-pan-y ${interactive ? "cursor-grab active:cursor-grabbing" : ""} ${className}`}
      style={{ aspectRatio: "16 / 11" }}
      onPointerDown={(e) => {
        if (!interactive) return;
        drag.current = { x: e.clientX, from: pointer.x };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        shadows={false}
        onCreated={({ gl }) => {
          /* Exposure, and the reason it is here rather than left alone.
             The default of 1.0 with a full softbox rig plus two directionals
             blows a mid-dark hide out to a flat saturated poster colour —
             violet leather rendered as grape plastic. Pulling exposure down
             and letting the key do the work restores the depth: the base
             colour stays dark, and the only bright pixels are actual
             specular hits on the grain. */
          gl.toneMappingExposure = 0.62;
          /* Tell the caller so it can put the drawn wallet back. Also prevent
             the default, which is what allows a restore to be attempted at
             all rather than the canvas being dead for good. */
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              onLost?.();
            },
            { passive: false },
          );
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0.4, 30]} fov={24} />

        <Suspense fallback={null}>
          {/* The softbox rig. Resolution is low on purpose: a blurred
              reflection of a big soft source is what it is reflecting, and 256
              is plenty for that. */}
          <Environment resolution={256}>
            <Lightformer
              form="rect"
              intensity={4.2}
              position={[-6, 6, 8]}
              scale={[14, 10, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={1.6}
              position={[8, 2, -6]}
              scale={[10, 3, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer form="circle" intensity={0.7} position={[0, -6, 4]} scale={9} />
            {/* A large, dim panel on the camera side. Dielectrics barely
                notice it; a METAL is nothing but its reflections, so without
                something to reflect back at the viewer a brushed titanium
                finish renders as a black slab with a rim light. This is the
                fill card a photographer would put behind the lens. */}
            <Lightformer
              form="rect"
              intensity={1.15}
              position={[0, 1, 14]}
              scale={[20, 14, 1]}
              target={[0, 0, 0]}
            />
            <mesh scale={40}>
              <sphereGeometry args={[1, 32, 16]} />
              <meshBasicMaterial color="#1c1d21" side={1} />
            </mesh>
          </Environment>

          <ambientLight intensity={0.16} />
          <directionalLight position={[-7, 8, 9]} intensity={1.5} />
          <directionalLight position={[8, 3, -4]} intensity={0.5} color="#cfd6e6" />

          <group position={[0, 0.6, 0]}>
            {/* The boundary is for a broken or missing asset — a 404 after a
                bad deploy, a truncated response, a re-export that will not
                parse. Suspense above only covers a model still loading.
                On failure the scene tells the caller, which puts the drawn
                wallet back rather than leaving a blank canvas. */}
            <ModelBoundary fallback={null} onFail={onLost}>
              <WalletBifold
                look={config}
                open={open}
                notes={notes}
                arriving={arriving}
                pointer={pointer}
              />
            </ModelBoundary>
          </group>

          <ContactShadows
            position={[0, -4.4, 0]}
            opacity={0.55}
            scale={22}
            blur={2.6}
            far={9}
            resolution={512}
            color="#000000"
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
