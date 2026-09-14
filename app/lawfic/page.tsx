import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("LAWFiC");

export default function LawficPage() {
  return <ComingSoonPage title="LAWFiC" />;
}
