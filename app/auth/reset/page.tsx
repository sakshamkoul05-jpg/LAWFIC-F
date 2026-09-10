import type { Metadata } from "next";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your LAWFIC account.",
  /* A recovery URL has no business in a search index, and a crawler following
     one would burn the single use the link gets. */
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return <ResetForm />;
}
