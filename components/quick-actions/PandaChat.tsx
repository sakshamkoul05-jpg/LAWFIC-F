"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw } from "lucide-react";
import { palette } from "./quickActionsConfig";

/**
 * Panda AI, inside the Quick Actions panel.
 *
 * WHY THE GREETING IS NOT A MESSAGE
 *
 * The opening line is rendered, never stored. The Messages API requires the
 * conversation to begin with a user turn, and an assistant greeting in
 * `messages[0]` is both a 400 and a lie about what was said. So `messages`
 * holds only the real exchange and the greeting lives in the markup.
 *
 * STREAMING WITHOUT A FRAMEWORK
 *
 * The route answers with plain text, chunk by chunk, so this reads the body
 * with a TextDecoder and appends. No SSE parsing, no protocol, no dependency —
 * the whole client is a while loop over reader.read().
 *
 * ABORTING MATTERS
 *
 * Closing the panel or sending again cancels the in-flight request. An
 * abandoned stream is billed exactly like one somebody read, and a late chunk
 * arriving after the visitor moved on writes into the wrong bubble.
 */

type Turn = { role: "user" | "assistant"; content: string };

/* Kept in step with the cap in app/api/panda/route.ts, which rejects anything
   longer. Trimming here means the visitor finds out while typing rather than
   after pressing send. */
const MAX_CHARS = 2000;
const MAX_TURNS = 16;

export default function PandaChat({ onBack }: { onBack: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Cancel whatever is in flight when the chat goes away. */
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  /* Follow the answer as it streams. `behavior: auto` on purpose — smooth
     scrolling fights with text arriving every few milliseconds. */
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [turns, busy]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const history = [...turns, { role: "user" as const, content: text }].slice(-MAX_TURNS);

    setTurns([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/panda", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const reason = await response
          .json()
          .then((j: { error?: string }) => j.error)
          .catch(() => null);
        setTurns(history);
        setError(
          reason === "not_configured"
            ? "Panda AI is not switched on yet. Our team can still help — try Call to us or E-mail to us."
            : reason === "rate_limited"
              ? "That is a lot of questions in a short time. Give it a few minutes and I will be right here."
              : "I could not reach my brain just then. Please try again.",
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        /* Rewrite the last turn rather than appending a new one, so React
           reconciles one bubble instead of creating one per chunk. */
        setTurns([...history, { role: "assistant", content: answer }]);
      }

      if (!answer.trim()) {
        setTurns(history);
        setError("I did not manage an answer there. Try asking it a different way?");
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setTurns(history);
      setError("I could not reach my brain just then. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [draft, busy, turns]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
    setError(null);
    setBusy(false);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Transcript ─────────────────────────────────────────────────── */}
      <div
        ref={listRef}
        className="qa-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-3 py-3"
        aria-live="polite"
        aria-atomic="false"
      >
        <Bubble role="assistant">
          Hello! I am Panda AI. Ask me about LAWFIC&rsquo;s services, where to
          find something on the site, or anything else you are wondering about.
        </Bubble>

        {turns.map((turn, index) => (
          <Bubble key={index} role={turn.role}>
            {turn.content ||
              (busy && index === turns.length - 1 ? <Thinking /> : null)}
          </Bubble>
        ))}

        {error && (
          <p
            role="status"
            className="rounded-xl px-3 py-2 text-[12px] leading-snug"
            style={{ background: "rgba(230,195,107,0.10)", color: palette.gold }}
          >
            {error}
          </p>
        )}
      </div>

      {/* ── Composer ───────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-3 pb-3 pt-2"
        style={{ borderTop: `1px solid ${palette.edge}` }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${palette.edge}`,
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MAX_CHARS}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              /* Enter sends, Shift+Enter makes a new line — the convention
                 everywhere else, and the reason rows stays at 1. */
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="Ask Panda AI anything…"
            aria-label="Message Panda AI"
            className="max-h-24 min-h-[22px] flex-1 resize-none bg-transparent text-[13.5px] leading-snug outline-none placeholder:opacity-45"
            style={{ color: palette.ink }}
          />

          {turns.length > 0 && (
            <button
              type="button"
              onClick={reset}
              aria-label="Start a new chat"
              className="qa-back grid h-8 w-8 shrink-0 place-items-center rounded-full outline-none transition-colors"
              style={{ color: palette.inkDim }}
            >
              <RotateCcw size={15} strokeWidth={2} />
            </button>
          )}

          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || busy}
            aria-label="Send"
            className="qa-send grid h-8 w-8 shrink-0 place-items-center rounded-full outline-none transition-opacity"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Not boilerplate. LAWFIC sells regulated professional work, and a
            visitor who mistakes this for advice has been misled by us. */}
        <p
          className="mt-2 text-center text-[10.5px] leading-snug"
          style={{ color: palette.inkDim, opacity: 0.6 }}
        >
          Panda AI can be wrong and does not give legal, tax or financial
          advice.{" "}
          <button
            type="button"
            onClick={onBack}
            className="underline underline-offset-2"
            style={{ color: palette.gold }}
          >
            Book a consultation
          </button>{" "}
          for anything that matters.
        </p>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: Turn["role"]; children: React.ReactNode }) {
  if (children === null) return null;
  const mine = role === "user";
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed"
        style={
          mine
            ? { background: palette.gold, color: "var(--band, #0B1D4A)" }
            : {
                background: "rgba(255,255,255,0.06)",
                color: palette.ink,
                border: `1px solid ${palette.edge}`,
              }
        }
      >
        {children}
      </div>
    </div>
  );
}

/** Three dots while the first token is still on its way. */
function Thinking() {
  return (
    <span className="qa-typing inline-flex items-center gap-1" aria-label="Panda AI is typing">
      <i />
      <i />
      <i />
    </span>
  );
}
