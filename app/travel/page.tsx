import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Travel");

export default function TravelPage() {
  return <ComingSoonPage title="Travel" description="Passports, visas and the paperwork a journey needs." />;
}
