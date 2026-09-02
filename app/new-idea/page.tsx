import type { Metadata } from "next";
import ComingSoonPage from "@/components/classic/ComingSoonPage";

export const metadata: Metadata = { title: "New Idea" };

export default function NewIdeaPage() {
  return <ComingSoonPage title="New Idea" />;
}
