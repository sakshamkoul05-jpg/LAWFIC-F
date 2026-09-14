import type { Metadata } from "next";
import { PRIVATE_PAGE_ROBOTS } from "@/lib/seo";

/**
 * A layout that exists only to carry metadata.
 *
 * The page itself is `"use client"`, and a client component cannot export
 * `metadata` — so without this it would inherit the site defaults and be
 * indexed as an ordinary page. It is an internal design sign-off surface,
 * unlinked from anywhere, and the last thing it should be is a search result
 * for LAWFIC.
 */
export const metadata: Metadata = {
  title: "Note artwork",
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function DevNotesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
