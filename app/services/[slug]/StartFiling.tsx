"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { startFiling } from "@/app/orders/actions";

/**
 * Starting a filing charges nothing and commits to nothing. That is the whole
 * point of the request-and-quote flow, so the copy says it twice — once on the
 * button's caption and once underneath.
 */
export default function StartFiling({
  slug,
  turnaround,
}: {
  slug: string;
  turnaround: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-primary-hover"
        >
          {open ? "Close" : "Start this filing"}
        </button>
        <span className="text-[13px] text-muted">
          {turnaround} · nothing charged until we quote
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
              className="mt-5 max-w-lg rounded border border-border-2 bg-surface/40 p-5"
            >
              <label htmlFor="details" className="label text-muted">
                Anything we should know? (optional)
              </label>
              <textarea
                id="details"
                name="details"
                rows={3}
                placeholder="e.g. trading business in Pune, turnover about ₹60 lakh, no GST yet"
                className="mt-2.5 w-full rounded border border-border-2 bg-background/60 px-3 py-2.5 text-[14px] leading-relaxed text-bone outline-none focus:border-primary/50 placeholder:text-muted/60"
              />

              <button
                type="submit"
                disabled={pending}
                className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted sm:w-auto sm:px-7"
              >
                {pending ? "Sending…" : "Send request"}
              </button>

              {error && <p className="mt-4 text-[13px] text-rust">{error}</p>}

              <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
                We will check your file and send a quote with the government fee and our fee shown
                separately. You can decline it and pay nothing.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
