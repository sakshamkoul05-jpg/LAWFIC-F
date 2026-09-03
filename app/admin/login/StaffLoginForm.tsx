"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Email and password, against the same auth the rest of the site uses.
 *
 * ERRORS ARE DELIBERATELY VAGUE
 *
 * "Those details did not work" rather than "no such user" or "wrong password".
 * A precise message on a back-office door tells anyone who finds it which email
 * addresses belong to staff, which is the first half of the work. The customer
 * login can afford to be more helpful because its audience is people who have
 * forgotten their own password; this one cannot.
 *
 * Sign-in is not authorisation. Anyone with an account can complete this form
 * and land on /admin — where the page checks `is_staff()` against the database
 * and shows them the door if they are not. That is on purpose: the check that
 * matters belongs in the database, and a login page that pretended to make it
 * would be a second place to get it wrong.
 */
export default function StaffLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const supabase = createClient();
    if (!supabase) {
      setError("This build has no database configured.");
      return;
    }

    setBusy(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setBusy(false);
      setError("Those details did not work.");
      return;
    }

    /* Only ever back into the back office. `next` arrives in a query string, so
       an open redirect here would let a link that looks like a LAWFIC staff
       login deposit someone on another site with a fresh session. */
    const safe = next.startsWith("/admin") ? next : "/admin";
    router.push(safe);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6">
      <label className="block">
        <span className="text-[12px] font-medium text-muted-foreground">Work email</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-[14px] text-foreground outline-none focus:border-primary/50"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-[12px] font-medium text-muted-foreground">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-[14px] text-foreground outline-none focus:border-primary/50"
        />
      </label>

      {error && (
        <p role="alert" className="mt-4 text-[12.5px] text-[#ff6b6b]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-[14px] font-medium text-background transition-opacity disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
