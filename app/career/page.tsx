import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Career");

export default function CareerPage() {
  return <ComingSoonPage title="Career" />;
}
