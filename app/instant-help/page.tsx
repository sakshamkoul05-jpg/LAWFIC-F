import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Instant Help");

export default function InstantHelpPage() {
  return <ComingSoonPage title="Instant Help" />;
}
