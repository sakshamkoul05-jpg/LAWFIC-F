import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Your Ad");

export default function YourAdPage() {
  return <ComingSoonPage title="Your Ad" description="Advertise with LAWFIC." />;
}
