import type { Metadata } from "next";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata: Metadata = { title: "Your Ad" };

export default function YourAdPage() {
  return <ComingSoonPage title="Your Ad" description="Advertise with LAWFIC." />;
}
