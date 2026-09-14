import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/**
 * The web app manifest.
 *
 * WHY A COMPLIANCE SITE HAS ONE
 *
 * Not to be an app. It is what a phone reads when somebody adds the site to a
 * home screen, and it is one of the sources Google uses for the icon and short
 * name beside a result on mobile. Without it, "add to home screen" produces a
 * screenshot of the page as the icon and the full `<title>` as the label.
 *
 * `display: "browser"` is deliberate. `standalone` would strip the address bar
 * from a site that handles money, identity documents and sign-in — and the
 * address bar is where somebody checks they are on lawfic.pro and not on
 * something that looks like it. Taking that away from a compliance product to
 * gain a slightly more app-like frame is a bad trade.
 *
 * The icons are the same files Next serves from app/icon.png and
 * app/apple-icon.png, referenced by their public paths.
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    /* What fits under a home screen icon. The full name is already short, but
       `short_name` is the one that is guaranteed not to be truncated. */
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "browser",
    background_color: "#FAF8F4", // --bg, so the splash matches the page
    theme_color: "#1A1712", // --fg, the ground the mark sits on
    lang: "en-IN",
    dir: "ltr",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        /* "any" and not "maskable": the mark is already inset on its own
           rounded ground, and declaring it maskable would let Android crop
           that ground away and cut into the mark. */
        purpose: "any",
      },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
