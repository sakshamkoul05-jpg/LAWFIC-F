"use client";

/**
 * The note family, at full size, for design sign-off.
 *
 * Unlinked and deliberately plain. It exists because the notes cannot be judged
 * where they are actually used: in the card holder only the top third of a note
 * clears the pocket, so the engraving, the medallion and the whole lower half
 * are never visible there. Delete the route once the artwork is signed off, or
 * keep it — it costs one client component and no bundle anyone else loads.
 */

import { useEffect, useRef } from "react";
import { DENOMINATIONS, noteTexture, NOTE_ASPECT } from "@/lib/wallet3d/banknote";

function Face({ value, face }: { value: number; face: "front" | "back" }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const design = DENOMINATIONS.find((d) => d.value === value);
    if (!design) return;
    /* The texture's own canvas is the artwork. Mounting it directly shows
       exactly what gets mapped onto the note in the wallet — a re-draw here
       could differ from the real one and hide the very thing being checked. */
    const src = noteTexture(design, face).image as HTMLCanvasElement;
    src.style.width = "100%";
    src.style.height = "auto";
    src.style.display = "block";
    const el = host.current!;
    el.replaceChildren(src);
  }, [value, face]);

  return <div ref={host} style={{ aspectRatio: String(NOTE_ASPECT) }} />;
}

export default function NoteReview() {
  return (
    <main
      style={{
        background: "#eceae5",
        padding: "32px 24px 64px",
        display: "grid",
        gap: 40,
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      <header>
        <h1 style={{ font: "600 15px ui-monospace, monospace", letterSpacing: "0.24em", margin: 0 }}>
          LAWFIC CREDITS — NOTE FAMILY
        </h1>
        <p style={{ font: "400 13px system-ui", opacity: 0.6, margin: "8px 0 0" }}>
          Six denominations on one layout. Front and back, at drawing size.
        </p>
      </header>

      {DENOMINATIONS.map((d) => (
        <section key={d.value} style={{ display: "grid", gap: 10 }}>
          <p style={{ font: "600 11px ui-monospace, monospace", letterSpacing: "0.22em", opacity: 0.55 }}>
            {d.value} · SERIAL {d.serial}
          </p>
          <Face value={d.value} face="front" />
          <Face value={d.value} face="back" />
        </section>
      ))}
    </main>
  );
}
