import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Branding");

export default function BrandingPage() {
  return <ComingSoonPage title="Branding" />;
}
