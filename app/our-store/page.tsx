import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Our Store");

export default function OurStorePage() {
  return <ComingSoonPage title="Our Store" />;
}
