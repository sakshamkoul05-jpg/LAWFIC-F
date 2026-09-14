import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Social");

export default function SocialPage() {
  return <ComingSoonPage title="Social" description="Real social work, for a smiling India." />;
}
