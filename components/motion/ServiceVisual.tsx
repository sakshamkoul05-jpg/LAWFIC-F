"use client";

import { useObserverBroken } from "@/lib/use-in-view-safe";
import AadhaarFlip from "./AadhaarFlip";
import GstinAssembler from "./GstinAssembler";
import PanDecoder from "./PanDecoder";
import UdyamCertificate from "./UdyamCertificate";
import DocumentSpecimen from "./DocumentSpecimen";

/**
 * One signature interaction per service. Each teaches something true.
 *
 * The `key` is doing real work. Every animation below holds its content at
 * opacity 0 until an IntersectionObserver reports it in view, and each passes
 * `initial={false}` once the shared probe finds the observer inert — but
 * `initial` is only read when a motion element mounts, and the probe cannot
 * finish until ~900ms after that. Re-keying on the result remounts the subtree
 * so the content renders at its final state instead of staying invisible.
 *
 * Where the observer works — every real browser — the probe resolves the other
 * way, nothing remounts, and the animations play exactly as written.
 */
export default function ServiceVisual({ slug }: { slug: string }) {
  const degraded = useObserverBroken();

  const visual = (() => {
    switch (slug) {
      case "aadhaar":
        return <AadhaarFlip />;
      case "gst":
        return <GstinAssembler />;
      case "pan":
        return <PanDecoder />;
      case "msme-udyam":
        return <UdyamCertificate />;
      default:
        /* Everything else falls through to the generated specimen, so a
           service page is never left with an empty column. The four above
           are hand-built because they teach something a generic renderer
           cannot; the rest are data. */
        return <DocumentSpecimen slug={slug} />;
    }
  })();

  if (!visual) return null;
  return <div key={degraded ? "static" : "animated"}>{visual}</div>;
}
