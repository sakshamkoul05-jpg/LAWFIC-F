import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * IMAGE OPTIMISATION IS OFF, AND THAT IS NOT A PREFERENCE.
     *
     * Every /_next/image request on this account returns
     * 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED — the Vercel plan's image
     * optimisation quota is spent. The optimiser does not degrade when that
     * happens; it refuses, and next/image renders nothing. Measured on the
     * live site: all eleven homepage banners blank, plus the logo and the
     * panda.
     *
     * With this on, next/image emits a plain <img> pointing at the file in
     * /public, which serves normally. An unoptimised image that renders beats
     * an optimised one that 402s.
     *
     * WHAT IT COSTS, AND WHY IT IS COVERED
     *
     * No automatic resizing and no WebP conversion, so every file is now
     * shipped exactly as it sits in /public. The banners are therefore written
     * as WebP by scripts/make-banners.mjs rather than PNG — 18-23KB each
     * instead of 130-190KB. Anything added to /public from here should be
     * sized and compressed before it is committed, because nothing downstream
     * will do it.
     *
     * TO TURN IT BACK ON: raise the quota or the plan, then delete this block.
     * Nothing else in the codebase depends on it being off.
     */
    unoptimized: true,
  },
};

export default nextConfig;
