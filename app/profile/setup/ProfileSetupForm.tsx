"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EXAM_OPTIONS,
  JOB_OPTIONS,
  EMPTY_PROFILE,
  type UserProfile,
} from "@/lib/profile";

type Stage = "loading" | "basics" | "interests" | "resume" | "done";

export default function ProfileSetupForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /* Something went wrong but the flow continues — never rendered as a blocker. */
  const [skipped, setSkipped] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      router.replace("/login");
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?next=/profile/setup");
        return;
      }
      setSavedName(data.user.user_metadata?.full_name ?? "");
      setStage("basics");
    });
  }, [router]);

  function patch(p: Partial<UserProfile>) {
    setError("");
    setProfile((prev) => ({ ...prev, ...p }));
  }

  const toggleArr = (key: "examsPreparing" | "jobsLooking", value: string) => {
    setError("");
    const cur = profile[key];
    patch({
      [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    } as Partial<UserProfile>);
  };

  const canBasics =
    profile.fullName.trim().length >= 2 && profile.qualification.trim().length >= 2;
  const hasInterest = profile.examsPreparing.length > 0 || profile.jobsLooking.length > 0;

  async function saveBasics() {
    if (!canBasics) return;
    if (!hasInterest) {
      setError("Pick at least one exam or job so we can personalise the site.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    setBusy(false);
    if (res.ok) {
      setStage("resume");
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save. Try again.");
    }
  }

  async function uploadResume() {
    if (!file) {
      setStage("done");
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/resume", { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) {
      const { resumePath } = await res.json();
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...profile, resumePath }),
      });
      setStage("done");
    } else {
      /* A failed résumé upload must never strand someone mid-onboarding.
         It is the one optional field in this flow, and the cost of blocking
         is severe: the account never reaches "done", never gets marked
         onboarded, and so the whole site stays impersonal for that person
         forever. Previously this set an error and left the user on this step
         with no way past it — which is exactly what happened whenever the
         storage bucket was missing.
         Tell them plainly, keep their answers, and move on. */
      const body = await res.json().catch(() => ({}));
      setSkipped(body.error === "storage_unavailable"
        ? "We could not store your résumé just now. Everything else is saved — you can add it later from your profile."
        : "That file could not be uploaded. Everything else is saved — you can add a résumé later from your profile.");
      setStage("done");
    }
  }

  const inputCls =
    "mt-2.5 w-full rounded border border-border bg-surface-2 px-3.5 py-3.5 text-[15px] text-foreground outline-none transition-colors focus:border-primary placeholder:text-subtle";
  const labelCls = "label text-muted";
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors ${
      active
        ? "border-primary bg-primary-light text-primary"
        : "border-border bg-surface-2 text-muted hover:border-primary/50 hover:text-foreground"
    }`;

  return (
    <div className="mt-10">
      <ProgressDots stage={stage} />
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
        <div className="border-b border-border px-7 py-5">
          <p className="label text-muted">{stepLabel(stage)}</p>
          <h2 className="mt-2 font-display text-[22px] text-foreground">{stepTitle(stage)}</h2>
        </div>
        <div className="p-7">
          <AnimatePresence mode="wait" initial={false}>
            {stage === "loading" && (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center text-[14px] text-muted"
              >
                Just a moment…
              </motion.p>
            )}

            {stage === "basics" && (
              <motion.form
                key="basics"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                onSubmit={(e) => { e.preventDefault(); saveBasics(); }}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="fullName" className={labelCls}>Full name</label>
                  <input
                    id="fullName"
                    autoComplete="name"
                    placeholder={savedName || "e.g. Arjun Mehta"}
                    value={profile.fullName}
                    onChange={(e) => patch({ fullName: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="city" className={labelCls}>City</label>
                    <input
                      id="city"
                      autoComplete="address-level2"
                      placeholder="e.g. Pune"
                      value={profile.city}
                      onChange={(e) => patch({ city: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelCls}>Mobile</label>
                    <input
                      id="phone"
                      inputMode="numeric"
                      placeholder="10-digit mobile"
                      value={profile.phone}
                      onChange={(e) => patch({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="qualification" className={labelCls}>Highest qualification</label>
                  <input
                    id="qualification"
                    list="qual-list"
                    placeholder="e.g. B.Com, B.Tech, Class 12"
                    value={profile.qualification}
                    onChange={(e) => patch({ qualification: e.target.value })}
                    className={inputCls}
                  />
                  <datalist id="qual-list">
                    <option value="Class 12" />
                    <option value="Class 10" />
                    <option value="Diploma" />
                    <option value="B.Com" />
                    <option value="B.Tech" />
                    <option value="B.A." />
                    <option value="B.Sc." />
                    <option value="LL.B." />
                    <option value="M.Com" />
                    <option value="M.B.A." />
                    <option value="M.A." />
                  </datalist>
                </div>
              </motion.form>
            )}

            {stage === "interests" && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-[14px] text-muted">
                  What are you preparing for? Pick as many as apply.
                </p>

                <p className="label mt-6 text-muted">Exams</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EXAM_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleArr("examsPreparing", e)}
                      aria-pressed={profile.examsPreparing.includes(e)}
                      className={chip(profile.examsPreparing.includes(e))}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <p className="label mt-6 text-muted">Jobs you are looking for</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {JOB_OPTIONS.map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => toggleArr("jobsLooking", j)}
                      aria-pressed={profile.jobsLooking.includes(j)}
                      className={chip(profile.jobsLooking.includes(j))}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {stage === "resume" && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-[14px] text-muted">
                  Adding your resume helps employers find you when a job matches your track. PDF
                  or Word, up to 2 MB. Optional for now.
                </p>
                <label
                  htmlFor="resume"
                  className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-2 px-6 py-10 text-center transition-colors hover:border-primary/60"
                >
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
                    <path d="M13 17V6m0 0L8.5 10.5M13 6l4.5 4.5" stroke="var(--color-primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 17v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4" stroke="var(--color-primary)" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <span className="text-[14px] font-medium text-foreground">
                    {file ? file.name : "Click to choose a file"}
                  </span>
                  <span className="text-[12px] text-subtle">PDF · DOC · DOCX — up to 2 MB</span>
                </label>
                <input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setError("");
                  }}
                />
              </motion.div>
            )}

            {stage === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center"
              >
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-light">
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
                    <path d="m7 13.5 4 4 8-9" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="mt-5 font-display text-[22px] text-foreground">
                  You are all set, {profile.fullName.split(" ")[0]}!
                </p>
                {/* The résumé step can fail without stopping onboarding, so the
                    news has to surface somewhere. Here, at the end, rather than
                    as a blocker mid-flow. */}
                {skipped && (
                  <p
                    role="status"
                    className="mx-auto mt-5 max-w-sm rounded-xl border border-border bg-surface-2 px-4 py-3 text-[12.5px] leading-relaxed text-muted"
                  >
                    {skipped}
                  </p>
                )}
                <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                  Your home page is now tailored to{" "}
                  <span className="text-foreground">
                    {profile.examsPreparing.join(", ") || profile.jobsLooking.join(", ") || "your track"}
                  </span>
                  . Wallet, jobs and recommendations will follow you around the site.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && stage !== "done" && (
            <p className="mt-4 text-[13px] leading-relaxed text-destructive">{error}</p>
          )}

          {stage === "basics" && (
            <FooterActions
              primary="Continue to interests"
              onPrimary={() => {
                if (!canBasics) {
                  setError("Enter your full name and qualification first.");
                  return;
                }
                setStage("interests");
              }}
            />
          )}

          {stage === "interests" && (
            <FooterActions
              primary="Save profile"
              primaryBusy={busy}
              onPrimary={saveBasics}
              secondary="Skip — choose later"
              onSecondary={() => {
                patch({ examsPreparing: [], jobsLooking: [] });
                saveBasics();
              }}
            />
          )}

          {stage === "resume" && (
            <FooterActions
              primary={file ? "Upload resume" : "Continue without resume"}
              primaryBusy={busy}
              onPrimary={uploadResume}
            />
          )}


          {stage === "done" && (
            <FooterActions
              primary="Take me to my personalised home"
              onPrimary={() => {
                router.push("/");
                router.refresh();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressDots({ stage }: { stage: Stage }) {
  const order: Stage[] = ["basics", "interests", "resume"];
  const current = order.indexOf(stage);
  if (current < 0) return null;
  return (
    <div className="mx-auto mb-6 flex max-w-xs items-center gap-1.5">
      {order.map((s, i) => (
        <div
          key={s}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{
            background: i <= current ? "var(--color-primary)" : "var(--color-border)",
          }}
        />
      ))}
    </div>
  );
}

function FooterActions({
  primary,
  secondary,
  onPrimary,
  onSecondary,
  primaryBusy,
}: {
  primary: string;
  secondary?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryBusy?: boolean;
}) {
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryBusy}
        className="w-full rounded-full bg-primary py-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
      >
        {primaryBusy ? "Saving…" : primary}
      </button>
      {secondary && (
        <button
          type="button"
          onClick={onSecondary}
          className="mt-3 w-full text-center text-[13px] text-muted hover:text-foreground"
        >
          {secondary}
        </button>
      )}
    </div>
  );
}

function stepLabel(stage: Stage): string {
  switch (stage) {
    case "basics": return "Step 1 of 3";
    case "interests": return "Step 2 of 3";
    case "resume": return "Step 3 of 3";
    case "done": return "Complete";
    default: return "";
  }
}

function stepTitle(stage: Stage): string {
  switch (stage) {
    case "basics": return "Tell us about yourself";
    case "interests": return "Your track";
    case "resume": return "Your resume (optional)";
    case "done": return "All set";
    default: return "";
  }
}