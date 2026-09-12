import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/settings";
import { AdminGate } from "../AdminGate";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = {
  title: "Site settings",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type AuditRow = {
  id: number;
  actor_email: string | null;
  action: string;
  entity: string;
  summary: string;
  created_at: string;
};

/**
 * Settings, and the last few changes made to anything.
 *
 * THE LOG IS ON THIS PAGE RATHER THAN ITS OWN
 *
 * An audit log nobody opens is a log that does not do its job. Sitting under
 * the controls it records, it gets read incidentally by whoever is about to
 * change something — which is the moment "who set this, and when" is actually
 * worth knowing. A dedicated page would be more thorough and would be visited
 * only after something had already gone wrong.
 */
export default async function AdminSettingsPage() {
  const supabase = await createClient();
  if (!supabase) return <AdminGate reason="not-connected" />;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return <AdminGate reason="signed-out" />;

  const { data: staff } = await supabase.rpc("is_staff");
  if (!staff) {
    return <AdminGate reason="not-staff" userId={auth.user.id} email={auth.user.email} />;
  }

  const settings = await loadSettings(supabase);

  const { data: auditData, error: auditError } = await supabase
    .from("admin_audit")
    .select("id, actor_email, action, entity, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const audit = (auditData ?? []) as AuditRow[];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <header className="border-b border-border pb-6">
        <p className="type-label text-primary">Back office</p>
        <h1 className="type-h1 mt-2 text-foreground">Site settings</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
          Everything here is live the moment it saves. There is no publish step
          and no deploy.
        </p>
      </header>

      <SettingsForm settings={settings} />

      <section className="mt-14 border-t border-border pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-foreground">Recent changes</h2>
          <p className="text-[12px] text-subtle">
            Every back-office change, permanently. Nobody can edit or delete this.
          </p>
        </div>

        {auditError && (
          <p className="mt-4 rounded-lg border border-border bg-surface-2 px-4 py-3 text-[12.5px] leading-relaxed text-muted">
            The change log is not available on this project yet — run the{" "}
            <code className="type-data">admin_control</code> migration and it
            starts recording from that point.
          </p>
        )}

        {!auditError && audit.length === 0 && (
          <p className="mt-4 text-[13px] text-muted">
            Nothing changed yet. The first edit you make will appear here.
          </p>
        )}

        {audit.length > 0 && (
          <ol className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            {audit.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-5 py-3 last:border-b-0"
              >
                <span className="type-data shrink-0 text-[11px] text-subtle">
                  {new Date(row.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="min-w-0 flex-1 text-[13px] text-foreground">{row.summary}</span>
                <span className="shrink-0 text-[11.5px] text-muted">
                  {row.actor_email ?? "unknown"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="mt-8 text-[12px] leading-relaxed text-subtle">
        Banners and flyers are on their own screen —{" "}
        <Link href="/admin/content" className="text-primary hover:text-primary-hover">
          Content
        </Link>
        . Prices, service copy and the trending list are still in the code; they
        are the next things to move here.
      </p>
    </div>
  );
}
