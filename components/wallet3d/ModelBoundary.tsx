"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches a failure to load or parse the wallet .glb and renders the
 * procedural stand-in instead.
 *
 * Suspense alone is not enough here. It covers the model still loading; it does
 * not cover the model failing — a 404 after a bad deploy, a truncated response
 * on a flaky connection, a parse error from a re-export that broke. Without
 * this, any of those throws inside the Canvas and takes the whole scene down,
 * so a hero element becomes a blank rectangle on a signed-in money screen.
 *
 * It has to be a class. Error boundaries have no hook equivalent.
 */
export default class ModelBoundary extends Component<
  { fallback: ReactNode; children: ReactNode; onFail?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    /* Let the caller degrade the whole canvas rather than leaving a lit empty
       studio: a 3D scene with no object in it is worse than no 3D at all. */
    this.props.onFail?.();
    /* Worth a console line: the fallback looks deliberate, so a broken asset
       would otherwise ship silently and never be noticed. */
    console.error("[wallet] 3D model failed to load, using the drawn wallet", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
