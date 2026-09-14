import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Education");

export default function EducationPage() {
  return <ComingSoonPage title="Education" />;
}
