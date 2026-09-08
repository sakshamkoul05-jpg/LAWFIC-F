import type { Metadata } from "next";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata: Metadata = { title: "Travel" };

export default function TravelPage() {
  return <ComingSoonPage title="Travel" description="Passports, visas and the paperwork a journey needs." />;
}
