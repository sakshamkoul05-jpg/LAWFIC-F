"use client";

import type { ReactNode } from "react";

/** A submit button that asks first. For removals that cascade. */
export function ConfirmSubmit({ message, children, className }: { message: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
