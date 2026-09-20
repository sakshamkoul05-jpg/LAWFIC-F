"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import JobForm, { type JobRow } from "./JobForm";

/**
 * The list, plus the one piece of state the server cannot hold: whether the
 * "new posting" form is open.
 *
 * The rows are server-rendered and each one manages its own open/closed state.
 * This exists only so the add form can be collapsed by default — a page whose
 * first element is a fifteen-field empty form buries the postings that are
 * actually being worked on.
 */
export default function JobList({ jobs }: { jobs: JobRow[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      {adding ? (
        <JobForm job={null} onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <Plus size={15} /> Post a job
        </button>
      )}

      {jobs.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border px-5 py-10 text-center text-[14px] text-muted-foreground">
          No postings yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobForm job={job} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
