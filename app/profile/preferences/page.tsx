import type { Metadata } from "next";
import Link from "next/link";
import PreferencesForm from "./PreferencesForm";

export const metadata: Metadata = {
  title: "Dashboard & privacy",
  description: "Choose what your home page shows and what LAWFIC uses to personalise it.",
};

export default function PreferencesPage() {
  return (
    <div className="mx-auto w-full max-w-[640px] px-5 py-12 sm:px-8">
      <Link
        href="/profile"
        className="type-label text-primary transition-colors hover:text-primary-hover"
      >
        ← Your account
      </Link>
      <h1 className="type-h1 mt-4 text-foreground">Dashboard &amp; privacy</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
        Two of the settings from your account: what the home page shows you, and
        what the site is allowed to use to arrange it.
      </p>
      <PreferencesForm />
    </div>
  );
}
