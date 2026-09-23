"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { createJob, deleteJob, saveJob, setJobLive } from "./actions";

/**
 * One job posting, and the form for a new one.
 *
 * ONE COMPONENT FOR BOTH
 *
 * A "new" form and an "edit" form that drift apart is how a field ends up
 * editable but not creatable. `job` being null is the only difference, and it
 * changes the action and the buttons, not the fields.
 */

export type JobRow = {
  id: string;
  title: string;
  employer: string;
  city: string;
  state: string;
  employment_type: string;
  category: string;
  description: string;
  apply_url: string | null;
  apply_email: string | null;
  salary_min_paise: number | null;
  salary_max_paise: number | null;
  is_live: boolean;
  posted_at: string;
  expires_at: string | null;
};

/** Paise back to the rupees the form shows. Blank stays blank. */
const toRupees = (paise: number | null) => (paise === null ? "" : String(paise / 100));

/** An ISO timestamp to what datetime-local expects, in local time. */
function forDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function JobForm({
  job,
  onDone,
}: {
  job: JobRow | null;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(job === null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) setError(result.error);
      else if (job === null) onDone?.();
    });

  const expired =
    job?.expires_at !== null && job?.expires_at !== undefined
      ? new Date(job.expires_at) < new Date()
      : false;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {job && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="min-w-0 flex-1 text-left"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[14.5px] font-medium text-foreground">
                {job.title || "Untitled posting"}
              </span>
              {!job.is_live && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                  draft
                </span>
              )}
              {/* An expired posting is still switched on but is not public.
                  Saying "live" would be a lie the agent acts on. */}
              {job.is_live && expired && (
                <span className="rounded-full bg-destructive-light px-2 py-0.5 text-[10.5px] text-destructive">
                  expired
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[11.5px] text-subtle">
              {[job.employer, [job.city, job.state].filter(Boolean).join(", "), job.employment_type]
                .filter(Boolean)
                .join(" · ") || "No details yet"}
            </span>
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setJobLive(job.id, !job.is_live))}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium ${
              job.is_live ? "bg-primary-light text-primary" : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {job.is_live ? "Live" : "Off"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="px-4 pb-3 text-[12px] text-destructive">
          {error}
        </p>
      )}

      {open && (
        <form
          action={(fd) => run(() => (job ? saveJob(job.id, fd) : createJob(fd)))}
          className={`grid gap-3 px-4 py-4 sm:grid-cols-2 ${job ? "border-t border-border bg-surface-2/40" : ""}`}
        >
          <div className="sm:col-span-2">
            <Field label="Title" name="title" defaultValue={job?.title} required />
          </div>
          <Field label="Employer" name="employer" defaultValue={job?.employer} />
          <Field label="Category" name="category" defaultValue={job?.category} placeholder="Accounts" />
          <Field label="City" name="city" defaultValue={job?.city} />
          <Field label="State" name="state" defaultValue={job?.state} />
          <Field
            label="Employment type"
            name="employment_type"
            defaultValue={job?.employment_type ?? "Full time"}
          />
          <Field
            label="Expires — blank runs until switched off"
            name="expires_at"
            type="datetime-local"
            defaultValue={forDateInput(job?.expires_at ?? null)}
          />

          <Field
            label="Salary from (₹ per year)"
            name="salary_min"
            defaultValue={toRupees(job?.salary_min_paise ?? null)}
            placeholder="Blank means not disclosed"
          />
          <Field
            label="Salary to (₹ per year)"
            name="salary_max"
            defaultValue={toRupees(job?.salary_max_paise ?? null)}
          />

          <Field label="Apply at (link)" name="apply_url" defaultValue={job?.apply_url ?? ""} />
          <Field label="Or apply by email" name="apply_email" defaultValue={job?.apply_email ?? ""} />

          <div className="sm:col-span-2">
            <label className="block">
              <span className="block text-[10.5px] uppercase tracking-wide text-subtle">
                Description
              </span>
              <textarea
                name="description"
                rows={5}
                defaultValue={job?.description}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none focus:border-border-3"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50"
            >
              {job ? "Save" : "Create — switched off"}
            </button>

            {job ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Remove "${job.title}"? This cannot be undone.`)) {
                    run(() => deleteJob(job.id));
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-destructive hover:bg-destructive-light"
              >
                <Trash2 size={14} /> Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={onDone}
                className="rounded-lg px-3 py-2 text-[13px] text-muted-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
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
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10.5px] uppercase tracking-wide text-subtle">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
      />
    </label>
  );
}
