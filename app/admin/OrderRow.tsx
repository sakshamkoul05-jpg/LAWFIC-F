"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { formatPaise } from "@/lib/money";
import { orderTotalPaise, STATUS_META, type ServiceOrder } from "@/lib/orders";
import { StatusPill } from "@/components/orders/OrderBits";
import { advanceOrder, quoteOrder, rejectOrder } from "./actions";

type Row = ServiceOrder & {
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string;
  /** Suggested list price, so the common case is one keystroke. */
  suggested_government_rupees: number;
  suggested_professional_rupees: number;
};

export default function OrderRow({ order }: { order: Row }) {
  const [open, setOpen] = useState<"quote" | "reject" | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const total = orderTotalPaise(order);

  function run(action: (fd: FormData) => Promise<{ error?: string; ok?: boolean }>, fd: FormData) {
    setError("");
    start(async () => {
      const res = await action(fd);
      if (res?.error) setError(res.error);
      else setOpen(null);
    });
  }

  return (
    <div className="bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11.5px] tracking-[0.08em] text-muted">{order.reference}</p>
          <h3 className="mt-1.5 font-display text-[19px] leading-snug text-bone">
            {order.service_name}
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {order.customer_name || "Unnamed customer"}
            {order.customer_phone ? ` · ${order.customer_phone}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {order.professional_fee_paise !== null && (
            <span className="font-mono text-[13.5px] text-bone tnum">{formatPaise(total)}</span>
          )}
          <StatusPill status={order.status} />
        </div>
      </div>

      {order.details && (
        <p className="mt-4 rounded border border-border bg-background/50 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
          {order.details}
        </p>
      )}

      {/* what can be done from here */}
      <div className="mt-5 flex flex-wrap gap-2">
        {order.status === "submitted" && (
          <Action onClick={() => setOpen(open === "quote" ? null : "quote")} primary>
            {open === "quote" ? "Cancel" : "Quote this"}
          </Action>
        )}

        {order.status === "paid" && (
          <form
            action={(fd) => {
              fd.set("orderId", order.id);
              fd.set("status", "in_progress");
              run(advanceOrder, fd);
            }}
          >
            <Action primary type="submit" disabled={pending}>
              Mark filed
            </Action>
          </form>
        )}

        {order.status === "in_progress" && (
          <form
            action={(fd) => {
              fd.set("orderId", order.id);
              fd.set("status", "completed");
              run(advanceOrder, fd);
            }}
          >
            <Action primary type="submit" disabled={pending}>
              Mark completed
            </Action>
          </form>
        )}

        {order.status !== "completed" && order.status !== "rejected" && (
          <Action onClick={() => setOpen(open === "reject" ? null : "reject")}>
            {open === "reject" ? "Cancel" : "Close & refund"}
          </Action>
        )}

        {order.status === "quoted" && (
          <span className="self-center text-[12.5px] text-muted">
            Waiting for the customer to pay.
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open === "quote" && (
          <Panel key="quote">
            <form
              action={(fd) => {
                fd.set("orderId", order.id);
                run(quoteOrder, fd);
              }}
            >
              <p className="label mb-4 text-primary">Price it</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  name="governmentRupees"
                  label="Government fee (₹)"
                  defaultValue={order.suggested_government_rupees}
                  note="What the registry charges. Enter 0 if free."
                />
                <Field
                  name="professionalRupees"
                  label="Our professional fee (₹)"
                  defaultValue={order.suggested_professional_rupees}
                  note="What LAWFIC charges for the work."
                />
              </div>

              <label className="label mt-5 block text-muted">
                Note for the customer (optional)
                <textarea
                  name="notes"
                  rows={2}
                  className="mt-2 w-full rounded border border-border-2 bg-background/60 px-3 py-2.5 font-sans text-[13.5px] normal-case tracking-normal text-bone outline-none focus:border-primary/50"
                />
              </label>

              <button
                type="submit"
                disabled={pending}
                className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {pending ? "Saving…" : "Send quote"}
              </button>
            </form>
          </Panel>
        )}

        {open === "reject" && (
          <Panel key="reject">
            <form
              action={(fd) => {
                fd.set("orderId", order.id);
                run(rejectOrder, fd);
              }}
            >
              <p className="label mb-3 text-rust">Close and refund</p>
              <p className="mb-4 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
                Anything already paid is credited straight back to the customer&apos;s wallet, in
                the same transaction as the closure. They will see this reason.
              </p>
              <textarea
                name="reason"
                rows={2}
                required
                placeholder="Address proof was not accepted by the officer"
                className="w-full rounded border border-border-2 bg-background/60 px-3 py-2.5 text-[13.5px] text-bone outline-none focus:border-primary/50 placeholder:text-muted/60"
              />
              <button
                type="submit"
                disabled={pending}
                className="mt-4 rounded-full border border-rust/50 bg-rust/10 px-6 py-2.5 text-sm text-rust transition-colors hover:bg-rust/20 disabled:opacity-60"
              >
                {pending ? "Closing…" : "Close and refund"}
              </button>
            </form>
          </Panel>
        )}
      </AnimatePresence>

      {error && <p className="mt-4 text-[13px] text-rust">{error}</p>}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="mt-5 rounded border border-border-2 bg-surface/40 p-5">{children}</div>
    </motion.div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  note,
}: {
  name: string;
  label: string;
  defaultValue: number;
  note: string;
}) {
  return (
    <label className="label block text-muted">
      {label}
      <input
        name={name}
        type="number"
        min={0}
        step={1}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded border border-border-2 bg-background/60 px-3 py-2.5 font-mono text-[15px] tracking-normal text-bone outline-none focus:border-primary/50 tnum"
      />
      <span className="mt-1.5 block text-[11.5px] normal-case tracking-normal text-muted">
        {note}
      </span>
    </label>
  );
}

function Action({
  children,
  onClick,
  primary,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-5 py-2 text-[13px] transition-colors disabled:opacity-60 ${
        primary
          ? "bg-primary text-background hover:bg-primary-hover"
          : "border border-border-2 text-muted-foreground hover:border-border-3 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}
