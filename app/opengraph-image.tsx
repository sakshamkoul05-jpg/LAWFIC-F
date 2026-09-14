import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_NAME } from "@/lib/seo";

/**
 * The card WhatsApp, LinkedIn, Slack and X draw when somebody pastes a link.
 *
 * WHY IT IS DRAWN AND NOT A PNG IN /public
 *
 * Because it is built from the same tokens as the site — the ink, the paper,
 * the gold — and a hand-exported PNG is a copy of the design that stops
 * tracking it the day it is exported. This renders at build time (the route is
 * static, so it is baked into the output and costs nothing per request) and
 * changes when the brand does.
 *
 * WHAT IT SAYS
 *
 * The mark, the name, and one line about what LAWFIC does. Nothing else. A
 * share card is seen at about the size of a playing card in a chat thread, and
 * every extra line is one more thing that is unreadable there. No phone
 * number, no URL — the platform already shows the domain underneath.
 *
 * SIZE
 *
 * 1200×630 is the size every one of those platforms crops to. Anything else
 * gets centre-cropped by each of them differently.
 */

export const alt = `${SITE_NAME} — registrations, licences and compliance`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#1A1712";
const GOLD = "#E8B90C";
const PAPER = "#FAF8F4";

export default async function Image() {
  /* The mark, inlined. ImageResponse cannot fetch a relative URL — it has no
     origin to resolve one against — so the bytes are read off disk and handed
     over as a data URI. */
  const mark = await readFile(join(process.cwd(), "public", "lawfic-mark.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: INK,
          padding: "0 96px",
          position: "relative",
        }}
      >
        {/* A single hairline of gold along the top, the way the site uses it:
            as an accent on a dark ground, never as a fill. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: GOLD,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={128} height={200} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 92,
                fontWeight: 700,
                color: PAPER,
                letterSpacing: "0.06em",
                lineHeight: 1,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                marginTop: 20,
                /* Big enough to still be a sentence when WhatsApp draws this
                   card 300px wide in a chat thread. Below about 34 here it
                   becomes a grey smudge under the name at that size. */
                fontSize: 36,
                color: GOLD,
                letterSpacing: "0.01em",
              }}
            >
              Registrations, licences and compliance
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 50,
            fontSize: 26,
            lineHeight: 1.45,
            color: "#A39A88",
            maxWidth: 880,
          }}
        >
          Udyam, GST, PAN and FSSAI — filed end to end for Indian businesses,
          with government fees shown separately from ours.
        </div>
      </div>
    ),
    size,
  );
}
