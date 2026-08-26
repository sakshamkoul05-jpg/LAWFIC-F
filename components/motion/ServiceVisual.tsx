"use client";

import AadhaarFlip from "./AadhaarFlip";
import GstinAssembler from "./GstinAssembler";
import PanDecoder from "./PanDecoder";
import UdyamCertificate from "./UdyamCertificate";

/** One signature interaction per service. Each teaches something true. */
export default function ServiceVisual({ slug }: { slug: string }) {
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
      return null;
  }
}
