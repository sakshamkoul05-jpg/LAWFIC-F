import { NextResponse } from "next/server";
import Groq from "groq-sdk";
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
 * browser talks to us, and only we talk to Groq.
 *
 * The key is read from the environment and appears nowhere in this repository.
 * A key committed to git is in every clone and in the history forever, and
 * rewriting history does not un-leak it.
 *
 * WHAT IS AND IS NOT TRUSTED
 *
 * The request body carries the conversation, which means the visitor can put
 * words in the assistant's mouth by editing the history. That is unavoidable
 * for a stateless endpoint and fine for a site FAQ — but it is exactly why the
 * rules live in the SYSTEM message, which the request cannot touch, rather
 * than in a seeded first turn, which it could rewrite.
 *
 * Message count and length are capped so a single request cannot carry a
 * novel: input is billed per token, and "send a huge body" is the cheapest way
 * to make somebody else's endpoint expensive.
 */

/* 131K context, and quick enough that the first token lands while the visitor
   is still reading their own question.

   NOT llama-3.3-70b, which Groq's own model page still lists: asking for it on
   this account returns model_not_found. The list that matters is what
   GET /openai/v1/models returns for your key, not the documentation. Override
   with GROQ_MODEL without touching this file — openai/gpt-oss-20b is the
   cheaper, faster alternative if the answers hold up.

   Its reasoning arrives on delta.reasoning, which the stream reader below
   ignores on purpose: the visitor wants the answer, not the working. */
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

/* Answers here are two or three sentences. This is a ceiling against a runaway
   generation, not a target. */
const MAX_TOKENS = 700;

/* Per visitor, per window. Generous for a real conversation, useless for a
   script. See the honesty note in lib/rate-limit.ts about what it misses. */
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
 * Built once per process and sent unchanged on every request.
 *
 * Groq has no prompt caching, so unlike the Anthropic build this is billed in
 * full each message. At roughly five thousand tokens that is
 * a fraction of a US cent per message — cheap enough not to warrant trimming
 * the catalogue the assistant is supposed to know.
 */
const SYSTEM = `${PANDA_RULES}\n\n${SITE_BRIEF}`;

let client: Groq | null = null;
function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  client ??= new Groq({ apiKey });
  return client;
}

export async function POST(request: Request) {
  const groq = getClient();
  if (!groq) {
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

  let completion: Awaited<ReturnType<typeof groq.chat.completions.create>>;
  try {
    completion = await groq.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      /* Warm enough to sound like a person, cool enough not to start
         embroidering facts about a compliance company. */
      temperature: 0.4,
      stream: true,
      messages: [{ role: "system", content: SYSTEM }, ...body.messages],
    });
  } catch (error) {
    /* Upstream refused before a byte was streamed — a bad key, a retired model
       id, or Groq rate-limiting us rather than the visitor. Still a clean
       status code at this point, so send one. */
    console.error("[panda] groq rejected the request", error);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      try {
        for await (const chunk of completion as AsyncIterable<{
          choices: { delta?: { content?: string | null } }[];
        }>) {
          const piece = chunk.choices[0]?.delta?.content;
          if (piece) {
            wrote = true;
            controller.enqueue(encoder.encode(piece));
          }
        }
      } catch (error) {
        console.error("[panda] stream failed", error);
        /* The response is already open with a 200, so this cannot become a
           status code any more. Close with a sentence rather than a truncated
           half-answer the visitor might act on. */
        controller.enqueue(
          encoder.encode(
            wrote
              ? "\n\nSorry — I lost my train of thought. Please ask again."
              : "Sorry — something went wrong on our side. Please try again.",
          ),
        );
      } finally {
        controller.close();
      }
    },
    cancel() {
      /* The visitor closed the panel or navigated away. Stop generating: an
         abandoned stream is billed exactly like one somebody read. */
      completion.controller?.abort();
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
