"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MESSAGE_MAX } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

/**
 * Sending and reading messages on a filing.
 *
 * Shared by both sides on purpose. Whether a message is FROM staff is decided
 * in the database from `is_staff()`, never from anything sent here, so one
 * action serves the customer and the back office without either being able to
 * claim the other's voice. A separate staff-only action would have to be
 * trusted to set that flag honestly, and there is no reason to create something
 * that needs trusting.
 */

const Post = z.object({
  orderId: z.string().uuid(),
  body: z.string().trim().min(1).max(MESSAGE_MAX),
});

export type MessageResult = { ok: true } | { ok: false; error: string };

export async function postMessage(formData: FormData): Promise<MessageResult> {
  const parsed = Post.safeParse({
    orderId: formData.get("orderId"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: "That message cannot be sent as written." };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Not connected." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "Sign in to send a message." };

  const { error } = await supabase.rpc("post_order_message", {
    p_order_id: parsed.data.orderId,
    p_body: parsed.data.body,
  });

  if (error) {
    /* 42501 is the definer refusing: not signed in, or not your order. Anything
       else is genuinely unexpected and should not be dressed up as a
       permissions problem. */
    console.error("[messages] post failed", error);
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "You cannot post on this filing."
          : "That did not send. Try again in a moment.",
    };
  }

  /* Both views of the same thread. Revalidating only the one the sender is
     looking at leaves the other showing a thread that is missing a message. */
  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/customers", "layout");
  return { ok: true };
}

/**
 * Mark the other side's messages read.
 *
 * Failure is swallowed. A read receipt that does not land is not worth an error
 * in front of someone who is only trying to read their messages, and the
 * function is idempotent, so the next visit fixes it.
 */
export async function markRead(orderId: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  try {
    await supabase.rpc("mark_order_messages_read", { p_order_id: orderId });
  } catch {
    /* The builder is a thenable, not a promise, so it has no .catch — and a
       read receipt is not worth an error in front of someone who is only
       trying to read their messages. The function is idempotent, so the next
       visit fixes it. */
  }
}
