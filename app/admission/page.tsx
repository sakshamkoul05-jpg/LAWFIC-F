import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Admission");

export default function AdmissionPage() {
  return <ComingSoonPage title="Admission" />;
}
