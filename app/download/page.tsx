import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ANDROID_RELEASE, WEB_APP_URL } from "@/lib/app-release";

export const metadata: Metadata = {
  title: "Download the LAWFIC app",
  description: "Get the LAWFIC app for Android — your filings, documents and wallet in your pocket. iPhone customers can use the LAWFIC web app.",
  alternates: { canonical: "/download" },
};

/**
 * /download — where every "download the app" link and QR code on the site
 * lands.
 *
 * Android gets the APK straight from here. Because it is installed outside
 * the Play Store, Android asks the customer to allow installs from their
 * browser once; the steps say exactly that, and the page is explicit that
 * lawfic.pro is the only place the real app comes from — a sideloaded app is
 * the easiest thing in the world to impersonate.
 *
 * iPhone has no equivalent of an APK, so until the App Store listing exists
 * the iPhone answer is the web app, added to the home screen.
 */
export default function DownloadPage() {
  const r = ANDROID_RELEASE;

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 lg:py-20">
      <div className="text-center">
        <Image src="/lawfic-logo.png" alt="LAWFIC" width={88} height={88} className="mx-auto h-[72px] w-[72px] object-contain" />
        <p className="type-label mt-5 text-primary">The LAWFIC app</p>
        <h1 className="home-serif mt-3 text-[clamp(30px,4vw,48px)] font-bold leading-tight text-foreground">
          Your legal wallet, in your pocket
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Filings, documents and your LAWFIC wallet — the same account as lawfic.pro, with Panda AI and live updates on every filing.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-[1.25fr_1fr]">
        {/* ── Android ─────────────────────────────────────────── */}
        <section aria-labelledby="android-heading" className="rounded-3xl border border-[#C6A15B]/50 bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <AndroidMark />
            <h2 id="android-heading" className="text-[20px] font-semibold text-foreground">
              Android
            </h2>
            <span className="ml-auto rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">Version {r.version}</span>
          </div>

          {r.ready ? (
            <>
              <a
                href="/download/android"
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#E8CC7C] to-[#C6A15B] px-6 py-3.5 text-[16px] font-semibold text-[#17120A] shadow-[0_14px_30px_-14px_rgba(198,161,91,0.8)] transition hover:brightness-105"
              >
                <DownloadIcon /> Download for Android{r.size ? ` · ${r.size}` : ""}
              </a>
              <p className="mt-2 text-center text-[11.5px] text-muted-foreground">lawfic.apk · Android 7.0 and newer</p>
            </>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-border px-4 py-4 text-center text-[14px] text-muted-foreground">
              The Android download is being prepared and will appear here shortly. Meanwhile, the{" "}
              <a href={WEB_APP_URL} className="font-medium text-primary hover:underline">
                LAWFIC web app
              </a>{" "}
              works on any phone.
            </p>
          )}

          <ol className="mt-7 space-y-3 text-[14px] leading-relaxed text-foreground/90">
            <Step n={1}>Tap <b>Download for Android</b> and open the file when it finishes.</Step>
            <Step n={2}>
              If Android asks, allow your browser to <b>install unknown apps</b>. This is asked once, because the app comes from lawfic.pro rather than the Play Store.
            </Step>
            <Step n={3}>Tap <b>Install</b>, open LAWFIC, and sign in with your lawfic.pro account — or create one.</Step>
          </ol>

          <p className="mt-6 rounded-2xl bg-surface-2 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
            <b className="text-foreground">Download only from lawfic.pro.</b> LAWFIC never sends the app on WhatsApp, SMS or email, and never asks for your OTP or password.
            {r.sha256 && (
              <>
                {" "}
                SHA-256: <code className="break-all font-mono text-[11px] text-foreground/80">{r.sha256}</code>
              </>
            )}
          </p>
        </section>

        {/* ── iPhone and QR ───────────────────────────────────── */}
        <div className="grid gap-5">
          <section aria-labelledby="iphone-heading" className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <AppleMark />
              <h2 id="iphone-heading" className="text-[20px] font-semibold text-foreground">
                iPhone
              </h2>
              <span className="ml-auto rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">App Store soon</span>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              Open the LAWFIC web app in Safari, tap <b className="text-foreground">Share</b>, then <b className="text-foreground">Add to Home Screen</b>. It opens like an app, with the same account.
            </p>
            <a href={WEB_APP_URL} className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#C6A15B]/60 px-5 py-2.5 text-[14px] font-semibold text-primary transition hover:bg-[#C6A15B]/10">
              Open the web app →
            </a>
          </section>

          <section aria-label="Scan to download" className="flex items-center gap-5 rounded-3xl border border-border bg-surface p-6">
            <Image src="/app-download-qr.png" alt="QR code for lawfic.pro/download" width={112} height={112} className="h-[112px] w-[112px] rounded-xl bg-white p-1.5" />
            <div>
              <p className="text-[15px] font-semibold text-foreground">On a computer?</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">Scan this with your phone&apos;s camera to open this page there.</p>
            </div>
          </section>
        </div>
      </div>

      <p className="mt-10 text-center text-[13px] text-muted-foreground">
        Questions? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>.
      </p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#C6A15B]/15 text-[12px] font-bold text-primary">{n}</span>
      <span>{children}</span>
    </li>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
    </svg>
  );
}

function AndroidMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path fill="#3DDC84" d="M17.6 9.48 19.44 6.3a.38.38 0 0 0-.66-.38l-1.86 3.22a11.6 11.6 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52ZM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
    </svg>
  );
}

/* A plain phone outline rather than Apple's logo, which is theirs. */
function AppleMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="text-foreground">
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M10.5 18.5h3" strokeLinecap="round" />
    </svg>
  );
}
