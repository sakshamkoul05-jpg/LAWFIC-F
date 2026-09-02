import type { Metadata } from "next";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata: Metadata = { title: "Blogs" };

export default function BlogsPage() {
  return <ComingSoonPage title="Blogs" />;
}
