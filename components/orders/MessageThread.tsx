"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { postMessage } from "@/app/orders/message-actions";
import { isSendable, messageTime, MESSAGE_MAX, type OrderMessage } from "@/lib/messages";

/**
 * The thread on a filing, as both sides see it.
 *
 * `mine` is whether the VIEWER wrote a message, computed from the viewer's
 * side rather than from authorship: staff reading a thread should see LAWFIC's
 * replies as theirs even when a colleague wrote them, because the customer is
 * not talking to an individual, they are talking to LAWFIC. Keying it on
 * author_id instead would put an agent's own replies on one side and their
 * colleague's on the other, in the same conversation.
 *
 * Sending is optimistic. A message that vanishes for the second it takes a
 * round trip reads as failure, and people re-send — so it appears immediately,
 * marked pending, and is reconciled when the server list comes back. If it
 * fails, the text goes back in the box rather than being lost, because losing
 * what someone wrote is the one unforgivable thing a message box can do.
 */

export default function MessageThread({
  orderId,
  messages,
  viewerIsStaff,
  className = "",
}: {
  orderId: string;
  messages: OrderMessage[];
  /** Which side of the thread the viewer is on. */
  viewerIsStaff: boolean;
  className?: string;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  /* Newest message in view when the thread grows, but never yanking the page
     on first paint — someone arriving at a filing is reading the filing. */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length, pending.length]);

  /* Server messages have arrived, so anything we were holding is now in the
     list above and the placeholder should go. */
  useEffect(() => setPending([]), [messages.length]);

  const send = () => {
    const text = body.trim();
    if (!isSendable(text) || isSending) return;

    setError(null);
    setBody("");
    setPending((p) => [...p, text]);

    const data = new FormData();
    data.set("orderId", orderId);
    data.set("body", text);

    startTransition(async () => {
      const result = await postMessage(data);
      if (!result.ok) {
        setPending((p) => p.filter((t) => t !== text));
        /* Give it back rather than lose it. */
        setBody((current) => (current ? current : text));
        setError(result.error);
      }
    });
  };

  const empty = messages.length === 0 && pending.length === 0;

  return (
    <section className={`wallet-glass overflow-hidden rounded-2xl ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Messages
        </h2>
        <span className="text-[11px] text-subtle">
          {viewerIsStaff ? "The customer sees these" : "LAWFIC sees these"}
        </span>
      </div>

      <div className="max-h-[26rem] overflow-y-auto px-5 py-4">
        {empty ? (
          <p className="py-6 text-center text-[13px] leading-relaxed text-muted-foreground">
            {viewerIsStaff
              ? "Nothing said yet. Anything written here reaches the customer on their filing."
              : "No messages yet. Ask anything about this filing and it lands with the team handling it."}
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const mine = m.from_staff === viewerIsStaff;
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div
                      className="rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                      style={
                        mine
                          ? { background: "var(--wallet-btn-bg)", color: "var(--wallet-fg)" }
                          : { background: "var(--surface-2)", color: "var(--wallet-fg)" }
                      }
                    >
                      {m.body}
                    </div>
                    <p
                      className={`mt-1 text-[10.5px] text-subtle ${mine ? "text-right" : ""}`}
                    >
                      {mine ? "You" : m.from_staff ? "LAWFIC" : "Customer"} · {messageTime(m.created_at)}
                    </p>
                  </div>
                </li>
              );
            })}

            {pending.map((text, i) => (
              <li key={`pending-${i}`} className="flex justify-end">
                <div className="max-w-[85%] opacity-55">
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                    style={{ background: "var(--wallet-btn-bg)", color: "var(--wallet-fg)" }}
                  >
                    {text}
                  </div>
                  <p className="mt-1 text-right text-[10.5px] text-subtle">Sending…</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border px-5 py-3.5">
        {error && (
          <p role="alert" className="mb-2 text-[12px] text-[#ff6b6b]">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MESSAGE_MAX))}
            onKeyDown={(e) => {
              /* Enter sends, Shift+Enter breaks the line. A filing question is
                 usually one sentence, and reaching for a button every time is
                 friction on the common case. */
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={
              viewerIsStaff ? "Reply to the customer…" : "Ask about this filing…"
            }
            aria-label="Your message"
            className="min-h-[44px] flex-1 resize-y rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-[13.5px] text-foreground outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={send}
            disabled={!isSendable(body) || isSending}
            className="rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-background transition-opacity disabled:opacity-40"
          >
            {isSending ? "Sending" : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
}
