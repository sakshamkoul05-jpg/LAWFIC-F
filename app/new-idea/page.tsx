import { comingSoonMetadata } from "@/lib/seo";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata = comingSoonMetadata("New Idea");

export default function NewIdeaPage() {
  return <ComingSoonPage title="New Idea" />;
}
