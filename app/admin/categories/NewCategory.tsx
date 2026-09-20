"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createCategory } from "./actions";

/**
 * Adding a category.
 *
 * It is collapsed until asked for, because the job on this page is almost
 * always editing what is already there. A form sitting open above the list
 * pushes the list down and implies adding is the usual thing to do.
 *
 * A NEW CATEGORY ARRIVES SWITCHED OFF
 *
 * Nothing reaches the public site until somebody decides it should. Creating a
 * category live would mean a half-filled one, with no services in it yet,
 * appearing in the menu the moment its name was typed.
 */
export default function NewCategory() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <Plus size={15} /> Add a category
      </button>
    );
  }

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const result = await createCategory(fd);
          if (result.ok) setOpen(false);
          else setError(result.error);
        })
      }
      className="grid gap-3 rounded-2xl border border-border px-4 py-4 sm:grid-cols-2"
    >
      <label className="block">
        <span className="block text-[10.5px] uppercase tracking-wide text-subtle">
          Id — becomes part of a URL
        </span>
        <input
          name="id"
          required
          placeholder="tax-and-filings"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
        />
      </label>

      <label className="block">
        <span className="block text-[10.5px] uppercase tracking-wide text-subtle">Name</span>
        <input
          name="name"
          required
          placeholder="Tax &amp; filings"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
        />
      </label>

      <div className="sm:col-span-2">
        <label className="block">
          <span className="block text-[10.5px] uppercase tracking-wide text-subtle">
            Summary — shown at the top of the menu panel
          </span>
          <input
            name="summary"
            placeholder="Returns, registrations and the paperwork around them."
            className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-[10.5px] uppercase tracking-wide text-subtle">Icon key</span>
        <input
          name="icon"
          defaultValue="business"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 font-mono text-[13px] text-foreground outline-none focus:border-border-3"
        />
      </label>

      {error && (
        <p role="alert" className="sm:col-span-2 text-[12px] text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50"
        >
          Create — switched off
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-2 text-[13px] text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
