"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  EMPTY_PROFILE,
  EXAM_OPTIONS,
  JOB_OPTIONS,
  type UserProfile,
} from "@/lib/profile";

type Status = "idle" | "saving" | "saved" | "error";

export default function EditProfileForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [resumeBusy, setResumeBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((res) => (res.status === 401 ? null : res.ok ? res.json() : null))
      .then((data) => {
        if (!alive) return;
        if (data && "fullName" in data) setProfile(data);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function patch(p: Partial<UserProfile>) {
    setStatus("idle");
    setMessage("");
    setProfile((prev) => ({ ...prev, ...p }));
  }

  const toggleArr = (key: "examsPreparing" | "jobsLooking", value: string) => {
    setStatus("idle");
    const cur = profile[key];
    patch({
      [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    } as Partial<UserProfile>);
  };

  async function save() {
    if (profile.fullName.trim().length < 2) {
      setStatus("error");
      setMessage("Enter your full name.");
      return;
    }
    if (profile.qualification.trim().length < 2) {
      setStatus("error");
      setMessage("Tell us your educational qualification.");
      return;
    }
    setStatus("saving");
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      setStatus("saved");
      setMessage("Profile saved.");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(body.error ?? "Could not save. Try again.");
    }
  }

  async function uploadResume() {
    if (!file) return;
    setResumeBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/resume", { method: "POST", body: fd });
    setResumeBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(body.error ?? "Upload failed.");
      return;
    }
    const { resumePath } = await res.json();
    patch({ resumePath });
    setMessage("Resume updated. Don't forget to save the profile.");
    setFile(null);
  }

  async function changePassword() {
    if (password.length < 8) {
      setPwStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== password2) {
      setPwStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    setPwStatus("saving");
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPwStatus("saved");
      setPassword("");
      setPassword2("");
      setMessage("Password updated.");
    } else {
      setPwStatus("error");
      setMessage("Could not update the password. Try again.");
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

  if (loading) {
    return (
      <div className="mt-10 rounded-xl border border-border bg-surface p-10 text-center text-[14px] text-muted shadow-xl">
        Loading your profile…
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      {/* Basics */}
      <Card label="Personal details" title="Basics">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className={labelCls}>Full name</label>
              <input
                id="fullName"
                autoComplete="name"
                value={profile.fullName}
                onChange={(e) => patch({ fullName: e.target.value })}
                className={inputCls}
              />
            </div>
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
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div>
              <label htmlFor="qualification" className={labelCls}>Qualification</label>
              <input
                id="qualification"
                list="qual-list"
                placeholder="e.g. B.Com, B.Tech"
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
          </div>
        </div>
      </Card>

      {/* Interests */}
      <Card label="What drives your feed" title="Your track">
        <p className="text-[14px] text-muted">
          The exams you prepare for and the jobs you want shape your home page and job matches.
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
      </Card>

      {/* Resume */}
      <Card label="For employers" title="Resume">
        <p className="text-[14px] text-muted">
          PDF or Word, up to 2 MB. Stored privately under your account; shared only when you apply.
        </p>
        {profile.resumePath && (
          <p className="mt-4 rounded border border-border bg-surface-2 px-3.5 py-3 text-[13px] text-foreground">
            <span className="text-success">●</span> {profile.resumePath.split("/").pop()}
          </p>
        )}
        <label
          htmlFor="resume"
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-2 px-6 py-8 text-center transition-colors hover:border-primary/60"
        >
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden>
            <path d="M13 17V6m0 0L8.5 10.5M13 6l4.5 4.5" stroke="var(--color-primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 17v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4" stroke="var(--color-primary)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] font-medium text-foreground">
            {file ? file.name : profile.resumePath ? "Replace resume" : "Choose a file"}
          </span>
        </label>
        <input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx"
          className="sr-only"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setStatus("idle");
          }}
        />
        {file && (
          <button
            type="button"
            onClick={uploadResume}
            disabled={resumeBusy}
            className="mt-3 rounded-full border border-primary px-5 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resumeBusy ? "Uploading…" : "Upload resume"}
          </button>
        )}
      </Card>

      {/* Password */}
      <Card label="Security" title="Password">
        {profile.phone ? (
          <p className="text-[14px] text-muted">
            Optional — with a password you can also sign in with your email or phone without an OTP
            link.
          </p>
        ) : (
          <p className="text-[14px] text-muted">
            Add a password so you can sign in with email/phone even without an OTP link.
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pw" className={labelCls}>New password</label>
            <input
              id="pw"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwStatus("idle"); }}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="pw2" className={labelCls}>Confirm</label>
            <input
              id="pw2"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat it"
              value={password2}
              onChange={(e) => { setPassword2(e.target.value); setPwStatus("idle"); }}
              className={inputCls}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={changePassword}
          disabled={pwStatus === "saving"}
          className="mt-4 rounded-full border border-primary px-5 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {pwStatus === "saving" ? "Updating…" : "Set password"}
        </button>
      </Card>

      {/* Message + save */}
      {message && (
        <p
          className={`text-[13px] leading-relaxed ${
            status === "error" || pwStatus === "error" ? "text-destructive" : "text-muted"
          }`}
        >
          {message}
        </p>
      )}

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 shadow-xl">
        <Link
          href="/auth/signout"
          className="rounded-full px-4 py-2 text-[13px] text-muted transition-colors hover:text-destructive"
        >
          Sign out
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

function Card({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
      <div className="border-b border-border px-7 py-5">
        <p className="label text-muted">{label}</p>
        <h2 className="mt-2 font-display text-[22px] text-foreground">{title}</h2>
      </div>
      <div className="p-7">{children}</div>
    </section>
  );
}