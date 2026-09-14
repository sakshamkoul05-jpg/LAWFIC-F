import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Gift");

export default function GiftPage() {
  return <ComingSoonPage title="Gift" />;
}
