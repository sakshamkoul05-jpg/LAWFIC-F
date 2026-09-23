"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { importCompiledCatalogue } from "./actions";

/**
 * The one-press way to get the existing catalogue into the database.
 *
 * It is shown only when there is nothing there, because that is the only
 * moment it is the obvious next step. Once categories exist, the thing to do
 * is edit them, and a prominent Import button beside them is an invitation to
 * duplicate work.
 */
export default function ImportCatalogue() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await importCompiledCatalogue();
            if (!result.ok) setError(result.error);
          })
        }
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-background disabled:opacity-50"
      >
        <Download size={15} />
        {pending ? "Importing…" : "Import the compiled catalogue"}
      </button>
      <p className="mt-2 text-[12px] text-muted-foreground">
        Everything arrives switched off. Nothing changes on the site until you
        turn a category on.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-[12px] text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
