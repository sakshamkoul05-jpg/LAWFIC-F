import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Investment");

export default function InvestmentPage() {
  return <ComingSoonPage title="Investment" />;
}
