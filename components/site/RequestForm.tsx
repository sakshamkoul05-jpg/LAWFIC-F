"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { startFiling } from "@/app/orders/actions";

/**
 * The request form, used by every service page and every document page.
 *
 * It is a REQUEST, not an application. LAWFIC quotes the government fee and
 * its own fee separately once it has seen the file, and the customer can
 * decline and pay nothing — so this collects only what is needed to produce
 * that quote, and says so twice: once beside the button and once underneath.
 * Asking for a full application before anyone has priced the work would be
 * asking for effort in exchange for nothing.
 *
 * When someone is signed in their name, phone and city are already on file,
 * so the form does not ask again. It says what it already knows instead,
 * which is both shorter and a small proof that signing in was worth it.
 */
export default function RequestForm({
  slug,
  label,
  turnaround,
}: {
  slug: string;
  /** What is being requested, in the customer's words. */
  label: string;
  /** Shown beside the button when the page knows it. */
  turnaround?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<{ fullName: string; city: string; phone: string } | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (alive && p?.fullName) setProfile(p);
      })
      .catch(() => {
        /* Signed out, or profile not set up. The form still works. */
      });
    return () => {
      alive = false;
    };
  }, [open]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-primary-hover"
        >
          {open ? "Close" : `Request ${label}`}
        </button>
        <span className="text-[13px] text-muted">
          {turnaround ? `${turnaround} · ` : ""}nothing charged until we quote
        </span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <form
              action={(fd) => {
                setError("");
                fd.set("slug", slug);
                start(async () => {
                  const res = await startFiling(fd);
                  if (res?.error) setError(res.error);
                });
              }}
              className="mt-5 max-w-lg rounded-xl border border-border-2 bg-surface/50 p-5"
            >
              <p className="type-label text-primary">Requesting</p>
              <p className="mt-1 text-[14px] font-medium text-foreground">{label}</p>

              {profile && (
                <p className="mt-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
                  We will use the details on your profile
                  {profile.city ? ` — ${profile.fullName}, ${profile.city}` : ` — ${profile.fullName}`}.
                </p>
              )}

              <label htmlFor={`details-${slug}`} className="type-label mt-4 block text-muted">
                Anything we should know? (optional)
              </label>
              <textarea
                id={`details-${slug}`}
                name="details"
                rows={3}
                placeholder="e.g. the name on my PAN does not match my Aadhaar"
                className="mt-2 w-full rounded-lg border border-border-2 bg-background/60 px-3 py-2.5 text-[14px] leading-relaxed text-foreground outline-none placeholder:text-subtle focus:border-primary/50"
              />

              <button
                type="submit"
                disabled={pending}
                className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted sm:w-auto sm:px-7"
              >
                {pending ? "Sending…" : "Send request"}
              </button>

              {error && (
                <p role="alert" className="mt-4 text-[13px] text-destructive">
                  {error}
                </p>
              )}

              <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
                We check your file and send a quote with the government fee and our fee shown
                separately. You can decline it and pay nothing.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
