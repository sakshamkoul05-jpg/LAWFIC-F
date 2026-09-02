import type { Metadata } from "next";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata: Metadata = { title: "Instant Help" };

export default function InstantHelpPage() {
  return <ComingSoonPage title="Instant Help" />;
}
