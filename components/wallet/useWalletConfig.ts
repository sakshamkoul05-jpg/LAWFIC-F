"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CONFIG,
  getFinish,
  type WalletConfig,
} from "@/lib/wallet3d/finishes";

/**
 * The customer's wallet configuration, shared by every screen that draws it.
 *
 * Extracted because two pages now render the same object — the wallet home and
 * the top-up screen — and a wallet that changes material when you go to add
 * money is not one wallet, it is two. One key, one shape, one place that knows
 * how to migrate a stored value that no longer exists.
 *
 * WHY LOCAL STORAGE AND NOT THE DATABASE, STILL
 *
 * `wallet_prefs` holds hide, plate, thread and nameplate, which described a
 * bifold that no longer exists. The product is now a card holder configured by
 * finish, colour, hardware, thread, engraving and note style, and those columns
 * do not fit. The engraving still comes from the stored nameplate because that
 * is the one field whose meaning survived. The rest waits for a migration,
 * deliberately: the shape settles first, the schema follows. Writing one now
 * would pin the table to whichever design this week implies.
 */

const STORE_KEY = "lawfic.wallet.config";

export function useWalletConfig(engraving = "") {
  const [config, setConfig] = useState<WalletConfig>({
    ...DEFAULT_CONFIG,
    engraving,
  });

  /* Read after mount, never during render — the server cannot know what was
     chosen, so rendering it on the first pass is a hydration mismatch. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) setConfig((c) => ({ ...c, ...JSON.parse(raw) }));
    } catch {
      /* Private windows and blocked storage both land here. A wallet finish is
         not worth breaking a money screen over. */
    }
  }, []);

  const update = useCallback((patch: Partial<WalletConfig>) => {
    setConfig((c) => {
      const next = { ...c, ...patch };
      /* Changing finish can orphan the colour, since each finish carries its
         own short list. Fall to that finish's first rather than rendering a
         swatch it does not have. */
      if (patch.finish) {
        const f = getFinish(patch.finish);
        if (!f.colors.some((x) => x.id === next.color)) next.color = f.colors[0].id;
      }
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* As above. */
      }
      return next;
    });
  }, []);

  return { config, update };
}
