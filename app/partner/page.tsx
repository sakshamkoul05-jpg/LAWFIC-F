import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Partner");

export default function PartnerPage() {
  return <ComingSoonPage title="Partner" />;
}
