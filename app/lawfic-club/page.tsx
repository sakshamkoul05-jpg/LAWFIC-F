import type { Metadata } from "next";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata: Metadata = { title: "Lawfic Club" };

export default function LawficClubPage() {
  return <ComingSoonPage title="Lawfic Club" description="Membership, and what comes with it." />;
}
