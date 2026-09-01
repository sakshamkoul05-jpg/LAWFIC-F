import type { Metadata } from "next";
import { Suspense } from "react";
import EditProfileForm from "./EditProfileForm";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your name, your track, your resume — everything LAWFIC uses to personalise the site.",
};

export default function ProfilePage() {
  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%_50%,rgba(201,168,76,0.04),transparent)]" />
      <div className="relative z-2 mx-auto max-w-xl px-5 py-16 sm:px-8 lg:py-22">
        <p className="type-label text-primary">Your account</p>
        <h1 className="type-h1 mt-4 text-foreground">
          Your profile
        </h1>
        <p className="type-body mx-auto mt-4 max-w-md text-muted">
          This is what drives your personalised home, the jobs feed and your wallet identity.
          Change it any time.
        </p>
        <Suspense
          fallback={
            <div className="mt-10 h-[560px] border border-border bg-surface" />
          }
        >
          <EditProfileForm />
        </Suspense>
      </div>
    </section>
  );
}
