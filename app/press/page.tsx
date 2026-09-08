import type { Metadata } from "next";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata: Metadata = { title: "Press" };

export default function PressPage() {
  return <ComingSoonPage title="Press" description="LAWFIC in the news." />;
}
