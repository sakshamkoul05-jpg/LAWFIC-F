import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Aakhri Umeed");

export default function AakhriUmeedPage() {
  return <ComingSoonPage title="Aakhri Umeed" description="The cases nobody else would take on." />;
}
