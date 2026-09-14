import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Press");

export default function PressPage() {
  return <ComingSoonPage title="Press" description="LAWFIC in the news." />;
}
