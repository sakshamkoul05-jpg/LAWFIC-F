"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { hasInterests, isCompleteProfile, type UserProfile } from "@/lib/profile";

type Job = {
  role: string;
  firm: string;
  city: string;
  exp: string;
  pay: string;
  tag: string;
  keywords: string[];
};

type ScoredJob = Job & { score: number };

const jobs: Job[] = [
  { role: "Accounts Assistant", firm: "Deshmukh Textiles", city: "Pune", exp: "1–3 years", pay: "₹18,000 – ₹24,000", tag: "Matched on trade", keywords: ["finance", "account", "fresher"] },
  { role: "GST Executive", firm: "Verma & Associates", city: "Nashik", exp: "2–4 years", pay: "₹22,000 – ₹30,000", tag: "Matched on trade", keywords: ["finance", "account"] },
  { role: "Field Officer — MSME Loans", firm: "Sahyadri Finserv", city: "Pune", exp: "0–2 years", pay: "₹16,000 – ₹21,000", tag: "Matched on experience", keywords: ["fresher", "sales"] },
  { role: "Compliance Associate", firm: "Kothari Foods Pvt Ltd", city: "Pune", exp: "1–2 years", pay: "₹20,000 – ₹26,000", tag: "Matched on trade", keywords: ["legal", "law"] },
  { role: "Data Entry — Registrations", firm: "LAWFIC", city: "Remote", exp: "Fresher", pay: "₹14,000 – ₹18,000", tag: "Open to freshers", keywords: ["admin", "data", "fresher"] },
];

const KEYWORDS = new Map<string, string[]>([
  ["account", ["account", "finance"]],
  ["fresher", ["fresher", "data", "admin"]],
  ["legal", ["legal", "law"]],
  ["government", ["government", "data", "admin"]],
  ["sales", ["sales", "fresher"]],
  ["it", ["data", "admin"]],
]);

function scoreJob(job: Job, profile: UserProfile): number {
  const sig = [...profile.jobsLooking.map((j) => j.toLowerCase()), ...profile.examsPreparing.map((e) => e.toLowerCase())].join(" ");
  const city = profile.city.trim().toLowerCase();
  if (city && job.city.toLowerCase() === city) return 5;
  let score = 0;
  for (const [bucket, needles] of KEYWORDS) {
    if (!sig.includes(bucket)) continue;
    if (job.keywords.some((k) => needles.includes(k))) score += 3;
  }
  return score;
}

export default function JobFeed() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data && isCompleteProfile(data)) setProfile(data);
        if (alive) setReady(true);
      })
      .catch(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const list: ScoredJob[] = useMemo(() => {
    if (!profile || !hasInterests(profile)) return jobs.map((j) => ({ ...j, score: 0 }));
    return [...jobs]
      .map((j) => ({ ...j, score: scoreJob(j, profile) }))
      .sort((a, b) => b.score - a.score);
  }, [profile]);

  const matched = profile && list.some((j) => j.score > 0);
  const firstName = profile?.fullName.split(" ")[0];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded border border-border-2 bg-surface/40 px-6 py-4">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
        {matched && firstName ? (
          <p className="text-[14px] text-muted-foreground">
            Re-ordered by your track, <span className="text-foreground font-medium">{firstName}</span>.{" "}
            <Link href="/profile/setup" className="text-primary hover:text-primary-hover">
              Edit interests
            </Link>
          </p>
        ) : !ready ? (
          <p className="text-[14px] text-muted-foreground">Matching jobs to your profile…</p>
        ) : (
          <p className="text-[14px] text-muted-foreground">
            Showing a sample feed.{" "}
            <Link href="/login?next=/jobs" className="text-primary hover:text-primary-hover">
              Sign in
            </Link>{" "}
            to match these to your profile.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border">
        {list.map((j, i) => (
          <Reveal key={j.role} delay={i * 0.05}>
            <article className="card grid gap-5 border-0! p-7 md:grid-cols-[1.5fr_1fr_auto] md:items-center md:gap-8">
              <div>
                <p className="label text-primary">{j.tag}</p>
                <h2 className="mt-3 font-display text-[21px] leading-snug text-foreground">{j.role}</h2>
                <p className="mt-1.5 text-[14px] text-muted-foreground">{j.firm}</p>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-1 md:gap-2.5">
                <div>
                  <dt className="label text-muted">Location</dt>
                  <dd className="mt-0.5 text-[13.5px] text-muted-foreground">{j.city}</dd>
                </div>
                <div>
                  <dt className="label text-muted">Experience</dt>
                  <dd className="mt-0.5 text-[13.5px] text-muted-foreground">{j.exp}</dd>
                </div>
                <div>
                  <dt className="label text-muted">Monthly</dt>
                  <dd className="mt-0.5 font-mono text-[13px] text-foreground tnum">{j.pay}</dd>
                </div>
              </dl>

              <span className="justify-self-start rounded-full border border-border-2 px-5 py-2.5 text-[13px] text-foreground transition-colors md:justify-self-end">
                Apply
              </span>
            </article>
          </Reveal>
        ))}
      </div>
    </>
  );
}