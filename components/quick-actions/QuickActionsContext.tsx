"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * One widget, two triggers.
 *
 * The brief asks for the ball in the corner of every page AND a logo low on
 * the home page, both opening the same thing. The obvious implementation —
 * render the widget twice — produces two panels that can both be open, two
 * Escape handlers fighting over the same key, and two elements claiming the
 * same corner. So the widget is mounted exactly once in ThemeShell and the
 * open/closed flag lives here, above both triggers.
 *
 * Anything on the page can now open it with `useQuickActions().open()`.
 */

type QuickActionsState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /**
   * Set when something OTHER than the floating ball opened the panel, so the
   * widget knows not to hand focus back to a button the visitor never touched.
   */
  openedBy: "ball" | "external" | null;
};

const Ctx = createContext<QuickActionsState | null>(null);

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [openedBy, setOpenedBy] = useState<QuickActionsState["openedBy"]>(null);

  const open = useCallback(() => setOpenedBy("external"), []);
  const close = useCallback(() => setOpenedBy(null), []);
  const toggle = useCallback(
    () => setOpenedBy((current) => (current ? null : "ball")),
    [],
  );

  const value = useMemo<QuickActionsState>(
    () => ({ isOpen: openedBy !== null, open, close, toggle, openedBy }),
    [openedBy, open, close, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Returns null rather than throwing when there is no provider — /admin
 * deliberately renders without the shopfront chrome, and a stray component
 * asking for the widget there should be inert, not a crash.
 */
export function useQuickActions(): QuickActionsState | null {
  return useContext(Ctx);
}
