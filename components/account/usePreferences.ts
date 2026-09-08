"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Two of the blueprint's account rows — "Set Dash Board Preference" and
 * "Account Privacy" — as preferences held on the device.
 *
 * WHY THESE TWO AND NOT THE OTHERS
 *
 * Both change how THIS browser behaves and nothing else: which sections the
 * home page shows, and whether the site uses the profile to personalise itself.
 * Nothing about them needs to reach a server to be true, so nothing about them
 * needs a table, a migration or a round trip. The other rows in that list are a
 * different matter — an address used on a filing, a PIN, a stored document are
 * facts about an account rather than settings on a machine, and putting those
 * in local storage would be pretending to have built them.
 *
 * That distinction is the whole design here: a preference is local because it
 * IS local, not because the database was inconvenient.
 */

export type DashboardSections = {
  promotions: boolean;
  why: boolean;
  trending: boolean;
  categories: boolean;
};

export type Privacy = {
  /** Use the saved profile to reorder the home page and the jobs feed. */
  personalise: boolean;
  /** Show the greeting and name in the header. */
  showName: boolean;
};

export type Preferences = {
  sections: DashboardSections;
  privacy: Privacy;
};

export const DEFAULT_PREFERENCES: Preferences = {
  sections: { promotions: true, why: true, trending: true, categories: true },
  privacy: { personalise: true, showName: true },
};

const KEY = "lawfic.account.preferences";

export function useAccountPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  /* Read after mount, never during render. The server cannot know what is in
     this browser's storage, so rendering from it on the first pass guarantees
     the markup differs from the server's and React swaps it out. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        setPrefs({
          sections: { ...DEFAULT_PREFERENCES.sections, ...parsed.sections },
          privacy: { ...DEFAULT_PREFERENCES.privacy, ...parsed.privacy },
        });
      }
    } catch {
      /* Private windows and blocked storage both land here. A preference is
         not worth breaking the page over. */
    }
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((current) => {
      const next: Preferences = {
        sections: { ...current.sections, ...patch.sections },
        privacy: { ...current.privacy, ...patch.privacy },
      };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
        /* Same-tab listeners do not get a `storage` event — that only fires in
           OTHER tabs — so the home page would keep its old layout until a
           reload without this. */
        window.dispatchEvent(new CustomEvent("lawfic:preferences", { detail: next }));
      } catch {
        /* As above. */
      }
      return next;
    });
  }, []);

  return { prefs, update, loaded };
}

/**
 * Read the preferences outside the settings screen — on the home page, which
 * has to react when they change in the same tab.
 */
export function usePreferencesValue(): Preferences {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return setPrefs(DEFAULT_PREFERENCES);
        const parsed = JSON.parse(raw) as Partial<Preferences>;
        setPrefs({
          sections: { ...DEFAULT_PREFERENCES.sections, ...parsed.sections },
          privacy: { ...DEFAULT_PREFERENCES.privacy, ...parsed.privacy },
        });
      } catch {
        setPrefs(DEFAULT_PREFERENCES);
      }
    };
    read();

    const onCustom = (e: Event) => setPrefs((e as CustomEvent<Preferences>).detail);
    window.addEventListener("lawfic:preferences", onCustom);
    /* And the cross-tab case, which is the one `storage` is actually for. */
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("lawfic:preferences", onCustom);
      window.removeEventListener("storage", read);
    };
  }, []);

  return prefs;
}
