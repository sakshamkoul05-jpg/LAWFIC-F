import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { PANDA_RULES, SITE_BRIEF } from "@/lib/panda-knowledge";
import { clientKey, takeToken } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Panda AI — the assistant behind the Quick Actions widget.
 *
 * WHY A SERVER ROUTE AND NOT A BROWSER CALL
 *
 * The API key is the whole reason. A key shipped to the browser is a key
 * published to everyone who opens devtools, and it is not scoped — whoever has
 * it can spend against this account on anything, not just this chatbot. So the
 * browser talks to us, and only we talk to Anthropic.
 *
 * WHAT IS AND IS NOT TRUSTED
 *
 * The request body carries the conversation, which means the visitor can put
 * words in the assistant's mouth by editing the history. That is fine for a
 * site FAQ bot and unavoidable for a stateless endpoint — but it is exactly why
 * the rules live in the SYSTEM prompt, which the request cannot touch, rather
 * than in a seeded first message, which it could rewrite.
 *
 * Message count and length are capped so a single request cannot carry a
 * novel: input is billed per token, and "send a huge body" is the cheapest way
 * to make somebody else's endpoint expensive.
 */

const MODEL = "claude-opus-5";

/* Answers here are two or three sentences. This is a ceiling against a runaway
   generation, not a target — and with adaptive thinking on, it has to leave
   room for the thinking tokens as well as the reply. */
const MAX_TOKENS = 2048;

/* Per visitor, per window. Generous for a real conversation, useless for a
   script. See the honesty note in lib/rate-limit.ts about what this does not
   cover. */
const RATE_LIMIT = 15;
const RATE_WINDOW_SECONDS = 300;

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(16),
});

/**
 * Built once per process. The system prompt is byte-identical on every request
 * of a deployment, which is the precondition for the cache read below — a
 * timestamp or a per-request id anywhere in here would silently cost full
 * price on every message.
 */
const SYSTEM: Anthropic.TextBlockParam[] = [
  { type: "text", text: PANDA_RULES },
  {
    type: "text",
    text: SITE_BRIEF,
    /* The brief is the large, unchanging part. Caching it means the site
       catalogue is billed once per five minutes instead of once per message. */
    cache_control: { type: "ephemeral" },
  },
];

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

export async function POST(request: Request) {
  const anthropic = getClient();
  if (!anthropic) {
    /* Deliberately explicit: a chat box that fails silently looks broken, and
       the person who can fix this is the operator, not the visitor. */
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const verdict = takeToken({
    key: clientKey(request),
    limit: RATE_LIMIT,
    windowSeconds: RATE_WINDOW_SECONDS,
  });
  if (!verdict.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": String(verdict.retryAfterSeconds) } },
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  /* The API requires the conversation to open with a user turn. A history that
     starts with an assistant greeting rendered in the UI would 400 here, so the
     greeting is never sent — it lives only in the panel. */
  if (body.messages[0].role !== "user") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM,
    /* Low effort is the right setting for this workload, not a cost dodge: it
       is a site FAQ that wants a fast two-sentence answer, and higher effort
       buys thoroughness nobody asked for while the visitor watches a spinner.
       Thinking stays ON (adaptive) — disabling it on this model risks tool-call
       and tag leakage into the visible reply. */
    output_config: { effort: "low" },
    messages: body.messages,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();

        /* A refusal arrives as a 200 with no text, which would leave the bubble
           blank and looking broken. Say something true instead. */
        if (final.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode(
              "I am not able to help with that one. If it is about your LAWFIC " +
                "file, our team can — try /contact.",
            ),
          );
        }
      } catch (error) {
        console.error("[panda] stream failed", error);
        /* The connection is already open with a 200, so an error cannot become
           a status code any more. Close with a sentence rather than a truncated
           half-answer the visitor might act on. */
        controller.enqueue(
          encoder.encode("\n\nSorry — something went wrong on our side. Please try again."),
        );
      } finally {
        controller.close();
      }
    },
    cancel() {
      /* The visitor closed the panel or navigated away. Stop generating: an
         abandoned stream is billed exactly like a read one. */
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      /* Tells nginx-style proxies not to buffer, which would otherwise hold the
         whole reply and deliver it in one lump — the opposite of streaming. */
      "x-accel-buffering": "no",
    },
  });
}
