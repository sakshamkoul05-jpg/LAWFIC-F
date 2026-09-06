import Link from "next/link";
import { formatEntry } from "@/lib/money";

/**
 * Recent activity, in the CRED register.
 *
 * The differences from the panel this replaces are all about where the weight
 * sits. Credits are the only coloured thing in the list, amounts are tabular
 * monospace so the column aligns on the decimal, the date is demoted to a
 * caption, and the row separator is a hairline rather than a border — a
 * statement should read as a ledger, not as a stack of cards.
 *
 * The empty state is deliberately not a shrug. It says what will appear here
 * and offers the one action that makes it appear.
 */

export type ActivityRow = {
  id: string;
  direction: "credit" | "debit";
  amount_paise: number;
  reason: string;
  created_at: string;
};

function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function WalletActivity({ rows }: { rows: ActivityRow[] }) {
  return (
    <section aria-labelledby="wallet-activity">
      <div className="mb-4 flex items-baseline justify-between px-1">
        <h2 id="wallet-activity" className="cred-label">
          Recent activity
        </h2>
        {rows.length > 0 && (
          <Link
            href="/wallet/transactions"
            className="text-[12px] transition-opacity hover:opacity-100"
            style={{ color: "var(--wallet-fg-muted)" }}
          >
            See all
          </Link>
        )}
      </div>

      <div className="cred-slab overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-[14px]" style={{ color: "var(--wallet-fg)" }}>
              Nothing here yet.
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed"
              style={{ color: "var(--wallet-fg-muted)" }}
            >
              Add money and every credit and debit will appear here, itemised
              against the filing it paid for.
            </p>
            <Link
              href="/wallet/topup"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover"
            >
              Add money
            </Link>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--wallet-divider)" }}>
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/wallet/transactions/${r.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[color:var(--wallet-btn-bg)]"
                  style={{ color: "var(--wallet-fg)" }}
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full"
                    style={{
                      background: "var(--wallet-btn-bg)",
                      color: "var(--wallet-icon-fg)",
                    }}
                    aria-hidden
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {r.direction === "credit" ? (
                        <path d="M10 15.5v-11M5.5 9L10 4.5 14.5 9" />
                      ) : (
                        <path d="M10 4.5v11M5.5 11l4.5 4.5L14.5 11" />
                      )}
                    </svg>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{r.reason}</span>
                    <span
                      className="mt-0.5 block font-mono text-[11px]"
                      style={{ color: "var(--wallet-fg-muted)" }}
                    >
                      {day(r.created_at)}
                    </span>
                  </span>

                  <span
                    className="shrink-0 font-mono text-[13.5px] tabular-nums"
                    style={{
                      color:
                        r.direction === "credit"
                          ? "var(--color-success, #2f9e63)"
                          : "var(--wallet-fg)",
                    }}
                  >
                    {formatEntry(r.direction, r.amount_paise)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
