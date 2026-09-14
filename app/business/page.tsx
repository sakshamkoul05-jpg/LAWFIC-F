import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Business");

export default function BusinessPage() {
  return <ComingSoonPage title="Business" />;
}
