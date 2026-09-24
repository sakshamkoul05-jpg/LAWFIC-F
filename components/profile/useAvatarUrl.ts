"use client";

import { useEffect, useState } from "react";

/**
 * The customer's own profile picture, for client components that cannot sign a
 * storage URL themselves.
 *
 * WHY THIS IS NOT JUST A FETCH IN A useEffect
 *
 * The site header renders on every page. A naive version would hit
 * /api/profile/photo on every navigation, for every visitor, to draw a 34px
 * circle — and for everybody who has never uploaded a photograph it would do
 * that to be told "no" each time.
 *
 * So the answer is cached in sessionStorage for the tab, including the negative
 * answer. The signed URL expires after ten minutes, so the cache carries the
 * time it was written and is thrown away at eight — early enough that a URL
 * handed out from cache always has room left on it.
 *
 * The module-level promise is the second half of it: several components asking
 * at once during one render share a single request rather than firing three.
 */

const KEY = "lawfic.avatar";
/** Two minutes short of the ten the signed URL actually lives. */
const TTL_MS = 8 * 60 * 1000;

type Cached = { url: string | null; at: number };

let inFlight: Promise<string | null> | null = null;

function read(): Cached | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Cached;
    if (typeof v.at !== "number" || Date.now() - v.at > TTL_MS) return null;
    return v;
  } catch {
    /* Private windows and blocked storage both land here. An avatar is not
       worth breaking a header over. */
    return null;
  }
}

function write(url: string | null) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ url, at: Date.now() } satisfies Cached));
  } catch {
    /* As above. */
  }
}

/** Called after an upload or a removal, so the header updates without a reload. */
export function clearAvatarCache() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* As above. */
  }
  inFlight = null;
  window.dispatchEvent(new Event("lawfic:avatar"));
}

async function load(): Promise<string | null> {
  const cached = read();
  if (cached) return cached.url;

  inFlight ??= (async () => {
    try {
      const res = await fetch("/api/profile/photo");
      /* 401 is the ordinary answer for a signed-out visitor, which is most of
         them. Not an error, and not worth a console line. */
      const url = res.ok ? (((await res.json()) as { avatarUrl?: string }).avatarUrl ?? null) : null;
      write(url);
      return url;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * `signedIn` gates the request entirely: a signed-out visitor never asks, which
 * is the difference between one request per session and one per page for the
 * majority of traffic.
 */
export function useAvatarUrl(signedIn: boolean): string | null {
  const [url, setUrl] = useState<string | null>(() => read()?.url ?? null);

  useEffect(() => {
    if (!signedIn) {
      setUrl(null);
      return;
    }

    let alive = true;
    const run = () => {
      void load().then((u) => {
        if (alive) setUrl(u);
      });
    };

    run();
    /* The studio fires this after a save, so the header changes at the moment
       the picture does rather than on the next hard reload. */
    window.addEventListener("lawfic:avatar", run);
    return () => {
      alive = false;
      window.removeEventListener("lawfic:avatar", run);
    };
  }, [signedIn]);

  return url;
}
