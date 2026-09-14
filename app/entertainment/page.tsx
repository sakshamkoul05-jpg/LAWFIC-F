import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Entertainment");

export default function EntertainmentPage() {
  return <ComingSoonPage title="Entertainment" />;
}
