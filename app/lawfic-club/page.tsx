import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Lawfic Club");

export default function LawficClubPage() {
  return <ComingSoonPage title="Lawfic Club" description="Membership, and what comes with it." />;
}
