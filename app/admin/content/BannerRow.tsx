"use client";

import { useState, useTransition } from "react";
import { TONES } from "@/lib/promotional";
import type { PromotionRow } from "@/lib/promotions-db";
import { moveBanner, saveBanner, setBannerLive } from "./actions";

/**
 * One banner, closed as a row and open as a form.
 *
 * CLOSED BY DEFAULT, BECAUSE ELEVEN OPEN FORMS IS NOT A LIST
 *
 * The job on this page is almost always "which of these is running" and
 * occasionally "change this headline". Eleven expanded forms answers the
 * second question badly and the first one not at all, so the row shows the
 * state and the copy, and editing is a click.
 *
 * THE SWITCH DOES NOT WAIT FOR THE FORM
 *
 * Turning a campaign off is the urgent action here — something is wrong with
 * a banner and it needs to stop being on the home page. So the toggle is its
 * own action with its own request and does not require the row to be open or
 * the form to be valid. A page where pulling a live banner means first fixing
 * a validation error on a field nobody touched is a page that will be fought
 * with at the worst possible moment.
 */

export default function BannerRow({ row, index, total }: { row: PromotionRow; index: number; total: number }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const tone = TONES[row.tone as keyof typeof TONES] ?? TONES.ink;

  const window =
    row.starts_at || row.ends_at
      ? [
          row.starts_at ? `from ${new Date(row.starts_at).toLocaleDateString("en-IN")}` : null,
          row.ends_at ? `until ${new Date(row.ends_at).toLocaleDateString("en-IN")}` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    setSaved(false);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "That did not work.");
      else setSaved(true);
    });
  }

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        {/* The tone, as the colour it actually is. A dropdown that says
            "ember" tells somebody nothing about what will appear on the page. */}
        <span
          aria-hidden
          className="size-9 shrink-0 rounded-lg"
          style={{ background: `linear-gradient(135deg, ${tone.from}, ${tone.to})`, boxShadow: `inset 0 0 0 1px ${tone.accent}66` }}
        />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium text-foreground">
            {row.title}
          </span>
          <span className="type-data mt-0.5 block truncate text-[11px] text-subtle">
            {row.eyebrow.toUpperCase()} · {row.href}
            {window ? ` · ${window}` : ""}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Move ${row.title} up`}
            disabled={index === 0 || pending}
            onClick={() => run(() => moveBanner(row.id, "up"))}
            className="grid size-7 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Move ${row.title} down`}
            disabled={index === total - 1 || pending}
            onClick={() => run(() => moveBanner(row.id, "down"))}
            className="grid size-7 place-items-center rounded-md text-subtle transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
          >
            ↓
          </button>
        </span>

        {/* A real checkbox driving the track, so it is focusable, announced as
            a switch and toggled by the space bar. */}
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={row.is_live}
            disabled={pending}
            onChange={(e) => run(() => setBannerLive(row.id, e.target.checked))}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="grid h-[20px] w-[34px] items-center rounded-full border border-border bg-surface-2 px-[3px] transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50"
          >
            <span
              className={`size-[14px] rounded-full transition-transform ${
                row.is_live ? "translate-x-[14px] bg-background" : "bg-foreground/50"
              }`}
            />
          </span>
          <span className="w-[34px] text-[11px] text-muted-foreground">
            {row.is_live ? "Live" : "Off"}
          </span>
        </label>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-border-3 hover:text-foreground"
        >
          {open ? "Close" : "Edit"}
        </button>
      </div>

      {error && (
        <p role="alert" className="px-5 pb-3 text-[12.5px] text-destructive">
          {error}
        </p>
      )}
      {saved && !error && !open && (
        <p role="status" className="px-5 pb-3 text-[12.5px] text-success">
          Saved. The home page is updated.
        </p>
      )}

      {open && (
        <form
          action={(fd) => run(() => saveBanner(row.id, fd))}
          className="grid gap-4 border-t border-border bg-surface-2/40 px-5 py-5 sm:grid-cols-2"
        >
          <Field name="eyebrow" label="Eyebrow" defaultValue={row.eyebrow} maxLength={40} hint="Small line above the headline" />
          <Field name="title" label="Headline" defaultValue={row.title} maxLength={70} hint="Set large — keep it under about nine words" />
          <div className="sm:col-span-2">
            <Field name="body" label="Supporting line" defaultValue={row.body} maxLength={200} textarea />
          </div>
          <Field name="cta_label" label="Button label" defaultValue={row.cta_label} maxLength={40} />
          <Field name="href" label="Links to" defaultValue={row.href} hint="A path on this site, starting with /" />

          <label className="block">
            <span className="type-label block text-muted">Tone</span>
            <select
              name="tone"
              defaultValue={row.tone}
              className="mt-2 w-full rounded-lg border border-border-2 bg-background px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-primary/50"
            >
              {Object.keys(TONES).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11.5px] text-subtle">
              One of the eleven site colours. The palette is not editable here —
              it is a set, and a one-off colour would not match anything else.
            </span>
          </label>

          <div className="flex items-end gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-primary px-5 py-2.5 text-[12.5px] font-medium text-background transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            {saved && !error && (
              <span role="status" className="text-[12.5px] text-success">
                Saved. The home page is updated.
              </span>
            )}
          </div>
        </form>
      )}
    </li>
  );
}

function Field({
  name,
  label,
  defaultValue,
  hint,
  maxLength,
  textarea = false,
}: {
  name: string;
  label: string;
  defaultValue: string;
  hint?: string;
  maxLength?: number;
  textarea?: boolean;
}) {
  const cls =
    "mt-2 w-full rounded-lg border border-border-2 bg-background px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-primary/50";
  return (
    <label className="block">
      <span className="type-label block text-muted">{label}</span>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} maxLength={maxLength} rows={2} className={cls} />
      ) : (
        <input name={name} defaultValue={defaultValue} maxLength={maxLength} className={cls} />
      )}
      {hint && <span className="mt-1.5 block text-[11.5px] text-subtle">{hint}</span>}
    </label>
  );
}
