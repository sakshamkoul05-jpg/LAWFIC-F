/**
 * Profile and cover photographs: the rules both ends agree on.
 *
 * The browser crops, resizes and re-encodes before it uploads, and the server
 * checks what actually arrived. Both read this file, so the two cannot drift
 * into disagreeing about what an acceptable picture is.
 */

export type PhotoKind = "avatar" | "cover";

export const PHOTO_KINDS: PhotoKind[] = ["avatar", "cover"];

export function isPhotoKind(v: unknown): v is PhotoKind {
  return v === "avatar" || v === "cover";
}

/**
 * Output geometry.
 *
 * The avatar is square and 512px — twice the largest size it is ever drawn at,
 * so it stays sharp on a 2x screen and no larger. The cover is 3:1 at 1600px
 * wide for the same reason. Storing the original instead would mean holding a
 * 12-megapixel phone photograph to render a 96px circle.
 */
export const PHOTO_SPEC: Record<PhotoKind, { w: number; h: number; label: string }> = {
  avatar: { w: 512, h: 512, label: "Profile picture" },
  cover: { w: 1600, h: 533, label: "Cover picture" },
};

/** What a file input will offer. SVG is deliberately absent — see below. */
export const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * What the server will store.
 *
 * SVG IS NOT ON THIS LIST AND MUST NOT BE ADDED
 *
 * An SVG is a document, not a picture: it can carry <script>, and a browser
 * asked to render one from our own origin will run it. An image format that
 * executes is a stored cross-site-scripting hole wearing a photograph's
 * clothes. Raster only.
 *
 * HEIC is accepted by the file input because that is what an iPhone hands over,
 * but it never reaches the server as HEIC — the browser decodes it into a
 * canvas and uploads WebP. It is not on this list for that reason.
 */
export const STORED_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
export type StoredType = (typeof STORED_TYPES)[number];

/** 3 MB, matching the bucket's own ceiling. */
export const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Does this actually look like the image it claims to be?
 *
 * A Content-Type header is whatever the client decided to send. These are the
 * first bytes of the file itself, which the client would have to work much
 * harder to fake — and if it does fake them convincingly enough to pass, what
 * it has produced is a valid image. Checked before anything is written.
 */
export function sniffImageType(bytes: Uint8Array): StoredType | null {
  if (bytes.length < 12) return null;

  /* WebP: "RIFF" .... "WEBP" */
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  /* JPEG: FF D8 FF */
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  /* PNG: 89 50 4E 47 0D 0A 1A 0A */
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  return null;
}

const EXT: Record<StoredType, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/**
 * Where a photograph is stored.
 *
 * The filename carries a timestamp rather than being fixed at `avatar.webp`,
 * because a fixed name is cached — by the CDN, by the browser, by whatever sits
 * in between — and a customer who has just changed their picture and still sees
 * the old one concludes the upload failed and does it again. A new path each
 * time means the new URL is new. The old object is deleted after the row is
 * updated, so a failure between the two leaves a stray file rather than a
 * profile pointing at nothing.
 */
export function photoPath(userId: string, kind: PhotoKind, type: StoredType): string {
  return `${userId}/${kind}-${Date.now()}.${EXT[type]}`;
}

/** How long a signed URL lives. Long enough for a page and a reload, no longer. */
export const SIGNED_URL_TTL_SECONDS = 60 * 10;
