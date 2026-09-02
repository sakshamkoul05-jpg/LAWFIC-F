"use client";

import { useEffect, useState, type RefObject } from "react";
import { useInView } from "motion/react";

/**
 * `useInView`, but content is never left invisible when the observer does not
 * report back.
 *
 * Every signature animation on the site holds its content at opacity 0 until
 * an IntersectionObserver callback arrives. That is fine when the callback
 * arrives. When it does not — the API is stubbed, the document is hidden so
 * the browser suspends delivery, an embedded or automated context never
 * composites the page — the result is not an unanimated card, it is a blank
 * one. On a service page that means the headline, the fee table and the whole
 * specimen simply are not there.
 *
 * The probe runs once per page and is shared by every caller: it observes a
 * real, attached, on-screen element and waits to actually be called. A plain
 * feature check (`"IntersectionObserver" in window`) passes in all of the
 * failure cases above and so catches none of them.
 *
 * When the observer works, this is exactly `useInView` and animations play as
 * written. When it does not, everything is reported in view and the content
 * renders plainly. Content degrades to visible, never to absent.
 */

let probe: Promise<boolean> | null = null;

/**
 * The settled result, cached so a component mounting *after* the probe has
 * finished knows immediately rather than starting from a false assumption and
 * correcting an effect later. That matters because `initial` is only read when
 * a motion element mounts: a component that remounts to pick up the degraded
 * state must see it on its very first render, or it mounts hidden all over
 * again. Null means "not answered yet".
 */
let probeResult: boolean | null = null;

function observerWorks(): Promise<boolean> {
  if (probe) return probe;

  probe = new Promise<boolean>((resolve) => {
    if (typeof IntersectionObserver !== "function") {
      probeResult = false;
      return resolve(false);
    }

    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(el);

    let settled = false;
    const finish = (works: boolean) => {
      if (settled) return;
      settled = true;
      probeResult = works;
      io.disconnect();
      el.remove();
      resolve(works);
    };

    const io = new IntersectionObserver(() => finish(true));
    io.observe(el);
    setTimeout(() => finish(false), 900);
  });

  return probe;
}

export function useInViewSafe(
  ref: RefObject<Element | null>,
  options?: Parameters<typeof useInView>[1],
): boolean {
  const inView = useInView(ref, options);
  const [observerBroken, setObserverBroken] = useState(() => probeResult === false);

  useEffect(() => {
    let alive = true;
    observerWorks().then((works) => {
      if (alive && !works) setObserverBroken(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return inView || observerBroken;
}

/** Exposed so `Reveal` can make the same decision without observing anything. */
export function useObserverBroken(): boolean {
  // Seeded from the cache so a remount sees the answer on its first render.
  // On the server this is always null, so SSR and first hydration agree.
  const [broken, setBroken] = useState(() => probeResult === false);
  useEffect(() => {
    let alive = true;
    observerWorks().then((works) => {
      if (alive && !works) setBroken(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return broken;
}
