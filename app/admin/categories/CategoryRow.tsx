"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  createService,
  deleteCategory,
  deleteService,
  moveCategory,
  saveCategory,
  saveService,
  setCategoryLive,
} from "./actions";

/**
 * One category and the services inside it.
 *
 * CLOSED BY DEFAULT
 *
 * Twenty-one categories holding a couple of hundred services between them, all
 * expanded, is a page nobody can find anything on. The row shows what an agent
 * scanning the list needs — name, whether it is live, how many services — and
 * opens to the rest on request.
 *
 * THE SWITCH DOES NOT NEED THE ROW OPEN
 *
 * Taking a category off the site is the urgent action here: something is wrong
 * with it and it needs to stop being public now. So it is its own control with
 * its own request, reachable without opening anything.
 */

export type CategoryWithServices = {
  id: string;
  name: string;
  summary: string;
  icon: string;
  position: number;
  is_live: boolean;
  services: {
    id: string;
    slug: string;
    name: string;
    blurb: string;
    status: "live" | "soon";
    aliases: string[];
    position: number;
  }[];
};

export default function CategoryRow({
  category,
  isFirst,
  isLast,
}: {
  category: CategoryWithServices;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  /* Every action returns the same shape, so one runner handles all of them and
     the error lands in one place rather than in eight. */
  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) setError(result.error);
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {/* ── The row ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex items-center gap-2">
            <span className="truncate text-[14.5px] font-medium text-foreground">
              {category.name}
            </span>
            {!category.is_live && (
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                draft
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[11px] text-subtle">
            {category.id} · {category.services.length} service
            {category.services.length === 1 ? "" : "s"}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={isFirst || pending}
            onClick={() => run(() => moveCategory(category.id, "up"))}
            aria-label="Move up"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 disabled:opacity-30"
          >
            <ChevronUp size={15} />
          </button>
          <button
            type="button"
            disabled={isLast || pending}
            onClick={() => run(() => moveCategory(category.id, "down"))}
            aria-label="Move down"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 disabled:opacity-30"
          >
            <ChevronDown size={15} />
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setCategoryLive(category.id, !category.is_live))}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${
              category.is_live
                ? "bg-primary-light text-primary"
                : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {category.is_live ? "Live" : "Off"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="px-4 pb-3 text-[12px] text-danger">
          {error}
        </p>
      )}

      {/* ── Opened ───────────────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border bg-surface-2/40 px-4 py-4">
          <form
            action={(fd) => run(() => saveCategory(category.id, fd))}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Field label="Name" name="name" defaultValue={category.name} required />
            <Field label="Icon key" name="icon" defaultValue={category.icon} />
            <div className="sm:col-span-2">
              <Field label="Summary" name="summary" defaultValue={category.summary} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    confirm(
                      `Remove "${category.name}"? The ${category.services.length} service(s) inside it go too. This cannot be undone.`,
                    )
                  ) {
                    run(() => deleteCategory(category.id));
                  }
                }}
                className="rounded-lg px-3 py-2 text-[13px] text-danger hover:bg-danger-light"
              >
                Remove category
              </button>
            </div>
          </form>

          {/* ── Services ────────────────────────────────────────────── */}
          <h3 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Services
          </h3>

          <ul className="mt-2 space-y-2">
            {category.services.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-surface px-3 py-2.5">
                <form action={(fd) => run(() => saveService(s.id, fd))} className="grid gap-2 sm:grid-cols-4">
                  <Field label="Slug" name="slug" defaultValue={s.slug} required />
                  <Field label="Name" name="name" defaultValue={s.name} required />
                  <div className="sm:col-span-2">
                    <Field label="Blurb" name="blurb" defaultValue={s.blurb} />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Aliases (comma separated)"
                      name="aliases"
                      defaultValue={s.aliases.join(", ")}
                    />
                  </div>
                  <label className="block">
                    <span className="block text-[10.5px] uppercase tracking-wide text-subtle">
                      Status
                    </span>
                    <select
                      name="status"
                      defaultValue={s.status}
                      className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground"
                    >
                      <option value="live">Available now</option>
                      <option value="soon">Coming soon</option>
                    </select>
                  </label>
                  <div className="flex items-end gap-1.5">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] text-foreground disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(`Remove "${s.name}"?`)) run(() => deleteService(s.id));
                      }}
                      aria-label={`Remove ${s.name}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-danger-light"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </form>
              </li>
            ))}
          </ul>

          {adding ? (
            <form
              action={(fd) =>
                run(async () => {
                  const result = await createService(category.id, fd);
                  if (result.ok) setAdding(false);
                  return result;
                })
              }
              className="mt-3 grid gap-2 rounded-xl border border-dashed border-border px-3 py-3 sm:grid-cols-4"
            >
              <Field label="Slug" name="slug" placeholder="gst-registration" required />
              <Field label="Name" name="name" placeholder="GST Registration" required />
              <div className="sm:col-span-2">
                <Field label="Blurb" name="blurb" placeholder="One line for the menu row." />
              </div>
              <div className="sm:col-span-2">
                <Field label="Aliases (comma separated)" name="aliases" placeholder="gstin, gst number" />
              </div>
              <label className="block">
                <span className="block text-[10.5px] uppercase tracking-wide text-subtle">Status</span>
                <select
                  name="status"
                  defaultValue="soon"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground"
                >
                  <option value="live">Available now</option>
                  <option value="soon">Coming soon</option>
                </select>
              </label>
              <div className="flex items-end gap-1.5">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-background disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg px-2 py-1.5 text-[12.5px] text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              <Plus size={14} /> Add a service
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10.5px] uppercase tracking-wide text-subtle">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
      />
    </label>
  );
}
