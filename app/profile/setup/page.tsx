import type { Metadata } from "next";
import { Suspense } from "react";
import ProfileSetupForm from "./ProfileSetupForm";

export const metadata: Metadata = {
  title: "Complete your profile",
  description: "Tell us what you are preparing for so LAWFIC works around you.",
};

export default function ProfileSetupPage() {
  return (
    <section className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden bg-surface">
      <div className="relative z-2 mx-auto max-w-xl px-5 py-16 sm:px-8 lg:py-24">
        <p className="label text-primary text-center">Almost there</p>
        <h1 className="mt-4 text-center font-display text-[clamp(28px,4vw,40px)] leading-[1.1] text-foreground">
          Make LAWFIC yours
        </h1>
        <p className="mx-auto mt-4 max-w-md text-center text-[15px] leading-relaxed text-muted">
          Tell us what you are preparing for and the whole site re-arranges itself around your
          track — the exams, the jobs, the services that actually matter to you.
        </p>
        <Suspense
          fallback={
            <div className="mt-10 h-[520px] rounded-xl border border-border bg-surface shadow-xl" />
          }
        >
          <ProfileSetupForm />
        </Suspense>
      </div>
    </section>
  );
}