"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { WalletLook } from "./WalletModel";
import type { Denomination } from "@/lib/wallet3d/banknote";

/**
 * Decides whether this device gets the 3D wallet, and catches it when the GPU
 * changes its mind.
 *
 * THREE WAYS THIS FALLS BACK, ALL OF THEM REAL
 *
 *   - no WebGL at all. Rare now, but it exists: locked-down enterprise
 *     browsers, software rendering disabled, some older Android;
 *   - the context is LOST after a successful start. Browsers cap how many live
 *     contexts a page holds, drop them under memory pressure and kill them on a
 *     driver reset. This is the common one and the easiest to forget;
 *   - the visitor asked for reduced motion, in which case a slowly breathing
 *     3D object is exactly what they asked not to have.
 *
 * In all three the caller's fallback renders instead. The drawn CSS wallet is
 * still in the tree and is the fallback, which is why it has not been deleted.
 *
 * The scene is imported dynamically with ssr false — three has no business in
 * the server bundle, and the whole stack is a few hundred kilobytes that a
 * visitor who never reaches the wallet should not pay for.
 */

const WalletScene = dynamic(() => import("./WalletScene"), {
  ssr: false,
  loading: () => null,
});

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function WalletStage({
  look,
  open,
  notes,
  fallback,
  className = "",
}: {
  look: WalletLook;
  open: number;
  notes: Denomination[];
  fallback: React.ReactNode;
  className?: string;
}) {
  const [state, setState] = useState<"checking" | "ok" | "no">("checking");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setState(!reduced && webglAvailable() ? "ok" : "no");
  }, []);

  /* Nothing on the first pass. The check needs a browser, and rendering the
     fallback first would flash the drawn wallet in front of everyone who is
     about to get the real one. */
  if (state === "checking") return <div className={className} style={{ aspectRatio: "16 / 11" }} />;
  if (state === "no") return <>{fallback}</>;

  return (
    <WalletScene
      look={look}
      open={open}
      notes={notes}
      className={className}
      onLost={() => setState("no")}
    />
  );
}
