"use client";

import { useMemo } from "react";

/**
 * DiceBear avatar via HTTP API — zero npm dependencies.
 * Uses the "lorelei" style: hand-drawn vector illustrations with fine ink lines,
 * detailed hairstyles, and expressive eyes. The same seed always produces the
 * same avatar, so it stays consistent across sessions.
 *
 * The HTTP API is free for non-commercial use. No auth required.
 */
export default function DiceBearAvatar({
  seed,
  size = 64,
  bg = "transparent",
  className = "",
}: {
  seed: string;
  size?: number;
  bg?: string;
  className?: string;
}) {
  const src = useMemo(() => {
    const url = new URL("https://api.dicebear.com/10.x/lorelei/svg");
    url.searchParams.set("seed", seed);
    url.searchParams.set("size", String(size));
    if (bg && bg !== "transparent") {
      url.searchParams.set("backgroundColor", bg);
    }
    return url.href;
  }, [seed, size, bg]);

  return (
    <img
      src={src}
      alt={`Avatar for ${seed}`}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
