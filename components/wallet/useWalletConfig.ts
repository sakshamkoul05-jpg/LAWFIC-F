"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CONFIG, getFinish, type WalletConfig } from "@/lib/wallet3d/finishes";
import { normalizeConfig } from "@/lib/wallet3d/config";

/**
 * The customer's wallet configuration, shared by every screen that draws it.
 *
 * Extracted because two pages render the same object — the wallet home and the
 * top-up screen — and a wallet that changes material when you go to add money
 * is not one wallet, it is two.
 *
 * WHERE IT LIVES NOW
 *
 * The database, through /api/wallet/config. It used to live only in
 * localStorage, which was a deliberate staging decision while the object was
 * still being redesigned — but the consequence was that a signed-in customer's
 * wallet returned to the factory finish on every new device, every private
 * window and every cleared cache, while the page promised "sign in to keep the
 * material, colour and engraving you choose". That was the bug.
 *
 * localStorage stays, demoted to a cache. It does two jobs the server cannot:
 *
 *   1. it paints instantly on a screen that mounts without a server-rendered
 *      config, so there is no flash of walnut before the customer's own finish
 *      arrives a round trip later;
 *   2. it is the whole store for a signed-out visitor, who can configure the
 *      demo wallet and keep it until they sign in — at which point the first
 *      save moves it to their account.
 *
 * `initial` is the server-rendered configuration. When it is given it wins over
 * the cache, because the row is the truth and the cache may be this browser's
 * memory of a different account.
 */

const STORE_KEY = "lawfic.wallet.config";

/** How long to let the studio settle before writing. Dragging a swatch fires a lot. */
const SAVE_DEBOUNCE_MS = 600;

function readCache(): Partial<WalletConfig> | null {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Partial<WalletConfig>) : null;
  } catch {
    /* Private windows and blocked storage both land here. A wallet finish is
       not worth breaking a money screen over. */
    return null;
  }
}

function writeCache(config: WalletConfig) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(config));
  } catch {
    /* As above. */
  }
}

export function useWalletConfig(engraving = "", initial?: WalletConfig) {
  const [config, setConfig] = useState<WalletConfig>(
    initial ? { ...initial } : { ...DEFAULT_CONFIG, engraving },
  );

  /* True once this browser has made a choice in this session. Guards the
     hydration read below: a server-rendered config must not be overwritten by
     a stale cache, but a choice made a second ago must not be either. */
  const touched = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Read after mount, never during render — the server cannot know what a
     browser cached, so rendering it on the first pass is a hydration mismatch. */
  useEffect(() => {
    if (initial || touched.current) return;
    const cached = readCache();
    if (cached) setConfig((c) => normalizeConfig({ ...c, ...cached }, c.engraving));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The engraving arrives with the row, not with the config, so a screen that
     mounts before the row lands gets it on the second pass. */
  useEffect(() => {
    if (!engraving) return;
    setConfig((c) => (c.engraving === engraving ? c : { ...c, engraving }));
  }, [engraving]);

  const save = useCallback((next: WalletConfig) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void fetch("/api/wallet/config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
        keepalive: true,
      }).catch(() => {
        /* Signed out (401), offline, or the save failed. The cache already has
           it, so the customer keeps their wallet in this browser either way.
           Nothing on screen changes, because nothing on screen was waiting. */
      });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  /* A pending save must not be lost to a navigation. */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const update = useCallback(
    (patch: Partial<WalletConfig>) => {
      touched.current = true;
      setConfig((c) => {
        const next = { ...c, ...patch };
        /* Changing finish can orphan the colour, since each finish carries its
           own short list. Fall to that finish's first rather than rendering a
           swatch it does not have. */
        if (patch.finish) {
          const f = getFinish(patch.finish);
          if (!f.colors.some((x) => x.id === next.color)) next.color = f.colors[0].id;
        }
        writeCache(next);
        save(next);
        return next;
      });
    },
    [save],
  );

  return { config, update };
}
