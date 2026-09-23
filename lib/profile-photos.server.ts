import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SIGNED_URL_TTL_SECONDS } from "./profile-photos";

/**
 * Turning stored paths into URLs a browser can load.
 *
 * Separate from lib/profile-photos.ts because that file is imported by the
 * studio, which runs in the browser. Anything reaching for a Supabase client
 * belongs on this side of the line, and `server-only` makes the mistake a build
 * error rather than a bundle that quietly grew.
 */

export type ProfilePhotos = {
  avatarUrl: string | null;
  coverUrl: string | null;
  avatarPath: string;
  coverPath: string;
};

const EMPTY: ProfilePhotos = {
  avatarUrl: null,
  coverUrl: null,
  avatarPath: "",
  coverPath: "",
};

/**
 * Both photographs for one customer, signed and ready to render.
 *
 * Tolerant by design. A project that has not run the migration yet returns a
 * row without these columns, and a page whose header throws because somebody
 * has no profile picture is a worse outcome than a header with no picture in
 * it. Every failure lands on the same answer: no photo.
 *
 * One round trip for the row, then both URLs signed in parallel.
 */
export async function getProfilePhotos(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfilePhotos> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("avatar_path, cover_path")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return EMPTY;

  const row = data as { avatar_path?: unknown; cover_path?: unknown };
  const avatarPath = typeof row.avatar_path === "string" ? row.avatar_path : "";
  const coverPath = typeof row.cover_path === "string" ? row.cover_path : "";

  const [avatarUrl, coverUrl] = await Promise.all([
    sign(supabase, avatarPath),
    sign(supabase, coverPath),
  ]);

  return { avatarUrl, coverUrl, avatarPath, coverPath };
}

async function sign(supabase: SupabaseClient, path: string): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}
