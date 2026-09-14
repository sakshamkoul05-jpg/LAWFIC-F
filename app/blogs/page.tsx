import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("Blogs");

export default function BlogsPage() {
  return <ComingSoonPage title="Blogs" />;
}
