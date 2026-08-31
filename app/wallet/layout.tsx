import WalletTabs from "@/components/wallet/WalletTabs";

/**
 * Shared presentation for every /wallet route: a self-contained dark, glassy
 * backdrop (CRED-style) with the gold-accented sub-navigation above the page
 * content. The site-wide header/tabs/footer come from ThemeShell around this.
 */
export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wallet-scene min-h-[80vh]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
            LAWFiC Wallet
          </p>
        </div>
        <WalletTabs />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
