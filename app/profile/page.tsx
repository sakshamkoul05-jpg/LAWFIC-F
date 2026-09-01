import type { Metadata } from "next";
import { Suspense } from "react";
import EditProfileForm from "./EditProfileForm";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your name, your track, your resume — everything LAWFIC uses to personalise the site.",
};

export default function ProfilePage() {
  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-surface">
      <div className="relative z-2 mx-auto max-w-xl px-5 py-16 sm:px-8 lg:py-22">
        <p className="label text-primary">Your account</p>
        <h1 className="mt-4 font-display text-[clamp(28px,4vw,40px)] leading-[1.1] text-foreground">
          Your profile
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          This is what drives your personalised home, the jobs feed and your wallet identity.
          Change it any time.
        </p>
        <Suspense
          fallback={
            <div className="mt-10 h-[560px] rounded-xl border border-border bg-surface shadow-xl" />
          }
        >
          <EditProfileForm />
        </Suspense>
      </div>
    </section>
  );
}