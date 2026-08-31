import WalletTabs from "@/components/wallet/WalletTabs";

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wallet-scene min-h-[80vh]">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] opacity-40">
            LAWFiC Wallet
          </p>
        </div>
        <WalletTabs />
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
